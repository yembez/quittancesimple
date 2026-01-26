import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    const body = await req.text();

    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    await handleInvoicePayment(invoice);
    return;
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    await handleSubscriptionCancelled(subscription);
    return;
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
      await handleSubscriptionCancelled(subscription);
    }
    return;
  }

  if (!('customer' in stripeData)) {
    return;
  }

  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;

      isSubscription = mode === 'subscription';

      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    }

    const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);

      if (event.type === 'checkout.session.completed') {
        const session = stripeData as Stripe.Checkout.Session;
        const nbLocatairesParsed = session.success_url ? new URL(session.success_url).searchParams.get('nb_locataires') : null;
        const nbLocataires = nbLocatairesParsed ? parseInt(nbLocatairesParsed) : 0;

        if (nbLocataires > 1) {
          console.info(`Adding metered usage for ${nbLocataires - 1} additional tenants`);
          await addMeteredUsageForAdditionalTenants(customerId, nbLocataires - 1);
        }

        // Envoyer l'email de confirmation de souscription et activer l'abonnement dans proprietaires
        const customerEmail = session.customer_details?.email || session.customer_email;
        if (customerEmail) {
          console.info(`Sending subscription confirmation email to ${customerEmail}`);
          await sendSubscriptionConfirmationEmail(customerEmail, nbLocataires, session);

          // Activer l'abonnement dans la table proprietaires
          const planName = session.metadata?.plan_name || 'Quittance Simple';
          await activateProprietaireSubscription(customerEmail, planName);
        }
      }
    } else if (mode === 'payment' && payment_status === 'paid') {
      try {
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
          metadata,
        } = stripeData as Stripe.Checkout.Session;

        if (metadata?.type === 'registered_mail') {
          console.info('Processing registered mail payment');
          await processRegisteredMailPayment(metadata, payment_intent as string);
        } else {
          const { error: orderError } = await supabase.from('stripe_orders').insert({
            checkout_session_id,
            payment_intent_id: payment_intent,
            customer_id: customerId,
            amount_subtotal,
            amount_total,
            currency,
            payment_status,
            status: 'completed',
          });

          if (orderError) {
            console.error('Error inserting order:', orderError);
            return;
          }
        }
        console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
      } catch (error) {
        console.error('Error processing one-time payment:', error);
      }
    }
  }
}

async function sendSubscriptionConfirmationEmail(
  email: string,
  nbLocataires: number,
  session: Stripe.Checkout.Session
) {
  try {
    // Récupérer le proprietaire
    const { data: proprietaire } = await supabase
      .from('proprietaires')
      .select('nom, prenom, plan_actuel')
      .eq('email', email)
      .maybeSingle();

    const nom = proprietaire?.nom || '';
    const prenom = proprietaire?.prenom || '';
    const planActuel = proprietaire?.plan_actuel || 'Quittance Automatique';

    // Calculer le montant
    const amountTotal = session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00';

    // Appeler l'edge function send-welcome-email qui va envoyer l'email de confirmation
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-subscription-confirmation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        email,
        nom,
        prenom,
        planActuel,
        nbLocataires,
        montantTotal: amountTotal,
      }),
    });

    if (!response.ok) {
      console.error('Error sending subscription confirmation email:', await response.text());
    } else {
      console.info('Subscription confirmation email sent successfully');
    }
  } catch (error) {
    console.error('Error in sendSubscriptionConfirmationEmail:', error);
  }
}

async function addMeteredUsageForAdditionalTenants(customerId: string, additionalTenants: number) {
  try {
    console.info(`Attempting to add metered usage for ${additionalTenants} additional tenants to customer ${customerId}`);

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      expand: ['data.items.data.price'],
    });

    if (subscriptions.data.length === 0) {
      console.error('No subscription found for customer');
      return;
    }

    const subscription = subscriptions.data[0];
    console.info(`Found subscription ${subscription.id} with status: ${subscription.status}`);
    console.info(`Subscription has ${subscription.items.data.length} items`);

    for (const item of subscription.items.data) {
      console.info(`Item: ${item.id}, Price: ${item.price.id}, Recurring usage type: ${item.price.recurring?.usage_type}`);
    }

    const meteredItem = subscription.items.data.find(item =>
      item.price.recurring?.usage_type === 'metered'
    );

    if (meteredItem) {
      console.info(`Found metered item: ${meteredItem.id} with price ${meteredItem.price.id}`);

      const usageRecord = await stripe.subscriptionItems.createUsageRecord(meteredItem.id, {
        quantity: additionalTenants,
        timestamp: Math.floor(Date.now() / 1000),
      });

      console.info(`Successfully created usage record: ${usageRecord.id} with quantity ${additionalTenants}`);
    } else {
      console.warn('No metered price item found in subscription items');
    }
  } catch (error: any) {
    console.error('Error adding metered usage:', error.message, error);
  }
}

