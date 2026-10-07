import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules", ".next"],
    setupFiles: [],
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "./scripts/test-server-only.mjs"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
