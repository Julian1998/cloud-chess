import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
  plugins: [vue()],
  test: {
    setupFiles: ['./src/test-setup.ts'],
    server: { deps: { inline: [/@nextcloud\/vue/] } },
  },
  base: './',
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    appName: JSON.stringify('cloud_chess'),
    appVersion: JSON.stringify(packageJson.version),
  },
  build: {
    outDir: 'js',
    manifest: true,
    rolldownOptions: {
      input: 'src/main.ts',
      output: {
        entryFileNames: '[name]-[hash].mjs',
        chunkFileNames: '[name]-[hash].mjs',
        assetFileNames: '[name]-[hash][extname]',
      },
    },
  },
});
