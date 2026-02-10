import { create } from 'zustand';

interface SessionCredentialState {
  // Key: serverId, Value: password
  credentials: Record<string, string>;
  
  // 设置临时密码
  setCredential: (serverId: string, password: string) => void;
  // 获取并立即销毁密码 (一次性读取)
  consumeCredential: (serverId: string) => string | null;
}

export const useSessionCredentialStore = create<SessionCredentialState>((set, get) => ({
  credentials: {},

  setCredential: (serverId, password) => {
    set((state) => ({
      credentials: { ...state.credentials, [serverId]: password }
    }));
  },

  consumeCredential: (serverId) => {
    const pwd = get().credentials[serverId];
    if (pwd) {
      // 🚀 读取后立即从内存中删除，确保安全
      set((state) => {
        const newCreds = { ...state.credentials };
        delete newCreds[serverId];
        return { credentials: newCreds };
      });
      return pwd;
    }
    return null;
  }
}));