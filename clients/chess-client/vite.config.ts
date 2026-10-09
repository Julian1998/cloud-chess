import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    emptyOutDir: false,
    minify: 'esbuild',
    outDir: '../../apps/nextcloud/app',
    lib: {
      entry: 'src/main.tsx',
      formats: ['iife'],
      name: 'CloudChessClient',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'js/chess-client.js',
        assetFileNames: (asset) =>
          asset.names.some((name) => name.endsWith('.css'))
            ? 'css/chess-client.css'
            : 'assets/[name]-[hash][extname]',
        inlineDynamicImports: true,
      },
    },
  },
});
