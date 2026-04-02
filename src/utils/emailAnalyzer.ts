/**
 * Analyse des e-mails et segmentation des leads pour campagnes marketing.
 */

export interface EmailAnalysis {
  email: string;
  isValid: boolean;
  isTest: boolean;
  hasTypo: boolean;
  reason?: string;
}

export type SegmentType = 'hot' | 'warm' | 'cold' | 'inactive' | 'invalid';

export interface LeadSegment {
  id: number | string;
  email: string;
  nom: string;
  prenom: string;
  created_at: string;
  nombre_quittances: number;
  segment: SegmentType;
  days_since_signup: number;
  device_type?: string | null;
  lead_statut?: string | null;
  /** Compte Auth lié : les campagnes J+2/J+5/J+8 « cold » excluent les lignes avec user_id. */
  user_id?: string | null;
  campaign_j2_sent_at?: string | null;
  campaign_j5_sent_at?: string | null;
  campaign_j8_sent_at?: string | null;
  campaign_j2_fix_sent_at?: string | null;
}

export interface ProprietaireRow {
  id: number | string;
  email?: string | null;
  nom?: string | null;
  prenom?: string | null;
  created_at?: string | null;
  nombre_quittances?: number | null;
  lead_statut?: string | null;
  device_type?: string | null;
  campaign_j2_sent_at?: string | null;
  campaign_j5_sent_at?: string | null;
  campaign_j8_sent_at?: string | null;
  campaign_j2_fix_sent_at?: string | null;
  user_id?: string | null;
}

export interface AnalyzeLeadsResult {
  validLeads: LeadSegment[];
  invalidLeads: Array<ProprietaireRow & { reason?: string }>;
  segments: {
    hot: LeadSegment[];
    warm: LeadSegment[];
    cold: LeadSegment[];
    inactive: LeadSegment[];
    invalid: LeadSegment[];
  };
  stats: {
    total: number;
    valid: number;
    invalid: number;
    test: number;
    withQuittances: number;
    withoutQuittances: number;
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEST_DOMAINS = ['@maildrop.cc', '@maidrop.cc'];
const TEST_PREFIXES = ['2speek'];
const TEMP_DOMAINS = [
  'yopmail.com',
  'yopmail.fr',
  'guerrillamail.com',
  'guerrillamail.org',
  'temp-mail.org',
  'tempmail.com',
  '10minutemail.com',
  'mailinator.com',
  'throwaway.email',
];
const TYPO_DOMAINS: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'yahou.fr': 'yahoo.fr',
  'yahou.com': 'yahoo.com',
  'yaho.fr': 'yahoo.fr',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
};

export function isValidEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const e = email.trim();
  return e.length >= 5 && EMAIL_REGEX.test(e);
}

export function isTestEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const e = email.trim().toLowerCase();
  if (TEST_DOMAINS.some((d) => e.endsWith(d))) return true;
  if (TEST_PREFIXES.some((p) => e.startsWith(p))) return true;
  return false;
}

export function isTempEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const domain = email.trim().toLowerCase().split('@')[1] || '';
  return TEMP_DOMAINS.some((d) => domain.includes(d));
}

export function hasTypo(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const domain = email.trim().toLowerCase().split('@')[1] || '';
  return domain in TYPO_DOMAINS;
}

export function analyzeEmail(email: string): EmailAnalysis {
  const e = (email || '').trim();
  if (!e) {
    return { email: e, isValid: false, isTest: false, hasTypo: false, reason: 'Vide' };
  }
  if (!isValidEmailFormat(e)) {
    return { email: e, isValid: false, isTest: false, hasTypo: false, reason: 'Format invalide' };
  }
  const lower = e.toLowerCase();
  if (TEST_DOMAINS.some((d) => lower.endsWith(d))) {
    return { email: e, isValid: false, isTest: true, hasTypo: false, reason: 'Domaine test (maildrop / similaire)' };
  }
  if (TEST_PREFIXES.some((p) => lower.startsWith(p))) {
    return { email: e, isValid: false, isTest: true, hasTypo: false, reason: 'Préfixe test (2speek)' };
  }
  if (isTempEmail(e)) {
    return { email: e, isValid: false, isTest: true, hasTypo: false, reason: 'Email temporaire' };
  }
  if (hasTypo(e)) {
    return { email: e, isValid: false, isTest: false, hasTypo: true, reason: 'Typo domaine (ex. gmai.com)' };
  }
  return { email: e, isValid: true, isTest: false, hasTypo: false };
}

