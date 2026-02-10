import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// 注意：如果 DashboardSettings 类型定义在 domain/types 中包含背景字段，
// 这里可能会有类型提示错误，建议后续也清理一下 types.ts。
// 这里我们使用 Partial 或者自定义接口来规避。
import { DashboardSettings } from '../domain/types';

interface DashboardState {
  settings: {
    showEmoji: boolean;
    // 保留其他可能存在的非背景配置
  };
  dismissedSponsors: string[];

  updateSettings: (settings: Partial<DashboardSettings>) => void;
  dismissSponsor: (id: string) => void;
  resetSponsors: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      settings: {
        // 🟢 [修改] 移除了 backgroundImage, blur, brightness
        showEmoji: true,
      },
      dismissedSponsors: [],

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      dismissSponsor: (id) =>
        set((state) => ({
          dismissedSponsors: [...state.dismissedSponsors, id],
        })),

      resetSponsors: () => set({ dismissedSponsors: [] }),
    }),
    {
      name: 'dashboard-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);