import React, { useState } from 'react';
import { X, Mail, Bell, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEmailCapture } from '../hooks/useEmailCapture';

interface NotifyMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePage?: string;
}

const NotifyMeModal: React.FC<NotifyMeModalProps> = ({ isOpen, onClose, sourcePage = 'unknown' }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Email capture hook
  const { handleEmailChange: captureEmailHook, markComplete } = useEmailCapture({
    pageSource: sourcePage,
    formType: 'notify_me'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      setIsLoading(false);
      return;
    }

    try {
      const normalizedEmail = email.toLowerCase().trim();

      const { data: existingProprietaire } = await supabase
        .from('proprietaires')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      const { error: insertError } = await supabase
        .from('interested_users_v2')
        .insert([
          {
            email: normalizedEmail,
            source: sourcePage,
            notified: false,
            proprietaire_id: existingProprietaire?.id || null,
            product_interest: 'quittance_connectee_plus'
          }
        ]);

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Cet email est déjà enregistré pour être notifié');
        } else {
          throw insertError;
        }
      } else {
        // Mark email capture as completed
        markComplete();

        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setEmail('');
          setIsSuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      setError('');
      setIsSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 relative shadow-2xl">
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>

        {!isSuccess ? (
          <>
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FFD76F] to-[#FF7A7F] rounded-2xl flex items-center justify-center">
                <Bell className="w-8 h-8 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-[#2b2b2b] text-center mb-4">
              Quittance Connectée<span className="text-[#A46BFF]">+</span> arrive bientôt !
            </h2>

            <p className="text-base text-[#545454] text-center mb-8">
              Soyez parmi les premiers à découvrir notre solution de synchronisation bancaire automatique. Laissez votre email pour être notifié du lancement.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#545454] mb-2">
                  Votre email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEmail(value);
                      captureEmailHook(value);
                    }}
                    placeholder="votre.email@exemple.com"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#A46BFF] focus:ring-2 focus:ring-[#A46BFF]/20 transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500 mt-2">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#FFD76F] via-[#FF7A7F] to-[#A46BFF] hover:opacity-90 text-white font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Inscription en cours...
                  </div>
                ) : (
                  'Me tenir informé'
                )}
              </button>
            </form>

            <p className="text-xs text-[#545454]/70 text-center mt-4">
              Nous respectons votre vie privée. Vous recevrez uniquement une notification lors du lancement.
            </p>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-[#2b2b2b] mb-2">
              Merci !
            </h3>
            <p className="text-base text-[#545454]">
              Vous serez notifié lors du lancement de Quittance Connectée+
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotifyMeModal;
