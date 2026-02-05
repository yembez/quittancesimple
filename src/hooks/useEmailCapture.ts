import { useState, useCallback, useRef } from 'react';
import { captureEmail, markFormCompleted } from '../utils/analytics';

interface UseEmailCaptureOptions {
  pageSource: string;
  formType: string;
  debounceMs?: number;
}

/**
 * Hook to automatically capture emails as they are entered
 * Usage:
 *
 * const { handleEmailChange, captureId } = useEmailCapture({
 *   pageSource: 'home',
 *   formType: 'quittance_generation'
 * });
 *
 * <input type="email" onChange={(e) => handleEmailChange(e.target.value)} />
 */
export const useEmailCapture = (options: UseEmailCaptureOptions) => {
  const { pageSource, formType, debounceMs = 800 } = options;

  const [captureId, setCaptureId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastCapturedEmail = useRef<string | null>(null);

  const handleEmailChange = useCallback(
    (email: string) => {
      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Don't capture if email is the same as last captured
      if (email === lastCapturedEmail.current) {
        return;
      }

      // Debounce the capture
      debounceTimer.current = setTimeout(async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (emailRegex.test(email) && email !== lastCapturedEmail.current) {
          setIsCapturing(true);
          const id = await captureEmail(email, pageSource, formType);

          if (id) {
            setCaptureId(id);
            lastCapturedEmail.current = email;
          }

          setIsCapturing(false);
        }
      }, debounceMs);
    },
    [pageSource, formType, debounceMs]
  );

  const markComplete = useCallback(async () => {
    if (captureId) {
      await markFormCompleted(captureId);
    }
  }, [captureId]);

  return {
    handleEmailChange,
    captureId,
    isCapturing,
    markComplete,
  };
};
