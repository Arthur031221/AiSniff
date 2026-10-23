import { defineConfig } from "vitest/config";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "1" ? "/AiSniff/" : "/",
  build: { target: "es2022", outDir: "dist/web", emptyOutDir: true },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
