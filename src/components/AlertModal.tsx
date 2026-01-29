import React from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'error' | 'success';
  title: string;
  messages: string[];
}

export const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, type, title, messages }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-fade-in">
        <div className={`p-6 rounded-t-2xl ${type === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {type === 'error' ? (
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100">
                  <CheckCircle className="w-6 h-6 text-gray-600" />
                </div>
              )}
              <h3 className={`text-lg font-bold ${type === 'error' ? 'text-red-900' : 'text-gray-900'}`}>
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <ul className="space-y-2">
            {messages.map((message, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${type === 'error' ? 'bg-red-500' : 'bg-gray-500'}`} />
                <span className="text-sm">{message}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
              type === 'error'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-[#2D3436] hover:bg-[#1a1f20] text-white'
            }`}
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
};
