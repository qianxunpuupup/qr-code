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
    outDir: "QRCode-release",
    chunkSizeWarningLimit: 2000,
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境去除 console
        drop_debugger: true, // 生产环境去除 debugger
      },
    },

    dynamicImportVarsOptions: {
      warnOnError: true,
      exclude: [],
      include: ["src/views/**/*.vue"],
    },
  },
});
