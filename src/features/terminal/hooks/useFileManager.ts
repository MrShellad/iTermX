import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useFileStore } from "@/store/useFileStore";
import { useMonitorStore } from "@/store/useMonitorStore";
import { FileEntry } from "@/features/fs/types";
import { useTerminalStore } from "@/store/useTerminalStore";

export const useFileManager = (sessionId?: string) => {
  const { 
    getSession, initSession, setFiles, setLoading: setStoreLoading
  } = useFileStore();

  // [修正 1] 直接使用 sessionId 作为通信 ID (保持不变，这是修复 SFTP 连不上的关键)
  const connectionId = sessionId;

  // 依然保留这个检查，确保 Session 在 Store 中存在
  const isValidSession = useTerminalStore(state => 
     sessionId ? !!state.sessions[sessionId] : false
  );

  const monitorSession = useMonitorStore(state => sessionId ? state.sessions[sessionId] : undefined);
  const isConnectionReady = !!monitorSession?.os;

  const sessionState = sessionId ? getSession(sessionId) : null;
  const currentPath = sessionState?.currentPath || '/';
  const hasFiles = sessionState?.files && sessionState.files.length > 0;
  const isLoading = sessionState?.isLoading || false;
  const reloadTrigger = sessionState?.reloadTrigger || 0;

  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const prevPathRef = useRef(currentPath);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (sessionId) {
      initSession(sessionId);
    }
  }, [sessionId, initSession]);

  const fetchFiles = useCallback(async () => {
    if (!sessionId || !connectionId || !isValidSession) return;
    
    setStoreLoading(sessionId, true);
    setError(null);

    try {
      // =========================================================
      // 🛑 [核心修复] 将命令名改回 "list_ssh_files"
      // =========================================================
      const files = await invoke<FileEntry[]>("list_ssh_files", { 
          id: connectionId, // ID 依然传 UUID
          path: currentPath
      });
      
      if (isMounted.current) {
        setFiles(sessionId, files);
      }
    } catch (err: any) {
      console.error("List files error:", err);
      if (isMounted.current) {
         setStoreLoading(sessionId, false);
         const errorMsg = err.toString();

         if (errorMsg.includes("SFTP not enabled") || errorMsg.includes("channel request failed")) {
             setError("no_sftp");
         } else if (errorMsg.includes("Timed Out")) {
             setError("timeout");
         } else if (!errorMsg.includes("SSH connection not active")) {
             setError(errorMsg);
         }
      }
    }
  }, [sessionId, connectionId, isValidSession, currentPath, setStoreLoading, setFiles]);

  useEffect(() => {
    if (!sessionId) return;
    if (isConnectionReady) {
        fetchFiles();
    }
  }, [sessionId, isConnectionReady, currentPath, reloadTrigger, fetchFiles]); 

  useEffect(() => {
      if (prevPathRef.current !== currentPath && isConnectionReady) {
          fetchFiles();
      }
      prevPathRef.current = currentPath;
  }, [currentPath, isConnectionReady, fetchFiles]);

  return {
    isConnectionReady,
    hasFiles,
    isLoading,
    error,
    currentPath,
    fetchFiles,
    sessionState
  };
};