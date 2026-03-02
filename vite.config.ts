import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      // Ne pas mettre html2canvas en external : en prod (Vercel) le navigateur ne peut pas résoudre les bare specifiers, → page blanche.
      // external: ['canvg', 'html2canvas', 'dompurify']
    }
  }
});
