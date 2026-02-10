import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CardSize } from '@/features/server/list/domain/types'; 

// 定义视图模式类型 (根据你的项目实际情况，通常是 'grid' | 'table')
export type ViewMode = 'grid' | 'table';

interface SettingsState {
  // --- 卡片大小设置 ---
  serverCardSize: CardSize;
  setServerCardSize: (size: CardSize) => void;

  // --- [新增] 视图模式设置 (修复报错的关键) ---
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // 1. 卡片大小默认值
      serverCardSize: 'md',
      setServerCardSize: (size) => set({ serverCardSize: size }),

      // 2. [新增] 视图模式默认值
      viewMode: 'grid', 
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: 'app-settings', // LocalStorage Key
      storage: createJSONStorage(() => localStorage), 
    }
  )
);