import { supabase } from '../lib/supabase';

// Detect device type
export const getDeviceType = (): 'mobile' | 'desktop' => {
  const width = window.innerWidth;
  return width < 768 ? 'mobile' : 'desktop';
};

// Get user agent
const getUserAgent = (): string => {
  return navigator.userAgent || '';
};

// Get referrer
const getReferrer = (): string => {
  return document.referrer || '';
};

// Declare gtag function type
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Initialize gtag if not present
const initGtag = () => {
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer!.push(arguments);
    };
  }
};

/**
 * Track GA4 event
 */
export const trackGA4Event = (
  eventName: string,
  params: Record<string, any> = {}
) => {
  try {
    initGtag();

    const eventParams = {
      ...params,
      device: getDeviceType(),
      timestamp: new Date().toISOString(),
    };

    if (window.gtag) {
      window.gtag('event', eventName, eventParams);
      console.log('GA4 Event tracked:', eventName, eventParams);
    }
  } catch (error) {
    console.error('Error tracking GA4 event:', error);
  }
};

/**
 * Capture email in database
 * This is called immediately when a valid email is entered
 */
export const captureEmail = async (
  email: string,
  pageSource: string,
  formType: string,
  metadata: Record<string, any> = {}
): Promise<string | null> => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return null;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if this exact capture already exists (within last 5 minutes to avoid spam)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: existingCapture } = await supabase
      .from('email_captures')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('page_source', pageSource)
      .eq('form_type', formType)
      .gte('created_at', fiveMinutesAgo)
      .maybeSingle();

    if (existingCapture) {
      console.log('Email already captured recently, skipping');
      return existingCapture.id;
    }

    // Insert email capture
    const { data, error } = await supabase
      .from('email_captures')
      .insert([
        {
          email: normalizedEmail,
          page_source: pageSource,
          form_type: formType,
          device_type: getDeviceType(),
          user_agent: getUserAgent(),
          referrer: getReferrer(),
          form_completed: false,
          metadata: metadata,
        },
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error capturing email:', error);
      return null;
    }

    console.log('Email captured:', normalizedEmail, 'on', pageSource);

    // Track GA4 event
    trackGA4Event('email_entered', {
      page_source: pageSource,
      form_type: formType,
    });

    return data.id;
  } catch (error) {
    console.error('Error in captureEmail:', error);
    return null;
  }
};

/**
 * Mark email capture as form completed
 */
export const markFormCompleted = async (captureId: string) => {
  try {
    await supabase
      .from('email_captures')
      .update({ form_completed: true, updated_at: new Date().toISOString() })
      .eq('id', captureId);
  } catch (error) {
    console.error('Error marking form completed:', error);
  }
};

/**
 * Track quittance generation
 */
export const trackQuittanceGenerated = (pageSource: string, metadata: Record<string, any> = {}) => {
  trackGA4Event('quittance_generated', {
    page_source: pageSource,
    ...metadata,
  });
};

/**
 * Track PDF download
 */
export const trackPdfDownload = (pageSource: string, pdfType: string = 'quittance') => {
  trackGA4Event('pdf_downloaded', {
    page_source: pageSource,
    pdf_type: pdfType,
  });
};

/**
 * Track free account creation
 */
export const trackFreeAccountCreated = (pageSource: string) => {
  trackGA4Event('free_account_created', {
    page_source: pageSource,
  });
};

/**
 * Track CTA clicks
 */
export const trackCtaClick = (ctaName: string, pageSource: string, destination?: string) => {
  trackGA4Event('cta_automation_clicked', {
    cta_name: ctaName,
    page_source: pageSource,
    destination: destination || '',
  });
};

/**
 * Track subscription actions
 */
export const trackSubscriptionEvent = (action: string, plan: string, pageSource: string) => {
  trackGA4Event('subscription_action', {
    action: action,
    plan: plan,
    page_source: pageSource,
  });
};

/**
 * Link email capture to proprietaire account
 */
export const linkEmailToProprietaire = async (email: string, proprietaireId: string) => {
  try {
    await supabase
      .from('email_captures')
      .update({
        proprietaire_id: proprietaireId,
        converted: true,
        updated_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase().trim());
  } catch (error) {
    console.error('Error linking email to proprietaire:', error);
  }
};
