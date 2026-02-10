import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url"; // 🟢 新增：用于兼容 ESM 环境

const host = process.env.TAURI_DEV_HOST;

// 🟢 兼容 ESM 环境获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // 现在这里是安全的了
    },
  },

  // 🟢 显式指定构建输出目录（必须是 dist，对应 tauri.conf.json 的 ../dist）
  build: {
    outDir: "dist",
    emptyOutDir: true, // 构建前清空 dist，防止旧文件干扰
  },

  // Vite options tailored for Tauri development
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
