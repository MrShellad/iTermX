import { create } from 'zustand';
import { FileEntry, SortField, SortOrder } from '@/features/fs/types';

export interface ClipboardState {
  type: 'copy' | 'move';
  files: FileEntry[];
  sourcePath: string;
}

// [新增] 定义缓存结构
interface FileCache {
  [path: string]: {
    data: FileEntry[];
    timestamp: number;
  };
}

// [常量] 缓存有效期，例如 5 分钟 (300000ms)
const CACHE_DURATION = 300000;

interface SessionFileState {
  currentPath: string;
  history: string[];
  historyIndex: number;
  files: FileEntry[];
  isLoading: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  showHidden: boolean;
  reloadTrigger: number;
  clipboard: ClipboardState | null;
  // [新增] 缓存字段
  cache: FileCache; 
}

const defaultSessionState: SessionFileState = {
  currentPath: '/',
  history: ['/'],
  historyIndex: 0,
  files: [],
  isLoading: false,
  sortField: 'name',
  sortOrder: 'asc',
  showHidden: false,
  reloadTrigger: 0,
  clipboard: null,
  cache: {}, // [新增] 默认空缓存
};

interface FileStore {
  sessions: Record<string, SessionFileState>;
  
  triggerReload: (sessionId: string) => void; 
  initSession: (sessionId: string) => void;
  
  // [修改] setPath 现在负责判断缓存逻辑
  setPath: (sessionId: string, path: string) => void;
  
  setFiles: (sessionId: string, files: FileEntry[]) => void;
  setLoading: (sessionId: string, loading: boolean) => void;
  goBack: (sessionId: string) => void;
  goForward: (sessionId: string) => void;
  goUp: (sessionId: string) => void;
  toggleHidden: (sessionId: string) => void;
  setSort: (sessionId: string, field: SortField) => void;
  getSession: (sessionId: string) => SessionFileState;
  setClipboard: (sessionId: string, clipboard: ClipboardState | null) => void;
  
  // [新增] 专门用于清理缓存（例如刷新时强制清理）
  clearCache: (sessionId: string, path: string) => void;
}

export const useFileStore = create<FileStore>((set, get) => ({
  sessions: {},

  getSession: (sessionId) => {
    return get().sessions[sessionId] || defaultSessionState;
  },

  triggerReload: (sessionId) => {
    // 刷新时，除了增加 trigger，最好也清理当前路径的缓存，强制重新请求
    const session = get().sessions[sessionId];
    if (session) {
        get().clearCache(sessionId, session.currentPath);
    }

    set((state) => ({
      sessions: {
        ...state.sessions,
        [sessionId]: {
          ...(state.sessions[sessionId] || defaultSessionState),
          reloadTrigger: (state.sessions[sessionId]?.reloadTrigger || 0) + 1
        }
      }
    }));
  },

  initSession: (sessionId) => set((state) => {
    if (state.sessions[sessionId]) return {};
    return {
      sessions: {
        ...state.sessions,
        [sessionId]: { ...defaultSessionState }
      }
    };
  }),

  // [修改] setFiles：不仅更新当前文件列表，还写入缓存
  setFiles: (sessionId, files) => set((state) => {
    const session = state.sessions[sessionId] || defaultSessionState;
    return {
      sessions: {
        ...state.sessions,
        [sessionId]: {
          ...session,
          files,
          isLoading: false,
          // [核心] 更新缓存
          cache: {
            ...session.cache,
            [session.currentPath]: { data: files, timestamp: Date.now() }
          }
        }
      }
    };
  }),

  // [新增] 专门用于清理指定路径的缓存
  clearCache: (sessionId, path) => set((state) => {
      const session = state.sessions[sessionId];
      if (!session) return {};
      const newCache = { ...session.cache };
      delete newCache[path];
      return {
          sessions: {
              ...state.sessions,
              [sessionId]: { ...session, cache: newCache }
          }
      };
  }),

  setClipboard: (sessionId, clipboard) => set((state) => ({
    sessions: {
      ...state.sessions,
      [sessionId]: {
        ...(state.sessions[sessionId] || defaultSessionState),
        clipboard
      }
    }
  })),
  
  // [核心修改] setPath 逻辑优化
  setPath: (sessionId, path) => set((state) => {
      const session = state.sessions[sessionId] || defaultSessionState;
      if (session.currentPath === path) return {}; // 避免重复跳转

      const newHistory = [...session.history.slice(0, session.historyIndex + 1), path];

      // [核心优化] 检查缓存
      const cached = session.cache[path];
      const isCacheValid = cached && (Date.now() - cached.timestamp < CACHE_DURATION);

      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...session,
            currentPath: path,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            
            // [关键] 如果缓存有效，直接使用缓存文件，且不进入 loading
            // 如果缓存无效，先保留旧文件(或空)，并设为 loading
            files: isCacheValid ? cached.data : (session.files), // 这里可以保留旧files防止闪白，或者 []
            isLoading: !isCacheValid, // 只有没缓存时才 Loading
          }
        }
      };
  }),

  setLoading: (sessionId, loading) => set((state) => ({
    sessions: {
      ...state.sessions,
      [sessionId]: { ...(state.sessions[sessionId] || defaultSessionState), isLoading: loading }
    }
  })),

  goBack: (sessionId) => set((state) => {
      const session = state.sessions[sessionId];
      if (!session || session.historyIndex <= 0) return {};
      const newIndex = session.historyIndex - 1;
      const path = session.history[newIndex];
      
      // [Back 逻辑同样应用缓存策略]
      const cached = session.cache[path];
      const isCacheValid = cached && (Date.now() - cached.timestamp < CACHE_DURATION);

      return { 
          sessions: { 
              ...state.sessions, 
              [sessionId]: { 
                  ...session, 
                  historyIndex: newIndex, 
                  currentPath: path,
                  files: isCacheValid ? cached.data : session.files,
                  isLoading: !isCacheValid
              } 
          } 
      };
  }),

  goForward: (sessionId) => set((state) => {
      const session = state.sessions[sessionId];
      if (!session || session.historyIndex >= session.history.length - 1) return {};
      const newIndex = session.historyIndex + 1;
      const path = session.history[newIndex];

      // [Forward 逻辑同样应用缓存策略]
      const cached = session.cache[path];
      const isCacheValid = cached && (Date.now() - cached.timestamp < CACHE_DURATION);

      return { 
          sessions: { 
              ...state.sessions, 
              [sessionId]: { 
                  ...session, 
                  historyIndex: newIndex, 
                  currentPath: path,
                  files: isCacheValid ? cached.data : session.files,
                  isLoading: !isCacheValid
              } 
          } 
      };
  }),

  goUp: (sessionId) => {
      const session = get().sessions[sessionId];
      if (!session) return;
      const parent = session.currentPath.split('/').slice(0, -1).join('/') || '/';
      if (parent !== session.currentPath) get().setPath(sessionId, parent);
  },

  toggleHidden: (sessionId) => set((state) => ({
      sessions: { ...state.sessions, [sessionId]: { ...(state.sessions[sessionId] || defaultSessionState), showHidden: !state.sessions[sessionId]?.showHidden } }
  })),
  
  setSort: (sessionId, field) => set((state) => {
      const session = state.sessions[sessionId] || defaultSessionState;
      return { sessions: { ...state.sessions, [sessionId]: { ...session, sortField: field, sortOrder: session.sortField === field && session.sortOrder === 'asc' ? 'desc' : 'asc' } } };
  }),
}));