async function processRegisteredMailPayment(metadata: any, paymentIntentId: string) {
  try {
    console.info('Processing registered mail payment with request_id:', metadata.request_id);

    // Récupérer la request existante depuis la DB
    const { data: requestData, error: fetchError } = await supabase
      .from('registered_mail_requests')
      .select('*')
      .eq('id', metadata.request_id)
      .single();

    if (fetchError || !requestData) {
      console.error('Error fetching registered mail request:', fetchError);
      throw new Error('Request not found in database');
    }

    console.info('Found existing request:', requestData.id);

    // Upload le document HTML dans le storage
    const fileName = `revision-loyer-${Date.now()}.html`;
    const filePath = `registered-mail/${requestData.proprietaire_id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('quittances')
      .upload(filePath, requestData.document_html || '', {
        contentType: 'text/html',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading document:', uploadError);
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('quittances')
      .getPublicUrl(filePath);

    const pdfUrl = publicUrlData.publicUrl;

    // Mettre à jour la request avec le payment_intent et le pdf_url
    const { error: updateError } = await supabase
      .from('registered_mail_requests')
      .update({
        stripe_payment_intent: paymentIntentId,
        pdf_url: pdfUrl,
        status: 'pending',
      })
      .eq('id', requestData.id);

    if (updateError) {
      console.error('Error updating registered mail request:', updateError);
      throw updateError;
    }

    console.info('Registered mail request updated, sending notifications...');

    const adminResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-registered-mail-admin-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          requestId: requestData.id,
          baillorName: requestData.baillor_name,
          baillorAddress: requestData.baillor_address,
          baillorEmail: requestData.baillor_email,
          locataireName: requestData.locataire_name,
          locataireAddress: requestData.locataire_address,
          logementAddress: requestData.logement_address,
          ancienLoyer: requestData.ancien_loyer,
          nouveauLoyer: requestData.nouveau_loyer,
          irlAncien: requestData.irl_ancien,
          irlNouveau: requestData.irl_nouveau,
          trimestre: requestData.trimestre,
          anneeAncienne: requestData.annee_ancienne,
          anneeNouvelle: requestData.annee_nouvelle,
          dateBail: requestData.date_bail,
          sendMode: requestData.send_mode,
          pdfUrl: pdfUrl,
          paymentIntent: paymentIntentId,
        }),
      }
    );

    if (!adminResponse.ok) {
      console.error('Error sending admin notification:', await adminResponse.text());
    } else {
      console.info('Admin notification sent successfully');
    }

    const userResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-registered-mail-user-confirmation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          requestId: requestData.id,
          baillorName: requestData.baillor_name,
          baillorEmail: requestData.baillor_email,
          locataireName: requestData.locataire_name,
          locataireAddress: requestData.locataire_address,
          nouveauLoyer: requestData.nouveau_loyer,
          ancienLoyer: requestData.ancien_loyer,
          sendMode: requestData.send_mode,
        }),
      }
    );

    if (!userResponse.ok) {
      console.error('Error sending user confirmation:', await userResponse.text());
    } else {
      console.info('User confirmation sent successfully');
    }

    console.info('Registered mail request processed successfully');
  } catch (error) {
    console.error('Error in processRegisteredMailPayment:', error);
    throw error;
  }
}

async function handleInvoicePayment(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    const amount = invoice.amount_paid / 100;

    console.info(`Processing invoice payment for customer: ${customerId}, amount: ${amount}`);

    const customer = await stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted');
      return;
    }

    const customerEmail = (customer as Stripe.Customer).email;
    if (!customerEmail) {
      console.error('Customer email not found');
      return;
    }

    const { data: proprietaire } = await supabase
      .from('proprietaires')
      .select('id, nom, prenom, email')
      .eq('email', customerEmail)
      .maybeSingle();

    if (!proprietaire) {
      console.error(`Proprietaire not found for email: ${customerEmail}`);
      return;
    }

    const numeroFacture = `FAC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`;
    const dateEmission = new Date(invoice.created * 1000);
    const periodeDebut = new Date(invoice.period_start * 1000);
    const periodeFin = new Date(invoice.period_end * 1000);
    const dateEcheance = invoice.due_date ? new Date(invoice.due_date * 1000) : new Date(dateEmission.getTime() + 15 * 24 * 60 * 60 * 1000);

    const invoicePdfUrl = invoice.invoice_pdf;

    const { data: factureData, error: factureError } = await supabase
      .from('factures')
      .insert({
        proprietaire_id: proprietaire.id,
        numero_facture: numeroFacture,
        date_emission: dateEmission.toISOString(),
        date_echeance: dateEcheance.toISOString(),
        montant: amount,
        statut: 'payee',
        plan: proprietaire.plan_actuel || 'Quittance Simple',
        periode_debut: periodeDebut.toISOString(),
        periode_fin: periodeFin.toISOString(),
        stripe_invoice_id: invoice.id,
        stripe_payment_intent: invoice.payment_intent as string,
        pdf_url: invoicePdfUrl || null,
      })
      .select()
      .single();

    if (factureError) {
      console.error('Error creating facture:', factureError);
      return;
    }

    console.info(`Created facture ${numeroFacture} for proprietaire ${proprietaire.id}`);

    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-invoice-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        email: customerEmail,
        nom: proprietaire.nom,
        prenom: proprietaire.prenom,
        numeroFacture,
        montant: amount,
        dateEmission: dateEmission.toISOString(),
        periodeDebut: periodeDebut.toISOString(),
        periodeFin: periodeFin.toISOString(),
        stripePdfUrl: invoicePdfUrl,
      }),
    });

    if (!emailResponse.ok) {
      console.error('Error sending invoice email:', await emailResponse.text());
    } else {
      console.info(`Invoice email sent successfully to ${customerEmail}`);
    }
  } catch (error) {
    console.error('Error in handleInvoicePayment:', error);
  }
}

async function activateProprietaireSubscription(email: string, planName: string) {
  try {
    console.info(`Activating subscription for proprietaire: ${email}, plan: ${planName}`);

    const { data: proprietaire, error: findError } = await supabase
      .from('proprietaires')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (findError || !proprietaire) {
      console.error(`Proprietaire not found for email: ${email}`, findError);
      return;
    }

    const { error: updateError } = await supabase
      .from('proprietaires')
      .update({
        abonnement_actif: true,
        plan_actuel: planName,
        lead_statut: 'QA_paid_subscriber',
      })
      .eq('id', proprietaire.id);

    if (updateError) {
      console.error('Error activating subscription:', updateError);
    } else {
      console.info(`Successfully activated subscription for ${email}`);
    }
  } catch (error) {
    console.error('Error in activateProprietaireSubscription:', error);
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    console.info(`Handling subscription cancellation for customer: ${customerId}`);

    const customer = await stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted:', customerId);
      return;
    }

    const customerEmail = (customer as Stripe.Customer).email;
    if (!customerEmail) {
      console.error('No email found for customer:', customerId);
      return;
    }

    const { data: proprietaire, error: findError } = await supabase
      .from('proprietaires')
      .select('id, email')
      .eq('email', customerEmail)
      .maybeSingle();

    if (findError || !proprietaire) {
      console.error(`Proprietaire not found for email: ${customerEmail}`, findError);
      return;
    }

    const { error: updateError } = await supabase
      .from('proprietaires')
      .update({
        abonnement_actif: false,
        lead_statut: 'cancelled',
      })
      .eq('id', proprietaire.id);

    if (updateError) {
      console.error('Error updating proprietaire after cancellation:', updateError);
    } else {
      console.info(`Successfully marked subscription as cancelled for ${customerEmail}`);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionCancelled:', error);
  }
}

async function syncCustomerFromStripe(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          subscription_status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }

    const subscription = subscriptions.data[0];

    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}
