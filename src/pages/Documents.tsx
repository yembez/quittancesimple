import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Trash2, Folder, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useEspaceBailleur } from '../contexts/EspaceBailleurContext';
import {
  uploadPrivateDocument,
  listPrivateDocuments,
  getPrivateDocumentUrl,
  deletePrivateDocument,
  downloadPrivateDocument
} from '../utils/privateStorage';

interface Document {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: {
    size?: number;
    mimetype?: string;
  };
}

export default function Documents() {
  const { proprietaire } = useEspaceBailleur();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('baux-etat-des-lieux');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const folders = [
    { id: 'baux-etat-des-lieux', label: 'Baux / Etat des lieux' },
    { id: 'dossier-locataire', label: 'Dossier locataire' },
    { id: 'diagnostics', label: 'Diagnostics' },
    { id: 'assurances', label: 'Assurances' },
    { id: 'compta', label: 'Compta' },
    { id: 'annonces', label: 'Annonces' },
    { id: 'divers', label: 'Divers' },
  ];

  useEffect(() => {
    if (proprietaire) {
      loadDocuments();
    }
  }, [proprietaire, selectedFolder]);

  const loadDocuments = async () => {
    if (!proprietaire) {
      setLoadingDocuments(false);
      return;
    }
    
    try {
      setLoadingDocuments(true);
      setError(null);
      const files = await listPrivateDocuments(selectedFolder);
      // Filtrer les dossiers et ne garder que les fichiers
      const fileList = (files || []).filter((file: any) => file && file.name && !file.id?.endsWith('/'));
      setDocuments(fileList as Document[]);
    } catch (error: any) {
      console.error('Erreur chargement documents:', error);
      // Si le bucket n'existe pas encore, afficher un message informatif
      const errorMessage = error?.message || error?.error_description || String(error);
      if (errorMessage.includes('Bucket not found') || 
          errorMessage.includes('not found') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('No such bucket')) {
        setError('Le système de stockage privé n\'est pas encore configuré. Veuillez appliquer la migration SQL dans Supabase.');
        setDocuments([]);
      } else if (errorMessage.includes('permission denied') || 
                 errorMessage.includes('Unauthorized') ||
                 errorMessage.includes('Forbidden')) {
        setError('Vous n\'avez pas les permissions nécessaires. Vérifiez que vous êtes bien connecté.');
        setDocuments([]);
      } else {
        setError(errorMessage || 'Erreur lors du chargement des documents');
        setDocuments([]);
      }
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Vérifier la taille (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('Le fichier est trop volumineux (maximum 50MB)');
      return;
    }
    setUploadFile(file);
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      validateAndSetFile(file);
      setShowUploadModal(true);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      await uploadPrivateDocument(
        uploadFile,
        uploadFile.name,
        {
          folder: selectedFolder,
          contentType: uploadFile.type,
        }
      );

      setSuccess('Fichier uploadé avec succès');
      setUploadFile(null);
      setShowUploadModal(false);
      await loadDocuments();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Erreur upload:', error);
      setError(error.message || 'Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const filePath = `${proprietaire?.id}/${selectedFolder}/${document.name}`;
      
      // Télécharger directement le fichier
      const blob = await downloadPrivateDocument(filePath);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Erreur téléchargement:', error);
      setError(error.message || 'Erreur lors du téléchargement');
    }
  };

  const documentDisplayName = (name: string) => (name?.endsWith('.pdf') ? name.slice(0, -4) : name);

  const handleDelete = async (document: Document) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${documentDisplayName(document.name)}" ?`)) {
      return;
    }

    try {
      const filePath = `${proprietaire?.id}/${selectedFolder}/${document.name}`;
      await deletePrivateDocument(filePath);
      setSuccess('Document supprimé avec succès');
      await loadDocuments();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      setError(error.message || 'Erreur lors de la suppression');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Taille inconnue';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!proprietaire) return null;

  return (
    <main className="flex-1 bg-gray-50 px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* Messages d'erreur/succès */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4 flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
                <button
                  onClick={() => setSuccess(null)}
                  className="text-green-400 hover:text-green-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Onglets des dossiers – style aligné baux / état des lieux */}
            <div className="border-b border-gray-200 pt-4 pb-0 mb-6">
              <nav className="flex gap-0" aria-label="Tabs">
                {folders.map((folder, index) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      index === 0 ? 'rounded-tl-md' : index === folders.length - 1 ? 'rounded-tr-md -ml-px' : 'rounded-none -ml-px'
                    } ${
                      selectedFolder === folder.id
                        ? 'bg-charte-bleu text-white border border-b-0 border-charte-bleu border-b-white'
                        : 'border border-gray-300 border-b-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {folder.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Zone de drag & drop */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mb-6 border-2 border-dashed rounded-md p-8 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
              onClick={() => !isDragging && setShowUploadModal(true)}
            >
              <Upload className={`w-12 h-12 mx-auto mb-3 transition-colors ${isDragging ? 'text-[#1e3a5f]' : 'text-gray-400'}`} />
              <p className="text-sm text-gray-600 mb-1 font-medium">
                {isDragging ? 'Déposez votre fichier ici' : 'Glissez-déposez un fichier ici pour l\'uploader'}
              </p>
              <p className="text-base text-gray-600 font-medium">ou cliquez pour déposer un document</p>
            </div>

            {/* Liste des documents */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {loadingDocuments ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]"></div>
                  <p className="mt-4 text-gray-600">Chargement des documents...</p>
                </div>
              ) : error && documents.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2 text-lg font-semibold">Erreur de chargement</p>
                  <p className="text-gray-500 mb-4 max-w-md mx-auto">{error}</p>
                  <button
                    onClick={() => loadDocuments()}
                    className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white rounded-md font-medium transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              ) : documents.length === 0 ? (
                <div className="p-12 text-center">
                  <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2 text-lg font-semibold">Aucun document</p>
                  <p className="text-gray-500">
                    Commencez par uploader votre premier document
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">Nom</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">Taille</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">Date d'ajout</th>
                        <th className="text-right py-4 px-4 font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <span className="font-medium text-gray-900">{documentDisplayName(doc.name)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {formatFileSize(doc.metadata?.size)}
                          </td>
                          <td className="py-4 px-4 text-gray-600 text-sm">
                            {formatDate(doc.created_at)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleDownload(doc)}
                                className="p-2 text-[#1e3a5f] hover:bg-[#1e3a5f]/10 rounded-md transition-colors"
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(doc)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
      {/* Modal d'upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Uploader un document</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier
                </label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
                />
                {uploadFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    {uploadFile.name} ({formatFileSize(uploadFile.size)})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dossier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        selectedFolder === folder.id
                          ? 'bg-charte-bleu text-white border-charte-bleu'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {folder.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#1a2f4d] text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Upload en cours...' : 'Uploader'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
