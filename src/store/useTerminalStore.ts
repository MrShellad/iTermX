import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Server } from '@/features/server/domain/types';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface TerminalTab {
  id: string;
  title: string;
  type: 'welcome' | 'server' | 'ssh';
  icon?: string;
  sessions: string[];
  serverIp?: string;
}

export interface TerminalSession {
  id: string;
  serverId: string;
  serverName: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  connectTimestamp?: number;
}

type CreateTabPayload = Partial<Server> & {
  serverId?: string;
  title?: string;
  type?: TerminalTab['type'];
  serverIp?: string;
};

export type MonitorPosition = 'left' | 'right';

interface TerminalState {
  tabs: TerminalTab[];
  activeTabId: string | null;
  sessions: Record<string, TerminalSession>;
  isBroadcastMode: boolean;
  theme: string;

  monitorWidth: number;
  monitorPosition: MonitorPosition;
  fileManagerHeight: number;

  setMonitorWidth: (width: number) => void;
  setMonitorPosition: (pos: MonitorPosition) => void;
  setFileManagerHeight: (height: number) => void;

  createTab: (payload?: CreateTabPayload) => void;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (tabId: string) => void;
  
  updateSessionStatus: (sessionId: string, status: TerminalSession['status']) => void;
  
  toggleBroadcastMode: () => void;
  
  splitTab: (tabId: string) => void;
  unsplitTab: (tabId: string) => void;
  
  reconnectTab: (tabId: string) => void;
  
  setTheme: (themeId: string) => void;
}

