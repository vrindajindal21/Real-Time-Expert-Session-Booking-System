import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ─── Path Aliases ────────────────────────────────────────────────────────────
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@context': path.resolve(__dirname, './src/context'),
      '@config': path.resolve(__dirname, './src/config'),
    }
  },

  // ─── Dev Server ──────────────────────────────────────────────────────────────
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true // WebSocket proxy for Socket.IO
      }
    }
  },

  // ─── Production Build Optimization ───────────────────────────────────────────
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',

    // Chunk size warning threshold
    chunkSizeWarningLimit: 500,

    // Enable source maps for production debugging
    sourcemap: false,

    rollupOptions: {
      output: {
        /**
         * Manual Chunks — splits the bundle so users only download
         * what they need. Critical for a 91KB ProviderDashboard.
         */
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('axios') || id.includes('react-hot-toast')) {
              return 'vendor-utils';
            }
            if (id.includes('react-helmet-async')) {
              return 'vendor-seo';
            }
            return 'vendor'; // Default fallback for other node_modules
          }
        },

        // Clean asset file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      }
    }
  },

  // ─── Dependency Pre-bundling ─────────────────────────────────────────────────
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'framer-motion',
      'lucide-react',
      'recharts',
      'react-hot-toast',
      'react-helmet-async'
    ]
  }
})
