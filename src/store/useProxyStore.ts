import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { ProxyItem } from "@/features/server/domain/types";

interface ProxyState {
  // --- State ---
  proxies: ProxyItem[];
  isLoading: boolean;

  // --- Actions ---
  /**
   * 添加一个新的代理配置
   * @param proxy 不带 ID 的代理对象
   */
  addProxy: (proxy: Omit<ProxyItem, "id">) => void;

  /**
   * 更新已有的代理配置
   * @param id 代理 ID
   * @param proxy 需要更新的字段
   */
  updateProxy: (id: string, proxy: Partial<ProxyItem>) => void;

  /**
   * 删除代理配置
   * @param id 代理 ID
   */
  removeProxy: (id: string) => void;

  /**
   * 获取单个代理详情
   */
  getProxy: (id: string) => ProxyItem | undefined;
}

export const useProxyStore = create<ProxyState>()(
  persist(
    (set, get) => ({
      proxies: [],
      isLoading: false,

      addProxy: (proxyData) => {
        const newProxy: ProxyItem = {
          id: uuidv4(), // 自动生成唯一 ID
          ...proxyData,
          // 如果有 createdAt 字段需求，可以在这里添加
          // createdAt: Date.now(), 
        };

        set((state) => ({
          proxies: [...state.proxies, newProxy],
        }));
      },

      updateProxy: (id, updatedFields) => {
        set((state) => ({
          proxies: state.proxies.map((p) =>
            p.id === id ? { ...p, ...updatedFields } : p
          ),
        }));
      },

      removeProxy: (id) => {
        set((state) => ({
          proxies: state.proxies.filter((p) => p.id !== id),
        }));
      },

      getProxy: (id) => {
        return get().proxies.find((p) => p.id === id);
      },
    }),
    {
      name: "app-proxy-storage", // LocalStorage 中的 key 名称
      storage: createJSONStorage(() => localStorage), // 默认持久化到 localStorage
      
      // [可选] 如果你想过滤掉某些不需要缓存的状态（如 isLoading）
      partialize: (state) => ({ proxies: state.proxies }),
    }
  )
);