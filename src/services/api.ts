import { invoke } from "@tauri-apps/api/core";
import { Server } from "@/features/server/domain/types";

export const ServerAPI = {
  // 获取所有服务器
  getAll: async (): Promise<Server[]> => {
    console.log("📡 [API CALL] Invoking list_servers..."); // 1. 确认文件被调用
    const data = await invoke<any[]>("list_servers");
    
    // 2. 检查 Rust 给的最原始数据
    if (data && data.length > 0) {
      console.log("🔥 [API RECEIVE] Raw Rust Data (First Item):", data[0]);
      console.log("   -> Has proxyId?", "proxyId" in data[0]);
      console.log("   -> Has proxy_id?", "proxy_id" in data[0]);
    } else {
      console.log("⚠️ [API RECEIVE] No data returned from Rust");
    }
    
    return data;
  },

  // ... save 和 delete 保持不变
  save: async (server: Server): Promise<void> => {
    return await invoke("save_server", { server });
  },

  delete: async (id: string): Promise<void> => {
    return await invoke("delete_server", { id });
  }
};