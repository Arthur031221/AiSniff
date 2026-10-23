import { defineConfig } from "vite";

export default defineConfig({
  publicDir: false,
  build: {
    target: "node20",
    ssr: "src/cli/main.ts",
    outDir: "dist/cli",
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: "aisniff.mjs", banner: "#!/usr/bin/env node" } },
  },
  ssr: { noExternal: true },
});