export function daysSinceSignup(createdAt: string | null | undefined): number {
  if (!createdAt) return 0;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return 0;
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
}

export function determineSegment(
  nombreQuittances: number,
  daysSince: number,
  emailAnalysis: EmailAnalysis
): SegmentType {
  if (!emailAnalysis.isValid) return 'invalid';
  if (nombreQuittances === 0) return 'inactive';
  if (daysSince < 30) return 'hot';
  if (daysSince <= 90) return 'warm';
  return 'cold';
}

export function analyzeLeads(proprietaires: ProprietaireRow[]): AnalyzeLeadsResult {
  const validLeads: LeadSegment[] = [];
  const invalidLeads: Array<ProprietaireRow & { reason?: string }> = [];
  const segments = {
    hot: [] as LeadSegment[],
    warm: [] as LeadSegment[],
    cold: [] as LeadSegment[],
    inactive: [] as LeadSegment[],
    invalid: [] as LeadSegment[],
  };

  let testCount = 0;

  for (const p of proprietaires) {
    const email = (p.email || '').trim();
    const analysis = analyzeEmail(email);
    const nbQuittances = typeof p.nombre_quittances === 'number' ? p.nombre_quittances : 0;
    const daysSince = daysSinceSignup(p.created_at);
    const segment = determineSegment(nbQuittances, daysSince, analysis);

    const leadRow: LeadSegment = {
      id: p.id,
      email,
      nom: (p.nom ?? '').trim() || '',
      prenom: (p.prenom ?? '').trim() || '',
      created_at: p.created_at || '',
      nombre_quittances: nbQuittances,
      segment,
      days_since_signup: daysSince,
      device_type: p.device_type ?? null,
      lead_statut: p.lead_statut ?? null,
      user_id: p.user_id ?? null,
      campaign_j2_sent_at: p.campaign_j2_sent_at ?? null,
      campaign_j5_sent_at: p.campaign_j5_sent_at ?? null,
      campaign_j8_sent_at: p.campaign_j8_sent_at ?? null,
      campaign_j2_fix_sent_at: p.campaign_j2_fix_sent_at ?? null,
    };

    if (segment === 'invalid') {
      invalidLeads.push({ ...p, reason: analysis.reason });
      if (analysis.isTest) testCount++;
    } else {
      validLeads.push(leadRow);
      segments[segment].push(leadRow);
    }
  }

  const withQuittances = validLeads.filter((l) => l.nombre_quittances > 0).length;
  const withoutQuittances = validLeads.filter((l) => l.nombre_quittances === 0).length;

  return {
    validLeads,
    invalidLeads,
    segments,
    stats: {
      total: proprietaires.length,
      valid: validLeads.length,
      invalid: invalidLeads.length,
      test: testCount,
      withQuittances,
      withoutQuittances,
    },
  };
}

export function exportSegmentToCSV(
  leads: LeadSegment[],
  segmentName: string
): void {
  const date = new Date().toISOString().slice(0, 10);
  const header = 'email;nom;prenom;nombre_quittances;segment;days_since_signup;device_type;created_at\n';
  const lines = leads.map((l) =>
    [
      l.email,
      l.nom,
      l.prenom,
      String(l.nombre_quittances),
      l.segment,
      String(l.days_since_signup),
      l.device_type ?? '',
      l.created_at,
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(';')
  );
  const csv = '\uFEFF' + header + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads_${segmentName}_${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
