import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // ── Guest / VIP Import — PHẢI đặt trước /api/ để ưu tiên match dài hơn
      '/api/admin': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
      // ── Event & Organizer API
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // ── Auth Service
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // ── AI / Artist Service
      '/artist': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // ── Info Service
      '/info': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // ── Booking Service (với WebSocket)
      '/booking': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    }
  }
});

