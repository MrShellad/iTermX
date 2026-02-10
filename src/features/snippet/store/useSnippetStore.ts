import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Snippet } from '../domain/types';
import { SnippetService } from '../application/snippetService';

interface SnippetState {
  snippets: Snippet[];
  searchQuery: string;
  activeTag: string | null;
  isLoading: boolean;
  
  // --- Actions ---
  init: () => Promise<void>;
  addSnippet: (data: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSnippet: (id: string, updates: Partial<Snippet>) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
  
  setSearchQuery: (query: string) => void;
  setActiveTag: (tag: string | null) => void;
  
  // --- Getters (Selectors) ---
  getFilteredSnippets: () => Snippet[];
  getAllTags: () => string[];
}

export const useSnippetStore = create<SnippetState>((set, get) => ({
  snippets: [],
  searchQuery: '',
  activeTag: null,
  isLoading: true, 

  // 🟢 [核心修复] 优化初始化逻辑，防止闪烁
  init: async () => {
    try {
      // 1. 检查当前是否已有数据
      const currentSnippets = get().snippets;
      
      // 2. 只有当没有数据时，才强制显示 Loading 状态
      // 如果已经有数据（比如从其他页面切回来），则保持当前显示，后台静默刷新
      if (currentSnippets.length === 0) {
         set({ isLoading: true });
      }

      const data = await SnippetService.getAll();
      
      // 3. 数据回来后更新，并确保 loading 结束
      set({ snippets: data, isLoading: false });
    } catch (error) {
      console.error("Failed to load snippets from DB:", error);
      set({ isLoading: false });
    }
  },

  // ... (addSnippet, updateSnippet, deleteSnippet 等保持不变) ...
  addSnippet: async (data) => {
    const newSnippet: Snippet = {
      ...data,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    set((state) => ({ snippets: [newSnippet, ...state.snippets] }));
    try {
      await SnippetService.add(newSnippet);
    } catch (e) { console.error(e); }
  },

  updateSnippet: async (id, updates) => {
    const { snippets } = get();
    const target = snippets.find(s => s.id === id);
    if (!target) return;
    const updatedSnippet = { ...target, ...updates, updatedAt: Date.now() };
    set((state) => ({
      snippets: state.snippets.map((s) => s.id === id ? updatedSnippet : s)
    }));
    try {
      await SnippetService.fullUpdate(updatedSnippet);
    } catch (e) { console.error(e); }
  },

  deleteSnippet: async (id) => {
    set((state) => ({
      snippets: state.snippets.filter((s) => s.id !== id)
    }));
    try {
      await SnippetService.delete(id);
    } catch (e) { console.error(e); }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveTag: (tag) => set({ activeTag: tag }),

  getAllTags: () => {
    const { snippets } = get();
    const tags = new Set<string>();
    snippets.forEach(s => s.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  },

  getFilteredSnippets: () => {
    const { snippets, searchQuery, activeTag } = get();
    const lowerQuery = searchQuery.toLowerCase();
    return snippets.filter(s => {
      const matchesSearch = !lowerQuery || 
                            s.title.toLowerCase().includes(lowerQuery) || 
                            s.code.toLowerCase().includes(lowerQuery);
      const matchesTag = !activeTag || s.tags.includes(activeTag);
      return matchesSearch && matchesTag;
    });
  }
}));