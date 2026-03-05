import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';

const QUITTANCE_IMAGE_MINI =
  'https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/quittance_modele_full_mini.png';
const QUITTANCE_IMAGE_FULL =
  'https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/quittance_modele_full.png';

interface QuittanceImageBlockProps {
  /** Légende au-dessus de l’image (ex. "Exemple de quittance générée :") */
  title?: string;
}

export default function QuittanceImageBlock({ title = 'Exemple de quittance générée :' }: QuittanceImageBlockProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="mt-2">
        {title && (
          <p className="text-sm font-semibold text-gray-800 mb-3 text-center">{title}</p>
        )}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="group relative inline-block rounded-xl overflow-hidden border-2 border-gray-200 hover:border-gray-800 transition-all shadow-md hover:shadow-lg bg-gray-900 p-4"
            aria-label="Agrandir l’exemple de quittance"
          >
            <div className="relative scale-[0.8] origin-center">
              <img
                src={QUITTANCE_IMAGE_MINI}
                alt="Exemple de quittance de loyer conforme générée par Quittance Simple"
                className="block max-w-full h-auto bg-white rounded"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
                  <Maximize2 className="w-4 h-4 text-gray-800" />
                  <span className="text-sm font-semibold text-gray-800">Cliquer pour agrandir</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 z-20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-gray-800" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[90vh] p-4 sm:p-6">
                <img
                  src={QUITTANCE_IMAGE_FULL}
                  alt="Quittance de loyer conforme générée par Quittance Simple - Vue complète"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
