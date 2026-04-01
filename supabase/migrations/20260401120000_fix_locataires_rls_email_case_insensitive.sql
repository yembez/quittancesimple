/*
  Fix RLS locataires : le lien robuste entre utilisateur et propriétaire est `proprietaires.user_id = auth.uid()`.
  Les anciennes policies basées sur `email = auth.jwt()->>'email'` sont fragiles (casse, changements d'email, doublons).

  Objectif: permettre aux utilisateurs authentifiés de lire/écrire leurs `locataires` via `proprietaire_id`
  appartenant à un `proprietaires` dont `user_id = auth.uid()`.

  Fallback: si `user_id` n'est pas encore renseigné (anciens comptes), on garde un fallback case-insensitive sur email.
*/

-- Vue des politiques existantes sur locataires (noms historiques)
DROP POLICY IF EXISTS "Users can view their own locataires" ON public.locataires;
DROP POLICY IF EXISTS "Users can insert their own locataires" ON public.locataires;
DROP POLICY IF EXISTS "Users can update their own locataires" ON public.locataires;
DROP POLICY IF EXISTS "Users can delete their own locataires" ON public.locataires;
DROP POLICY IF EXISTS "Authenticated users can update their own locataires v2" ON public.locataires;

CREATE POLICY "Users can view their own locataires"
  ON public.locataires
  FOR SELECT
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM public.proprietaires
      WHERE user_id = auth.uid()
         OR lower(trim(email)) = lower(trim(coalesce(auth.jwt()->>'email', '')))
    )
  );

CREATE POLICY "Users can insert their own locataires"
  ON public.locataires
  FOR INSERT
  TO authenticated
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM public.proprietaires
      WHERE user_id = auth.uid()
         OR lower(trim(email)) = lower(trim(coalesce(auth.jwt()->>'email', '')))
    )
  );

CREATE POLICY "Users can update their own locataires"
  ON public.locataires
  FOR UPDATE
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM public.proprietaires
      WHERE user_id = auth.uid()
         OR lower(trim(email)) = lower(trim(coalesce(auth.jwt()->>'email', '')))
    )
  )
  WITH CHECK (
    proprietaire_id IN (
      SELECT id FROM public.proprietaires
      WHERE user_id = auth.uid()
         OR lower(trim(email)) = lower(trim(coalesce(auth.jwt()->>'email', '')))
    )
  );

CREATE POLICY "Users can delete their own locataires"
  ON public.locataires
  FOR DELETE
  TO authenticated
  USING (
    proprietaire_id IN (
      SELECT id FROM public.proprietaires
      WHERE user_id = auth.uid()
         OR lower(trim(email)) = lower(trim(coalesce(auth.jwt()->>'email', '')))
    )
  );
