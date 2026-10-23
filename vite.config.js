import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8080,
    open: false,
    host: true
  },
  preview: {
    port: 8080,
    host: true
  }
});
