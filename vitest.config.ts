import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        ".next/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/test/**",
        "**/__tests__/**",
        "**/__mocks__/**",
      ],
    },
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@ratecreator/db": path.resolve(__dirname, "./packages/db/src"),
      "@ratecreator/actions": path.resolve(__dirname, "./packages/actions/src"),
      "@ratecreator/ui": path.resolve(__dirname, "./packages/ui/src"),
      "@ratecreator/types": path.resolve(__dirname, "./packages/types/src"),
      "@ratecreator/auth": path.resolve(__dirname, "./packages/auth/src"),
      "@ratecreator/store": path.resolve(__dirname, "./packages/store/src"),
      "@ratecreator/hooks": path.resolve(__dirname, "./packages/hooks/src"),
    },
  },
});
