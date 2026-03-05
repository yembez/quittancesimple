#!/usr/bin/env node
/**
 * Lit un export CSV Resend (emails envoyés) et génère le SQL pour mettre à jour
 * campaign_j2_sent_at (ou j5/j8) sur la table proprietaires.
 *
 * Usage:
 *   node scripts/sync-campaign-from-resend-csv.mjs <fichier.csv>
 *   node scripts/sync-campaign-from-resend-csv.mjs <fichier.csv> > update_campaign_j2.sql
 *
 * Puis exécuter le SQL dans Supabase (SQL Editor).
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';

// Ligne doit contenir ce texte pour être considérée comme envoi campagne J+2
const J2_SUBJECT_MARKER = 'Votre Espace Bailleur est prêt';
const FROM_MARKER = 'Quittance Simple <noreply@quittancesimple.fr>';

function escapeSql(str) {
  if (str == null) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function parseLine(line) {
  // Colonnes Resend: id, created_at, subject, from, to, cc, bcc, reply_to, last_event, sent_at, ...
  // Pattern: ...@quittancesimple.fr>,TO,,,,LAST_EVENT,SENT_AT,...
  const match = line.match(/@quittancesimple\.fr>,([^,]+),,,,[^,]+,([^,]+),/);
  if (!match) return null;
  const [, to, sentAt] = match;
  const email = (to || '').trim();
  const sent = (sentAt || '').trim();
  if (!email || !sent || !email.includes('@')) return null;
  return { email, sent_at: sent };
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('Usage: node scripts/sync-campaign-from-resend-csv.mjs <fichier.csv>');
    process.exit(1);
  }

  const rl = createInterface({
    input: createReadStream(csvPath),
    crlfDelay: Infinity,
  });

  // email (lowercase) -> { email (original), sent_at (earliest) }
  const byEmail = new Map();

  let first = true;
  for await (const line of rl) {
    if (first) {
      first = false;
      if (line.includes('created_at') && line.includes('subject')) continue; // skip header
    }
    if (!line.includes(J2_SUBJECT_MARKER) || !line.includes(FROM_MARKER)) continue;
    const parsed = parseLine(line);
    if (!parsed) continue;

    const key = parsed.email.toLowerCase();
    const existing = byEmail.get(key);
    if (!existing || parsed.sent_at < existing.sent_at) {
      byEmail.set(key, { email: parsed.email, sent_at: parsed.sent_at });
    }
  }

  const j2Rows = [...byEmail.values()];
  if (j2Rows.length === 0) {
    console.error('Aucun envoi campagne J+2 trouvé dans le CSV.');
    process.exit(0);
  }

  console.error(`-- ${j2Rows.length} destinataire(s) campagne J+2 (sujet "Votre Espace Bailleur est prêt")`);
  console.error('-- Exécuter ce script dans Supabase → SQL Editor');
  console.log('BEGIN;');
  for (const r of j2Rows) {
    console.log(
      `UPDATE proprietaires SET campaign_j2_sent_at = ${escapeSql(r.sent_at)} WHERE LOWER(TRIM(email)) = ${escapeSql(r.email.toLowerCase())} AND (campaign_j2_sent_at IS NULL OR campaign_j2_sent_at > ${escapeSql(r.sent_at)});`
    );
  }
  console.log('COMMIT;');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
