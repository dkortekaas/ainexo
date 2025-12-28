import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  css: {
    modules: false,
  },
  build: {
    outDir: "../public/widget",
    emptyOutDir: false, // Don't empty the directory to preserve loader.js
    lib: {
      entry: path.resolve(__dirname, "src/main.tsx"),
      name: "ChatbotWidget",
      fileName: "widget-bundle",
      formats: ["iife"], // Immediately Invoked Function Expression
    },
    rollupOptions: {
      output: {
        // Inline all assets into single file
        inlineDynamicImports: true,
        assetFileNames: "widget-bundle.[ext]",
      },
    },
    // Minification
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
      },
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