// 辅助函数：创建一个默认的 Welcome Tab
const createWelcomeTab = (): TerminalTab => ({
    id: uuidv4(),
    title: 'Home',
    type: 'welcome',
    sessions: []
});

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set, get) => ({
      // 初始状态包含一个 Welcome Tab
      tabs: [createWelcomeTab()],
      activeTabId: null, // 将在 partialize 恢复后或组件挂载时自动修正，或者在这里初始化 ID 比较麻烦
      sessions: {},
      isBroadcastMode: false,
      theme: 'default',
      
      monitorWidth: 320,
      monitorPosition: 'right',
      fileManagerHeight: 300,

      setMonitorWidth: (width) => set({ monitorWidth: width }),
      setMonitorPosition: (pos) => set({ monitorPosition: pos }),
      setFileManagerHeight: (height) => set({ fileManagerHeight: height }),

      // 🟢 [修改 1] 智能创建 Tab
      createTab: (payload) => {
        const { tabs, sessions, activeTabId } = get();
        
        // 判断是否为服务器连接请求
        const targetServerId = payload?.id || payload?.serverId;
        const isServerConnection = !!targetServerId && payload?.type !== 'welcome';

        // 🟢 核心逻辑：检查是否需要在当前 Tab 打开
        // 条件：正在连接服务器 && 当前激活的 Tab 是 Welcome 页
        const currentActiveTab = tabs.find(t => t.id === activeTabId);
        const shouldReplaceCurrent = isServerConnection && currentActiveTab?.type === 'welcome';

        const tabId = shouldReplaceCurrent ? currentActiveTab!.id : uuidv4();

        // 准备新的 Tab 数据
        let newTab: TerminalTab = {
            id: tabId,
            title: payload?.title || payload?.name || 'Home',
            type: isServerConnection ? 'server' : 'welcome',
            sessions: [], // 稍后填充
            serverIp: payload?.ip || payload?.serverIp
        };
        
        let initialSessions: Record<string, TerminalSession> = {};
        let sessionIds: string[] = [];

        // 创建 Session 数据
        if (isServerConnection && targetServerId) {
            const sessionId = uuidv4();
            sessionIds.push(sessionId);
            
            const newSession: TerminalSession = {
                id: sessionId,
                serverId: targetServerId,
                serverName: payload?.name || 'Unknown',
                status: 'connecting',
                connectTimestamp: Date.now()
            };
            
            initialSessions[sessionId] = newSession;
            newTab.sessions = sessionIds;
        }

        if (shouldReplaceCurrent) {
            // 🔄 替换逻辑：更新当前 Tab，而不是 push
            const updatedTabs = tabs.map(t => t.id === tabId ? newTab : t);
            set({
                tabs: updatedTabs,
                // activeTabId 保持不变
                sessions: { ...sessions, ...initialSessions }
            });
        } else {
            // ➕ 新增逻辑：push 新 Tab
            set({
                tabs: [...tabs, newTab],
                activeTabId: tabId,
                sessions: { ...sessions, ...initialSessions }
            });
        }
      },

      // 🟢 [修改 2] 关闭 Tab 时检查是否为空
      closeTab: (tabId) => {
        set((state) => {
            const tabIndex = state.tabs.findIndex(t => t.id === tabId);
            if (tabIndex === -1) return state;

            const tabToRemove = state.tabs[tabIndex];
            const newSessions = { ...state.sessions };
            
            // 清理 Session
            tabToRemove.sessions.forEach(sid => delete newSessions[sid]);

            let newTabs = state.tabs.filter(t => t.id !== tabId);
            let newActiveId = state.activeTabId;

            // 如果删除了当前激活的 Tab，计算新的激活 ID
            if (state.activeTabId === tabId) {
                if (newTabs.length > 0) {
                    newActiveId = newTabs[Math.max(0, tabIndex - 1)].id;
                } else {
                    newActiveId = null; 
                }
            }

            // 🌟 自动打开 Welcome 页面逻辑
            if (newTabs.length === 0) {
                const welcomeTab = createWelcomeTab();
                newTabs = [welcomeTab];
                newActiveId = welcomeTab.id;
            }

            return {
                tabs: newTabs,
                activeTabId: newActiveId,
                sessions: newSessions
            };
        });
      },

      closeOtherTabs: (tabId) => {
          set((state) => {
              const tabToKeep = state.tabs.find(t => t.id === tabId);
              if (!tabToKeep) return state;

              const sessionsToKeep = new Set(tabToKeep.sessions);
              
              const newSessions: Record<string, TerminalSession> = {};
              Object.entries(state.sessions).forEach(([sid, session]) => {
                  if (sessionsToKeep.has(sid)) {
                      newSessions[sid] = session;
                  }
              });

              return {
                  tabs: [tabToKeep],
                  activeTabId: tabId,
                  sessions: newSessions
              };
          });
      },

      // 🟢 [修改 3] 关闭所有 Tab 时，重置为 Welcome 页
      closeAllTabs: () => {
          const welcomeTab = createWelcomeTab();
          set({ 
              tabs: [welcomeTab], 
              activeTabId: welcomeTab.id, 
              sessions: {} 
          });
      },

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      updateSessionStatus: (sessionId, status) => {
        set((state) => {
            if (!state.sessions[sessionId]) return state;
            return {
                sessions: {
                    ...state.sessions,
                    [sessionId]: { ...state.sessions[sessionId], status }
                }
            };
        });
      },

      toggleBroadcastMode: () => set(state => ({ isBroadcastMode: !state.isBroadcastMode })),

      splitTab: (tabId) => {
        set((state) => {
            const tab = state.tabs.find(t => t.id === tabId);
            if (!tab || tab.sessions.length === 0) return state;
            
            const sourceSessionId = tab.sessions[0];
            const sourceSession = state.sessions[sourceSessionId];
            
            if (!sourceSession) return state;

            const newSessionId = uuidv4();
            const newSession: TerminalSession = {
                ...sourceSession,
                id: newSessionId,
                status: 'connecting',
                connectTimestamp: Date.now()
            };

            const newTabs = state.tabs.map(t => 
                t.id === tabId ? { ...t, sessions: [...t.sessions, newSessionId] } : t
            );

            return {
                sessions: { ...state.sessions, [newSessionId]: newSession },
                tabs: newTabs
            };
        });
      },

      unsplitTab: (tabId) => {
        set((state) => {
          const tab = state.tabs.find(t => t.id === tabId);
          if (!tab || tab.sessions.length <= 1) return state;
          const sessionToKeepId = tab.sessions[0];
          const sessionsToRemove = tab.sessions.slice(1);
          const newSessions = { ...state.sessions };
          sessionsToRemove.forEach(sid => delete newSessions[sid]);
          const newTabs = state.tabs.map(t => t.id === tabId ? { ...t, sessions: [sessionToKeepId] } : t);
          return { sessions: newSessions, tabs: newTabs };
        });
      },

      reconnectTab: (tabId) => {
        set((state) => {
          const tab = state.tabs.find(t => t.id === tabId);
          if (!tab) return state;

          const newSessions = { ...state.sessions };
          
          tab.sessions.forEach(sid => {
            if (newSessions[sid]) {
                newSessions[sid] = { 
                    ...newSessions[sid], 
                    status: 'connecting',
                    connectTimestamp: Date.now()
                };
            }
          });

          return { sessions: newSessions };
        });
      },

      setTheme: (themeId) => set({ theme: themeId }),
    }),
    {
      name: 'terminal-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        tabs: state.tabs,
        // 如果 tabs 为空（理论上不会），确保恢复时至少有个 activeTabId
        activeTabId: state.activeTabId || (state.tabs.length > 0 ? state.tabs[0].id : null),
        sessions: state.sessions,
        theme: state.theme,
        monitorWidth: state.monitorWidth,
        monitorPosition: state.monitorPosition,
        fileManagerHeight: state.fileManagerHeight
      }),
    }
  )
);