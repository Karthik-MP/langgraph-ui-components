import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@providers": resolve(__dirname, "src/providers"),
    },
  },

  test: {
    environment: "jsdom",

    // Global setup file runs before every test file
    setupFiles: ["./test/setup.ts"],

    // Make describe/it/expect available without importing
    globals: true,

    // Use the test-specific tsconfig so test/ is on the path
    typecheck: {
      tsconfig: "./tsconfig.test.json",
    },

    // Coverage via v8
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/main.tsx",
        "src/App.tsx",
        "src/**/*.d.ts",
        "src/entries/**",
        "src/index.ts",
      ],
    },

    // Only pick up files under test/
    include: ["test/**/*.{test,spec}.{ts,tsx}"],
  },
});
