import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. 定义用户接口
interface UserProfile {
  username: string;
  avatarUrl: string | null; // 支持网络 URL 或本地路径，允许为空
}

interface AppAppearance {
  // ... (保持不变)
  theme: 'dark' | 'light' | 'system';
  bgImage: string | null;
  bgBlur: number;
  bgOverlay: number;
}

interface AppState {
  appearance: AppAppearance;
  user: UserProfile; // <--- 新增用户状态
  setAppearance: (settings: Partial<AppAppearance>) => void;
  setUser: (profile: Partial<UserProfile>) => void; // <--- 新增设置用户的方法
  mergeConfig: (remoteConfig: any) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      appearance: {
        // ... (保持不变)
        theme: 'dark',
        bgImage: null,
        bgBlur: 10,
        bgOverlay: 0.6,
      },
      // 2. 初始化用户状态
      user: {
        username: 'Administrator',
        // 这里使用一个免费的在线头像服务作为演示占位符
        // 将来你可以把它替换成本地路径，例如 '/src/assets/default-avatar.png' 或用户上传的 URL
        avatarUrl: 'https://ui-avatars.com/api/?name=My+Shell&background=334155&color=fff&rounded=true&bold=true&size=128',
      },
      setAppearance: (newSettings) =>
        set((state) => ({
          appearance: { ...state.appearance, ...newSettings },
        })),
      // 新增：更新用户信息的方法
      setUser: (newProfile) =>
        set((state) => ({
           user: { ...state.user, ...newProfile }
        })),
      mergeConfig: (remoteConfig) => {
        console.log("Merging config...", remoteConfig);
      }
    }),
    { name: 'app-storage' }
  )
);