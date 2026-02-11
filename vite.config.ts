import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url"; // 🟢 1. 引入这个工具

const host = process.env.TAURI_DEV_HOST;

// 🟢 2. 手动模拟生成 __dirname (ESM 模式必备)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  resolve: {
    alias: {
      // 🟢 3. 现在这里可以使用 __dirname 了
      "@": path.resolve(__dirname, "src"),
    },
  },

  // 🟢 4. 显式指定输出目录，防止路径错乱
  build: {
    outDir: "dist", 
    emptyOutDir: true,
  },

  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
