import { supabase } from './supabase';

const SILENT_FLAG = 'qs_silent_logout';

/** Déconnexion Supabase ; indique au listener auth de ne pas forcer /?openLogin=1 (déconnexion volontaire). */
export async function signOutFromApp(): Promise<void> {
  try {
    sessionStorage.setItem(SILENT_FLAG, '1');
  } catch {
    /* ignore */
  }
  await supabase.auth.signOut();
}

export function consumeSilentLogoutFlag(): boolean {
  try {
    if (sessionStorage.getItem(SILENT_FLAG) !== '1') return false;
    sessionStorage.removeItem(SILENT_FLAG);
    return true;
  } catch {
    return false;
  }
}
