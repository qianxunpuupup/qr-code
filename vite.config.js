import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },

  plugins: [vue()],

  build: {
    target: "es2015",
    outDir: "docs",
    chunkSizeWarningLimit: 2000,

    dynamicImportVarsOptions: {
      warnOnError: true,
      exclude: [],
      include: ["src/views/**/*.vue"],
    },
  },
});
