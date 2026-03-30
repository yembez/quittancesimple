import exifr from 'exifr';

export type ExtractedMediaMetadata = {
  /** ISO 8601 ou null si inconnue */
  capturedAt: string | null;
  latitude: number | null;
  longitude: number | null;
};

function coordsFromExif(tags: Record<string, unknown>): { lat: number; lng: number } | null {
  const lat = tags.latitude ?? tags.GPSLatitude;
  const lng = tags.longitude ?? tags.GPSLongitude;
  if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return { lat, lng };
  }
  return null;
}

function dateFromExif(tags: Record<string, unknown>): Date | null {
  const candidates = [tags.DateTimeOriginal, tags.CreateDate, tags.ModifyDate, tags.DateTime];
  for (const c of candidates) {
    if (c instanceof Date && !Number.isNaN(c.getTime())) return c;
    if (typeof c === 'string' || typeof c === 'number') {
      const d = new Date(c);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  return null;
}

/**
 * Extrait date et position depuis un fichier (principalement EXIF JPEG/PNG/WebP).
 * Vidéos : date de dernière modification du fichier souvent exposée par l’OS (approximation).
 */
export async function extractMediaMetadata(file: File): Promise<ExtractedMediaMetadata> {
  const fallbackDate =
    file.lastModified && !Number.isNaN(file.lastModified)
      ? new Date(file.lastModified).toISOString()
      : null;

  const empty: ExtractedMediaMetadata = {
    capturedAt: fallbackDate,
    latitude: null,
    longitude: null,
  };

  if (file.type.startsWith('image/')) {
    try {
      const tags = (await exifr.parse(file, {
        gps: true,
        translateKeys: false,
        translateValues: false,
        reviveValues: true,
      })) as Record<string, unknown> | undefined;

      if (tags && typeof tags === 'object') {
        const d = dateFromExif(tags);
        const coords = coordsFromExif(tags);
        return {
          capturedAt: d ? d.toISOString() : empty.capturedAt,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
        };
      }
    } catch {
      // Fichier sans EXIF ou illisible
    }
    return empty;
  }

  if (file.type.startsWith('video/')) {
    // Les navigateurs n’exposent pas la géoloc embarquée des vidéos sans lecture binaire lourde.
    return {
      capturedAt: fallbackDate,
      latitude: null,
      longitude: null,
    };
  }

  return empty;
}

export function formatCaptureDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

export function formatGps(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return '—';
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
