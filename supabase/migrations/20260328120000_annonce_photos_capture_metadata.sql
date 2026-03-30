-- Métadonnées prise de vue / géoloc (photothèque mobile, EXIF, etc.)
ALTER TABLE public.annonce_photos
  ADD COLUMN IF NOT EXISTS captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

COMMENT ON COLUMN public.annonce_photos.captured_at IS 'Date/heure de prise de vue (EXIF ou fichier)';
COMMENT ON COLUMN public.annonce_photos.latitude IS 'Latitude GPS si présente dans les métadonnées';
COMMENT ON COLUMN public.annonce_photos.longitude IS 'Longitude GPS si présente dans les métadonnées';
