/**
 * Utilitaire pour gérer le stockage privé des documents utilisateur
 * 
 * Chaque utilisateur a son propre dossier isolé dans le bucket 'private-documents'
 * Structure: private-documents/{user_id}/documents/file.pdf
 */

import { supabase } from '../lib/supabase';

export interface UploadOptions {
  folder?: string; // Sous-dossier (ex: 'documents', 'uploads', 'temp')
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

/**
 * Upload un fichier dans le dossier privé de l'utilisateur
 * @param file - Le fichier à uploader (File, Blob, ou ArrayBuffer)
 * @param fileName - Le nom du fichier
 * @param options - Options d'upload
 * @returns L'URL signée pour accéder au fichier
 */
export async function uploadPrivateDocument(
  file: File | Blob | ArrayBuffer,
  fileName: string,
  options: UploadOptions = {}
): Promise<{ path: string; signedUrl: string }> {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Construire le chemin: private-documents/{user_id}/{folder}/{fileName}
    const folder = options.folder || 'documents';
    const filePath = `${user.id}/${folder}/${fileName}`;

    // Upload le fichier
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('private-documents')
      .upload(filePath, file, {
        contentType: options.contentType,
        cacheControl: options.cacheControl || '3600',
        upsert: options.upsert || false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Générer une URL signée (valide 1 heure par défaut)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('private-documents')
      .createSignedUrl(filePath, 3600); // URL valide 1 heure

    if (urlError) {
      throw urlError;
    }

    return {
      path: filePath,
      signedUrl: signedUrlData.signedUrl,
    };
  } catch (error) {
    console.error('Erreur upload document privé:', error);
    throw error;
  }
}

/**
 * Liste tous les fichiers dans le dossier privé de l'utilisateur
 * @param folder - Optionnel: sous-dossier à lister
 * @returns Liste des fichiers avec leurs métadonnées
 */
export async function listPrivateDocuments(folder?: string) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    const folderPath = folder ? `${user.id}/${folder}` : user.id;

    const { data, error } = await supabase.storage
      .from('private-documents')
      .list(folderPath, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      // Améliorer le message d'erreur pour le bucket manquant
      if (error.message?.includes('Bucket not found') || 
          error.message?.includes('does not exist') ||
          error.statusCode === '404') {
        throw new Error('Bucket not found: Le bucket "private-documents" n\'existe pas. Veuillez appliquer la migration SQL dans Supabase.');
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erreur liste documents privés:', error);
    throw error;
  }
}

/**
 * Génère une URL signée pour télécharger un fichier privé
 * @param filePath - Le chemin complet du fichier (ex: "user_id/documents/file.pdf")
 * @param expiresIn - Durée de validité en secondes (défaut: 3600 = 1 heure)
 * @returns URL signée
 */
export async function getPrivateDocumentUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier que le fichier appartient à l'utilisateur
    if (!filePath.startsWith(`${user.id}/`)) {
      throw new Error('Accès non autorisé à ce fichier');
    }

    const { data, error } = await supabase.storage
      .from('private-documents')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Erreur génération URL document privé:', error);
    throw error;
  }
}

/**
 * Supprime un fichier privé
 * @param filePath - Le chemin complet du fichier
 */
export async function deletePrivateDocument(filePath: string): Promise<void> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier que le fichier appartient à l'utilisateur
    if (!filePath.startsWith(`${user.id}/`)) {
      throw new Error('Accès non autorisé à ce fichier');
    }

    const { error } = await supabase.storage
      .from('private-documents')
      .remove([filePath]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Erreur suppression document privé:', error);
    throw error;
  }
}

/**
 * Télécharge un fichier privé en tant que Blob
 * @param filePath - Le chemin complet du fichier
 * @returns Le fichier en tant que Blob
 */
export async function downloadPrivateDocument(filePath: string): Promise<Blob> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier que le fichier appartient à l'utilisateur
    if (!filePath.startsWith(`${user.id}/`)) {
      throw new Error('Accès non autorisé à ce fichier');
    }

    const { data, error } = await supabase.storage
      .from('private-documents')
      .download(filePath);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erreur téléchargement document privé:', error);
    throw error;
  }
}
