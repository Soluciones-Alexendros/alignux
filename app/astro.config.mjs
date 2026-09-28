import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://alignux.alexendros.dev',
  base: '/',
  output: 'static',
  adapter: undefined,
  build: {
    assets: '_astro',
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      cssCodeSplit: true,
    },
  },
});
