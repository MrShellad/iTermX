import { useState, useEffect } from "react";
import { invoke } from '@tauri-apps/api/core';
import { useTerminalStore } from "@/store/useTerminalStore";
import { useServerStore } from "@/features/server/application/useServerStore";

export interface HistoryItem {
  id: number;
  command: string;
  createdAt: number;
}

export const useCommandHistory = (isOpen: boolean, isActive: boolean, sessionId: string | null) => {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 获取 Server 信息
  const session = useTerminalStore(s => sessionId ? s.sessions[sessionId] : null);
  const server = useServerStore(s => s.servers.find(srv => srv.id === session?.serverId));

  // 加载历史记录
  useEffect(() => {
    if (isOpen && isActive && server?.id) {
        setIsLoading(true);
        invoke<HistoryItem[]>('get_command_history', { serverId: server.id, limit: 50 })
            .then(data => {
                const sorted = (data || []).sort((a, b) => b.createdAt - a.createdAt);
                setHistoryList(sorted);
            })
            .catch(err => console.error("Failed to fetch history:", err))
            .finally(() => setIsLoading(false));
    }
  }, [isOpen, isActive, server?.id]);

  // 删除历史记录
  const deleteHistory = async (id: number) => {
      try {
          await invoke('delete_command_history', { id });
          setHistoryList(prev => prev.filter(h => h.id !== id));
      } catch (error) {
          console.error("Failed to delete history:", error);
      }
  };

  return {
    historyList,
    isLoading,
    server,
    deleteHistory
  };
};