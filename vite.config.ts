import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// https://vitejs.dev/config/
/**
 * Vite Configuration
 * 
 * Functionality: Configures the Vite build tool, including plugins and dependency optimization.
 */
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
