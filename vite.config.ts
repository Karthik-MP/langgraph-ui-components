import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    minify: false,
    lib: {
      entry: "src/index.ts",
      name: "ChatUI",
      formats: ["es"],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        // externalize all dependencies and peerDependencies so the library
        // build does not bundle React or other packages
        ...Object.keys(pkg.peerDependencies || {}),
        ...Object.keys(pkg.dependencies || {}),
        "react/jsx-runtime",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@providers": path.resolve(__dirname, "src/providers"),
    },
  },
});
