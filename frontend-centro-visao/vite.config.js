import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    open: true,
    allowedHosts: true,
    cors: true,
  },
  preview: {
    host: true,
    port: 3000,
    allowedHosts: true,
    cors: true,
  }
});
