/**
 * Parse une étiquette de période du type "Janvier 2026" (formulaire quittance gratuite).
 * Gère espaces insécables, espaces multiples, casse et accents (février / fevrier, août / aout).
 */

const MONTH_INDEX_BY_ASCII: Record<string, number> = {
  janvier: 0,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  decembre: 11,
};

function normalizeMonthLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Retourne { monthIndex, year } (monthIndex 0 = janvier) ou null si non parsable.
 */
export function parseFrenchPeriodLabel(periode: string | undefined | null): {
  monthIndex: number;
  year: number;
} | null {
  if (!periode || typeof periode !== 'string') return null;

  const cleaned = periode
    .trim()
    .replace(/[\u00a0\u202f\u2009]/g, ' ')
    .replace(/\s+/g, ' ');

  const m = cleaned.match(/^(.+?)\s(\d{4})$/);
  if (!m) return null;

  const monthKey = normalizeMonthLabel(m[1]);
  const year = parseInt(m[2], 10);
  if (!Number.isFinite(year)) return null;

  const monthIndex = MONTH_INDEX_BY_ASCII[monthKey];
  if (monthIndex === undefined) return null;

  return { monthIndex, year };
}
