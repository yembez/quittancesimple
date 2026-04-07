import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { sendOwnerReminderEmail } from "../_shared/owner-reminder-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateShortCode(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getMonthName(month: number): string {
  const months = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
  ];
  return months[month];
}

function generateToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('🤖 CRON job auto-send-quittances started');

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const parisDay = parisTime.getDate();
    const parisHour = parisTime.getHours();
    const parisMinute = parisTime.getMinutes();

    console.log(`⏰ Paris time: Day ${parisDay}, ${parisHour}:${parisMinute}`);

    // ----- J+5 : envoi automatique des quittances systématiques échues -----
    const nowIso = now.toISOString();
    const { data: rowsToSendAuto, error: errJ5 } = await supabase
      .from('quittances_systematic')
      .select(`
        id,
        locataire_id,
        proprietaire_id,
        periode,
        locataires (
          id,
          nom,
          prenom,
          email,
          adresse_logement,
          loyer_mensuel,
          charges_mensuelles
        ),
        proprietaires (
          id,
          nom,
          prenom,
          email,
          adresse,
          telephone,
          features_enabled
        )
      `)
      .lte('date_envoi_auto', nowIso)
      .eq('status', 'pending_owner_action');

    if (!errJ5 && rowsToSendAuto && rowsToSendAuto.length > 0) {
      console.log(`📤 J+5: ${rowsToSendAuto.length} quittance(s) à envoyer automatiquement`);
      for (const row of rowsToSendAuto) {
        const loc = row.locataires as Record<string, unknown> | null;
        const prop = row.proprietaires as Record<string, unknown> | null;
        if (!loc || !prop) {
          console.error(`❌ J+5: missing locataire or proprietaire for row ${row.id}`);
          continue;
        }
        const fe = prop.features_enabled as { auto_send?: boolean } | null | undefined;
        if (fe && fe.auto_send === false) {
          console.log(`⏭️ J+5: skip row ${row.id} (features_enabled.auto_send=false)`);
          continue;
        }
        const locataireName = [loc.prenom, loc.nom].filter(Boolean).join(' ').trim() || String(loc.nom || '');
        const proprietaireName = [prop.prenom, prop.nom].filter(Boolean).join(' ').trim() || String(prop.nom || '');
        const payload = {
          action: 'auto_send',
          locataireId: row.locataire_id,
          locataireEmail: loc.email ?? '',
          locataireName: locataireName || String(loc.nom),
          logementAddress: loc.adresse_logement ?? '',
          baillorEmail: prop.email,
          baillorName: proprietaireName,
          baillorAddress: prop.adresse ?? '',
          nomProprietaire: prop.nom ?? '',
          prenomProprietaire: prop.prenom ?? '',
          isElectronicSignature: true,
          periode: row.periode,
          loyer: String(Number(loc.loyer_mensuel) || 0),
          charges: String(Number(loc.charges_mensuelles) || 0),
        };
        try {
          const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-quittance`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify(payload),
          });
          const sendResult = await sendRes.json();
          if (sendRes.ok && sendResult.success) {
            await supabase.from('quittances_systematic').update({ status: 'sent_auto' }).eq('id', row.id);
            console.log(`✅ J+5: quittance envoyée pour locataire ${row.locataire_id} – ${row.periode}`);
          } else {
            console.error(`❌ J+5: send-quittance failed for row ${row.id}:`, sendResult.error);
          }
        } catch (e) {
          console.error(`❌ J+5: error calling send-quittance for row ${row.id}:`, e);
        }
      }
    }

    const baseSelect = `
      id,
      nom,
      prenom,
      loyer_mensuel,
      charges_mensuelles,
      date_rappel,
      heure_rappel,
      minute_rappel,
      proprietaire_id,
      proprietaires (
        id,
        nom,
        prenom,
        telephone,
        email,
        features_enabled
      )
    `;
    let locataires: Array<Record<string, unknown>> | null = null;
    let locatairesError: { message?: string; code?: string } | null = null;

    const { data: dataWithMode, error: errWithMode } = await supabase
      .from('locataires')
      .select(`${baseSelect}, mode_envoi_quittance`)
      .eq('date_rappel', parisDay)
      .eq('heure_rappel', parisHour)
      .eq('minute_rappel', parisMinute);

    if (errWithMode) {
      const err = errWithMode as { message?: string; code?: string; details?: string };
      const msg = String(err.message || err.details || '');
      const columnMissing = /mode_envoi_quittance|column.*does not exist/i.test(msg) || err.code === 'PGRST204' || err.code === '42703';
      if (columnMissing) {
        const { data: dataWithoutMode, error: errWithoutMode } = await supabase
          .from('locataires')
          .select(baseSelect)
          .eq('date_rappel', parisDay)
          .eq('heure_rappel', parisHour)
          .eq('minute_rappel', parisMinute);
        locataires = dataWithoutMode ?? null;
        locatairesError = errWithoutMode;
      } else {
        locatairesError = errWithMode;
      }
    } else {
      locataires = dataWithMode;
    }

    if (locatairesError) {
      console.error('Error fetching locataires:', locatairesError);
      throw locatairesError;
    }

    console.log(`📋 Found ${locataires?.length || 0} locataires to check`);

    if (!locataires || locataires.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No reminders to send at this time',
          checked_at: now.toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const results = [];

    for (const locataire of locataires) {
      try {
        console.log(`✅ Processing ${locataire.prenom} ${locataire.nom}`);

        const rawProprietaire = locataire.proprietaires;
        const proprietaire = Array.isArray(rawProprietaire) ? rawProprietaire[0] : rawProprietaire;
        const propFe = (proprietaire as Record<string, unknown> | undefined)?.features_enabled as
          | { reminders?: boolean; auto_send?: boolean }
          | null
          | undefined;
        if (propFe && propFe.reminders === false) {
          console.log(`⏭️ Skip rappels locataire ${locataire.id} (features_enabled.reminders=false)`);
          continue;
        }

        const month = parisTime.getMonth();
        const year = parisTime.getFullYear();
        const monthName = getMonthName(month);
        const montantTotal = (locataire.loyer_mensuel || 0) + (locataire.charges_mensuelles || 0);

        const modeEnvoi = locataire.mode_envoi_quittance;
        const useSystematicPreavis = modeEnvoi === 'systematic_preavis_5j';

        // Mode envoi systématique avec préavis 5j uniquement si explicitement choisi ; sinon rappel classique (SMS + email)
        if (useSystematicPreavis) {
          console.log(`📋 Branch systematic_preavis_5j for locataire ${locataire.id} (${locataire.prenom} ${locataire.nom}) – préavis J, envoi auto J+5, pas de SMS`);
          const periode = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
          const dateEnvoiAuto = new Date(parisTime.getTime() + 5 * 24 * 60 * 60 * 1000);
          const tokenSendManual = generateToken(32);
          const tokenExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

          const { data: systematicRow, error: systematicError } = await supabase
            .from('quittances_systematic')
            .upsert(
              {
                locataire_id: locataire.id,
                proprietaire_id: locataire.proprietaire_id,
                periode,
                date_preavis: parisTime.toISOString(),
                date_envoi_auto: dateEnvoiAuto.toISOString(),
                status: 'pending_owner_action',
                action_token_send_manual: tokenSendManual,
                action_token_expires_at: tokenExpiresAt,
              },
              { onConflict: 'locataire_id,periode' }
            )
            .select('id')
            .single();

          if (systematicError) {
            console.error('❌ Error creating quittances_systematic row:', systematicError);
            results.push({
              locataire_id: locataire.id,
              success: false,
              error: 'Failed to create quittances_systematic row'
            });
          } else {
            console.log(`📝 Created/updated quittances_systematic for locataire ${locataire.id} – période ${periode}`);
            let preavisSent = false;
            if (!systematicRow?.id) {
              console.error('⚠️ No systematicRow.id, skipping preavis email');
            } else if (!proprietaire?.email || !String(proprietaire.email).trim()) {
              console.error('⚠️ Propriétaire email manquant – préavis non envoyé. proprietaire_id:', locataire.proprietaire_id);
            } else {
              try {
                const preavisRes = await fetch(`${supabaseUrl}/functions/v1/send-systematic-preavis`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                  },
                  body: JSON.stringify({ scheduledId: systematicRow.id }),
                });
                const preavisResult = await preavisRes.json().catch(() => ({}));
                preavisSent = preavisRes.ok && preavisResult.success;
                if (preavisSent) {
                  console.log(`📧 Préavis envoyé au propriétaire pour ${locataire.prenom} ${locataire.nom} – ${periode}`);
                } else {
                  console.error('⚠️ send-systematic-preavis failed. status:', preavisRes.status, 'body:', preavisResult.error || preavisResult);
                }
              } catch (e) {
                console.error('⚠️ send-systematic-preavis error:', e);
              }
            }
            results.push({
              locataire_id: locataire.id,
              success: true,
              mode: 'systematic_preavis_5j',
              preavis_sent: preavisSent
            });
          }
        } else {
          // Mode rappel classique : SMS + short link + email de rappel (comportement inchangé)
          console.log(`📱 Classic SMS flow for locataire ${locataire.id} (mode_envoi_quittance=${modeEnvoi ?? 'null/undefined'})`);
          const propForCheck = proprietaire as Record<string, unknown> | null;
          const hasTelephone = propForCheck && String(propForCheck.telephone ?? propForCheck.phone ?? '').trim();
          if (!proprietaire || !hasTelephone) {
            console.error(`❌ No proprietaire or telephone for locataire ${locataire.id}`);
            results.push({
              locataire_id: locataire.id,
              success: false,
              error: 'No proprietaire or telephone'
            });
            continue;
          }

          const prop = proprietaire as Record<string, unknown>;
          const telephoneStr = String(prop?.telephone ?? prop?.phone ?? '').trim();

          // E-mail bailleur : le join PostgREST peut parfois ne pas exposer email ; on relit la ligne si besoin.
          let bailleurEmail = String(prop?.email ?? '').trim();
          if (!bailleurEmail && locataire.proprietaire_id) {
            const { data: pRow, error: emailFetchErr } = await supabase
              .from('proprietaires')
              .select('email')
              .eq('id', locataire.proprietaire_id)
              .maybeSingle();
            if (emailFetchErr) {
              console.error('⚠️ Lecture email proprietaires (fallback):', emailFetchErr);
            }
            bailleurEmail = String(pRow?.email ?? '').trim();
            if (bailleurEmail) {
              console.log(`📧 Email bailleur récupéré depuis la table proprietaires (fallback embed)`);
            }
          }

          // 1) E-mail d'abord (Resend directement — + clé Resend via env ou Vault comme le reste du projet)
          let emailResult: { success: boolean; error?: string } = { success: false, error: 'No email configured' };
          if (bailleurEmail) {
            console.log(`📧 Sending owner reminder email (inline Resend) for locataire=${locataire.id}`);
            const sent = await sendOwnerReminderEmail({
              proprietaireId: String(prop.id ?? ''),
              proprietaireEmail: bailleurEmail,
              proprietaireName: `${prop.prenom || ''} ${prop.nom || ''}`.trim(),
              locataireName: `${locataire.prenom || ''} ${locataire.nom || ''}`.trim(),
              locataireId: String(locataire.id),
              mois: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`,
              annee: year,
              montantTotal: montantTotal,
            });
            if (sent.success) {
              emailResult = { success: true };
              console.log(`✅ Email rappel envoyé (bailleur)`);
            } else {
              emailResult = { success: false, error: sent.error };
              console.error(`⚠️ Email failed:`, sent.error);
            }
          } else {
            console.error(`⚠️ Aucun e-mail bailleur pour proprietaire_id=${String(prop?.id ?? locataire.proprietaire_id)} — impossible d'envoyer le mail (le SMS peut quand même partir)`);
          }

          // 2) Short link + SMS ensuite
          const shortCode = generateShortCode(6);
          const { error: shortLinkError } = await supabase
            .from('short_links')
            .insert({
              id: shortCode,
              proprietaire_id: locataire.proprietaire_id,
              locataire_id: locataire.id,
              mois: monthName,
              annee: year,
              action: 'send',
              source: 'sms',
              expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });

          if (shortLinkError) {
            console.error('Error creating short link:', shortLinkError);
            results.push({
              locataire_id: locataire.id,
              success: false,
              error: 'Failed to create short link',
              email_sent: emailResult.success
            });
            continue;
          }

          console.log(`🔗 Short link created: ${shortCode}`);

          let smsResult: Record<string, unknown> = { success: false };
          if (telephoneStr) {
            const smsPayload = {
              telephone: telephoneStr,
              proprietaireName: `${prop?.prenom ?? ''} ${prop?.nom ?? ''}`.trim(),
              locataireName: `${locataire.prenom ?? ''} ${locataire.nom ?? ''}`.trim(),
              shortCode: shortCode,
              montantTotal: montantTotal
            };
            console.log(`📤 Calling send-owner-reminder-sms-v2 with telephone=***${telephoneStr.slice(-4)} (len=${telephoneStr.length})`);
            try {
              const smsResponse = await fetch(
                `${supabaseUrl}/functions/v1/send-owner-reminder-sms-v2`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                  },
                  body: JSON.stringify(smsPayload),
                }
              );
              smsResult = await smsResponse.json().catch(() => ({}));
              if (smsResponse.ok && (smsResult as { success?: boolean }).success) {
                console.log(`📱 SMS envoyé au propriétaire pour ${locataire.prenom} ${locataire.nom}`);
              } else {
                const errBody = smsResult as { error?: string; provider?: string };
                console.error(`⚠️ send-owner-reminder-sms-v2 failed: status=${smsResponse.status} error=${errBody?.error ?? 'unknown'} provider=${errBody?.provider ?? '-'} full=`, JSON.stringify(smsResult));
              }
            } catch (smsFetchError) {
              const errMsg = (smsFetchError as Error).message;
              console.error(`⚠️ send-owner-reminder-sms-v2 fetch error (network/timeout):`, errMsg);
              smsResult = { success: false, error: errMsg };
            }
          } else {
            console.error(`❌ Telephone manquant pour propriétaire (locataire ${locataire.id}) – SMS non envoyé. Proprietaire keys: ${Object.keys(prop || {}).join(', ')}`);
          }

          const smsOk = (smsResult as { success?: boolean }).success === true;
          const emailOk = emailResult.success === true;
          const bothOk = smsOk && emailOk;

          if (bothOk) {
            console.log(`✅ SMS + e-mail OK pour ${locataire.prenom} ${locataire.nom}`);
            results.push({
              locataire_id: locataire.id,
              success: true,
              shortCode: shortCode,
              sms_provider: (smsResult as { data?: { provider?: string } }).data?.provider,
              email_sent: true
            });
          } else {
            const errMsg = `SMS (${smsOk ? 'ok' : 'failed'}) + Email (${emailOk ? 'ok' : 'failed'})${emailResult.error ? `: ${emailResult.error}` : ''}`;
            console.error(`❌ Rappel incomplet:`, errMsg);
            results.push({
              locataire_id: locataire.id,
              success: false,
              error: errMsg,
              email_sent: emailOk,
              sms_sent: smsOk
            });
          }
        }

      } catch (error) {
        console.error(`❌ Error processing locataire ${locataire.id}:`, error);
        results.push({
          locataire_id: locataire.id,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`✅ CRON job completed. Processed ${results.length} locataires`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results: results,
        executed_at: now.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ CRON job error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});