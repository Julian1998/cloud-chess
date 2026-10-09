import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'js',
    manifest: true,
    rollupOptions: {
      input: 'src/main.tsx',
      output: {
        entryFileNames: '[name]-[hash].mjs',
        chunkFileNames: '[name]-[hash].mjs',
        assetFileNames: '[name]-[hash][extname]',
      },
    },
  },
});
