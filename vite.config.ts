import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build:{
    lib:{
      entry:"src/index.ts",
      name:"ChatUI",
      fileName:(format)=>`index.${format}.js`
    },
    rollupOptions:{
      external:["React","React-dom"]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@providers': path.resolve(__dirname, 'src/providers')
    }
  }
});
