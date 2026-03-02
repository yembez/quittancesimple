# Stockage Privé des Documents Utilisateur

## 📋 Vue d'ensemble

Ce système permet de créer un espace de stockage privé pour chaque utilisateur dans Supabase Storage. Chaque utilisateur a son propre dossier isolé et ne peut accéder qu'à ses propres fichiers.

## 🔒 Sécurité

- **Bucket privé** : Le bucket `private-documents` n'est pas public
- **Isolation par utilisateur** : Chaque utilisateur a son propre dossier basé sur son `auth.uid()`
- **Politiques RLS** : Les politiques Row Level Security garantissent qu'un utilisateur ne peut accéder qu'à ses propres fichiers
- **Authentification requise** : Seuls les utilisateurs authentifiés peuvent utiliser ce bucket

## 📁 Structure des fichiers

```
private-documents/
  ├── {user_id_1}/
  │   ├── documents/
  │   │   ├── file1.pdf
  │   │   └── file2.jpg
  │   ├── uploads/
  │   │   └── temp_file.pdf
  │   └── ...
  ├── {user_id_2}/
  │   └── documents/
  │       └── ...
  └── ...
```

## 🚀 Installation

### 1. Appliquer la migration

```bash
# Via Supabase CLI
supabase migration up

# Ou via le dashboard Supabase
# Allez dans SQL Editor et exécutez le fichier de migration
```

### 2. Utiliser les fonctions utilitaires

```typescript
import { 
  uploadPrivateDocument, 
  listPrivateDocuments,
  getPrivateDocumentUrl,
  deletePrivateDocument 
} from '../utils/privateStorage';
```

## 💡 Exemples d'utilisation

### Upload d'un fichier

```typescript
// Upload depuis un input file
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const { path, signedUrl } = await uploadPrivateDocument(
      file,
      file.name,
      {
        folder: 'documents', // Optionnel
        contentType: file.type,
      }
    );
    
    console.log('Fichier uploadé:', path);
    console.log('URL signée:', signedUrl);
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Liste des fichiers

```typescript
// Lister tous les fichiers de l'utilisateur
const files = await listPrivateDocuments();

// Lister les fichiers d'un sous-dossier spécifique
const documents = await listPrivateDocuments('documents');
```

### Télécharger un fichier

```typescript
// Générer une URL signée (valide 1 heure)
const url = await getPrivateDocumentUrl('user_id/documents/file.pdf', 3600);

// Ou télécharger directement en Blob
const blob = await downloadPrivateDocument('user_id/documents/file.pdf');
const downloadUrl = URL.createObjectURL(blob);
```

### Supprimer un fichier

```typescript
await deletePrivateDocument('user_id/documents/file.pdf');
```

## 📊 Quotas Supabase Storage

### Plan Free (Gratuit)
- **500 MB** de stockage
- **2 GB** de bande passante par mois
- **50 MB** par fichier (limite configurable dans la migration)

### Plan Pro ($25/mois)
- **100 GB** de stockage
- **200 GB** de bande passante par mois
- **5 GB** par fichier

### Plan Team ($599/mois)
- **1 TB** de stockage
- **2 TB** de bande passante par mois
- **5 GB** par fichier

### Plan Enterprise
- Stockage et bande passante illimités
- Support dédié

## ⚙️ Configuration

### Modifier la taille limite des fichiers

Dans la migration `20260210000000_create_private_documents_bucket.sql`, modifiez :

```sql
file_size_limit = 52428800, -- 50MB (en octets)
```

### Modifier les types MIME autorisés

```sql
allowed_mime_types = ARRAY[
  'application/pdf',
  'image/jpeg',
  'image/png',
  // Ajoutez d'autres types selon vos besoins
]
```

### Modifier la durée de validité des URLs signées

Dans `privateStorage.ts`, modifiez le paramètre `expiresIn` :

```typescript
createSignedUrl(filePath, 3600) // 3600 secondes = 1 heure
```

## 🔍 Vérification

### Vérifier que le bucket existe

```sql
SELECT * FROM storage.buckets WHERE id = 'private-documents';
```

### Vérifier les politiques RLS

```sql
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%private-documents%';
```

### Tester l'upload (depuis le code)

```typescript
// Test simple
const testFile = new Blob(['test content'], { type: 'text/plain' });
const result = await uploadPrivateDocument(testFile, 'test.txt');
console.log('Test réussi:', result);
```

## ⚠️ Notes importantes

1. **Authentification requise** : Toutes les opérations nécessitent un utilisateur authentifié
2. **Isolation stricte** : Les utilisateurs ne peuvent pas accéder aux fichiers des autres utilisateurs
3. **URLs signées** : Les fichiers ne sont pas accessibles publiquement, utilisez des URLs signées
4. **Limites de taille** : Respectez les limites de votre plan Supabase
5. **Coûts** : Surveillez votre utilisation pour éviter les dépassements

## 🐛 Dépannage

### Erreur "Utilisateur non authentifié"
- Vérifiez que l'utilisateur est bien connecté : `await supabase.auth.getUser()`

### Erreur "Accès non autorisé"
- Vérifiez que le chemin du fichier commence par `{user_id}/`
- Vérifiez que les politiques RLS sont bien appliquées

### Erreur "Bucket not found"
- Vérifiez que la migration a été appliquée
- Vérifiez que le bucket existe dans le dashboard Supabase

## 📚 Ressources

- [Documentation Supabase Storage](https://supabase.com/docs/guides/storage)
- [Politiques RLS Storage](https://supabase.com/docs/guides/storage/security/access-control)
- [URLs signées](https://supabase.com/docs/guides/storage/serving/downloads)
