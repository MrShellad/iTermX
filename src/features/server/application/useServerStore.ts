import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Server } from '../domain/types';
import { ServerAPI } from '@/services/api';
import { v4 as uuidv4 } from 'uuid';

export type ViewMode = 'grid' | 'list';
export type CardSize = 'sm' | 'md' | 'lg';

interface ServerState {
  servers: Server[];
  isLoading: boolean;
  // [新增] 标记数据是否已从后端初始化
  isInitialized: boolean;
  // [新增] 标记用户本次会话是否已访问过列表页
  hasVisitedList: boolean;
  
  viewMode: ViewMode;
  cardSize: CardSize;
  
  fetchServers: (silent?: boolean) => Promise<void>;
  addOrUpdateServer: (serverData: Partial<Server> & { is_pinned?: number | boolean }) => Promise<void>; 
  saveServer: (serverData: Partial<Server> & { is_pinned?: number | boolean }) => Promise<void>;
  removeServer: (id: string) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setCardSize: (size: CardSize) => void;
  
  // [新增] 标记列表已访问动作
  markListVisited: () => void;

  // 🟢 [新增] 添加临时服务器 (用于快速连接，仅内存，不持久化到数据库)
  addTemporaryServer: (server: Server) => void;
}

export const useServerStore = create<ServerState>()(
  persist(
    (set, get) => ({
      servers: [],
      isLoading: false,
      isInitialized: false, // 默认为 false
      hasVisitedList: false, // 默认为 false
      viewMode: 'grid',
      cardSize: 'md',
      
      setViewMode: (mode) => set({ viewMode: mode }),
      setCardSize: (size) => set({ cardSize: size }),
      markListVisited: () => set({ hasVisitedList: true }),

      // 🟢 [实现] 添加临时服务器
      // 这个方法只更新 Zustand Store 中的 servers 数组，不调用 API。
      // 当应用刷新或重新 fetchServers 时，这些临时数据会被后端数据覆盖，
      // 符合“临时连接”的预期。
      addTemporaryServer: (server: Server) => {
        set((state) => ({
          servers: [...state.servers, server]
        }));
      },

      fetchServers: async (silent = false) => {
        if (!silent) set({ isLoading: true });
        try {
          // 1. 获取数据库中的真实服务器
          const backendServers = await ServerAPI.getAll();
          
          // 2. 映射数据结构 (保持你原有的逻辑不变)
          const mappedServers: Server[] = backendServers.map((s: any) => ({
            ...s,
            ip: s.ip || s.host || '',
            authType: s.authType || s.auth_type || 'password',
            passwordId: s.passwordId || s.password_id,
            keyId: s.keyId || s.key_id,
            passwordSource: s.passwordSource || s.password_source,
            keySource: s.keySource || s.key_source,
            isPinned: s.isPinned ?? (s.is_pinned === 1 || s.is_pinned === true) ?? false,
            proxyId: s.proxyId || s.proxy_id, 
            tags: Array.isArray(s.tags) ? s.tags : [],
            enableExpiration: !!s.enableExpiration,
            icon: s.icon || 'server',
            status: 'disconnected', 
            os: s.os || 'linux',
            connectTimeout: s.connectTimeout ?? s.connect_timeout,
            keepAliveInterval: s.keepAliveInterval ?? s.keep_alive_interval,
            autoReconnect: s.autoReconnect ?? s.auto_reconnect,
            maxReconnects: s.maxReconnects ?? s.max_reconnects,
          }));

          // 🟢 [核心修复] 获取当前 Store 中已存在的“快速连接”临时数据
          // 这里的 get() 是 zustand 提供的，用于获取当前状态
          const currentQuickServers = get().servers.filter(s => s.provider === 'QuickConnect');

          // 3. 合并：数据库数据 + 内存中的临时数据
          // 这样刷新列表时，临时连接就不会被“冲掉”了
          set({ 
            servers: [...mappedServers, ...currentQuickServers],
            isInitialized: true 
          });

        } catch (e) {
          console.error("Failed to fetch servers", e);
        } finally {
          set({ isLoading: false });
        }
      },

      saveServer: async (serverData) => {
        return get().addOrUpdateServer(serverData);
      },

      addOrUpdateServer: async (serverData) => {
        const currentServers = get().servers;
        const existingServer = serverData.id 
            ? currentServers.find(s => s.id === serverData.id) 
            : null;

        let finalAuthType: string = serverData.authType ?? existingServer?.authType ?? 'password';
        if (finalAuthType === 'key') {
            finalAuthType = 'privateKey';
        }

        let finalIsPinned = existingServer?.isPinned ?? false;
        if (serverData.is_pinned !== undefined) {
            finalIsPinned = serverData.is_pinned === 1 || serverData.is_pinned === true;
        } else if (serverData.isPinned !== undefined) {
            finalIsPinned = serverData.isPinned;
        }

        const newServer: any = {
            id: serverData.id || uuidv4(),
            name: serverData.name ?? existingServer?.name ?? '',
            ip: serverData.ip ?? existingServer?.ip ?? '',
            port: serverData.port ?? existingServer?.port ?? 22,
            username: serverData.username ?? existingServer?.username ?? 'root',
            icon: serverData.icon ?? existingServer?.icon ?? 'server',
            provider: serverData.provider ?? existingServer?.provider ?? 'Custom',
            sort: serverData.sort ?? existingServer?.sort ?? 0,
            tags: serverData.tags ?? existingServer?.tags ?? [],

            passwordId: serverData.passwordId ?? existingServer?.passwordId,
            keyId: serverData.keyId ?? existingServer?.keyId,
            passwordSource: serverData.passwordSource ?? existingServer?.passwordSource,
            keySource: serverData.keySource ?? existingServer?.keySource,
            
            isPinned: finalIsPinned,
            is_pinned: finalIsPinned ? 1 : 0, 

            enableExpiration: serverData.enableExpiration ?? existingServer?.enableExpiration ?? false,
            expireDate: serverData.expireDate ?? existingServer?.expireDate,
            
            connectionType: serverData.connectionType ?? existingServer?.connectionType ?? 'direct',
            
            authType: finalAuthType,
            
            password: serverData.password ?? existingServer?.password,
            privateKey: serverData.privateKey ?? existingServer?.privateKey,
            passphrase: serverData.passphrase ?? existingServer?.passphrase,
            
            proxyId: serverData.proxyId ?? existingServer?.proxyId, 
            
            os: serverData.os ?? existingServer?.os ?? 'linux',
            status: 'disconnected',

            connectTimeout: serverData.connectTimeout ?? existingServer?.connectTimeout,
            keepAliveInterval: serverData.keepAliveInterval ?? existingServer?.keepAliveInterval,
            autoReconnect: serverData.autoReconnect ?? existingServer?.autoReconnect,
            maxReconnects: serverData.maxReconnects ?? existingServer?.maxReconnects,
        };

        if (!existingServer && (!newServer.name || !newServer.ip)) {
            throw new Error("Missing required fields");
        }
        
        try {
            console.log("📤 [Store] Saving Server Data:", newServer);
            await ServerAPI.save(newServer);
            await get().fetchServers(true);
        } catch (e) {
            console.error("Failed to save server:", e);
            throw e;
        }
      },

      removeServer: async (id) => {
        try {
            await ServerAPI.delete(id);
            set(state => ({
                servers: state.servers.filter(s => s.id !== id)
            }));
        } catch (e) {
            console.error("Failed to delete server:", e);
        }
      }
    }),
    {
      name: 'server-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        viewMode: state.viewMode, 
        cardSize: state.cardSize,
        // [新增] 缓存 servers 数据，实现“缓存优先”
        servers: state.servers.filter(s => s.provider !== 'QuickConnect')
      }),
    }
  )
);