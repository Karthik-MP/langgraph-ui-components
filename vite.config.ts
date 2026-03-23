import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

/**
 * WHY vite-plugin-dts instead of a separate `tsc -p tsconfig.build.json` step?
 *
 * tsc with `moduleResolution: "node16"` requires every relative import to have
 * an explicit `.js` extension, which would mean rewriting hundreds of imports.
 *
 * tsc with `moduleResolution: "bundler"` can't resolve @/* path aliases when
 * emitting declarations — it only works in no-emit mode (type-checking only).
 *
 * vite-plugin-dts runs inside the Vite pipeline, so it inherits the alias
 * resolution already configured below. It understands `bundler` moduleResolution,
 * handles @/* paths correctly, and generates declarationMap files so that
 * VS Code ctrl+click jumps directly to source.
 */

export default defineConfig({
  plugins: [
    react(),

    dts({
      // Point at the build tsconfig, not the app one.
      // tsconfig.build.json has noEmit:false, declaration:true, declarationMap:true.
      tsconfigPath: "./tsconfig.build.json",

      // Write .d.ts files into dist/, mirroring the src/ folder structure.
      // This is what makes VS Code ctrl+click resolve to the right file.
      outDir: "dist",

      // Don't copy the entire src tree into dist — only emit declaration files.
      copyDtsFiles: false,

      // Insert `export * from "./index"` roll-up at the package root so
      // consumers see a single flat types entry point at dist/index.d.ts
      rollupTypes: false,

      // Resolve @/* and @providers/* through Vite's own alias config below,
      // so the plugin never hits the "cannot find module @/..." error.
      pathsToAliases: true,
    }),
  ],

  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@providers": resolve(__dirname, "src/providers"),
    },
  },

  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "entries/providers": resolve(__dirname, "src/entries/providers.ts"),
        "entries/components": resolve(__dirname, "src/entries/components.ts"),
        "entries/hooks": resolve(__dirname, "src/entries/hooks.ts"),
      },
      name: "LanggraphUIComponents",
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        format === "es" ? `${entryName}.es.js` : `${entryName}.cjs.js`,
    },

    rollupOptions: {
      // Every peer dep must be external. Bundling React causes duplicate
      // context instances which silently breaks hooks at runtime.
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@langchain/core",
        "@langchain/langgraph",
        "@langchain/langgraph-sdk",
        "@langchain/langgraph-sdk/react",
        "@langchain/langgraph-sdk/react-ui",
        "framer-motion",
        "lucide-react",
        "openai",
        "react-markdown",
        "react-spinners",
        "sonner",
      ],

      output: {
        // preserveModules keeps the src/ directory structure in dist/.
        // Combined with declarationMap this makes every ctrl+click navigate
        // to the exact file and line in your source.
        preserveModules: true,
        preserveModulesRoot: "src",
        assetFileNames: "assets/[name][extname]",
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },

    // JS source maps for consumers who want to debug into your code.
    sourcemap: true,

    // Single CSS bundle that consumers import via `import "pkg/styles.css"`.
    cssCodeSplit: false,
  },
});