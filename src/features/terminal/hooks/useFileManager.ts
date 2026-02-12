import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useFileStore } from "@/store/useFileStore";
import { useMonitorStore } from "@/store/useMonitorStore";
import { FileEntry } from "@/features/fs/types";
import { useTerminalStore } from "@/store/useTerminalStore";

export const useFileManager = (sessionId?: string) => {
  const { 
    getSession, 
    initSession, 
    setFiles, 
    setLoading: setStoreLoading,
    setPath // 🟢 [修改 1] 从 Store 中解构出 setPath
  } = useFileStore();

  const connectionId = sessionId;

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

  // =================================================================
  // 🟢 [修改 2] 新增：初始化时自动获取并跳转到家目录
  // =================================================================
  useEffect(() => {
    // 只有在连接就绪，且当前处于默认根目录 '/' 时才触发
    if (sessionId && isConnectionReady && currentPath === '/') {
        invoke<string>('sftp_get_home_dir', { id: sessionId })
            .then((homePath) => {
                // 如果获取到了家目录，且不是根目录，则更新路径
                // 这会自动触发下面的 fetchFiles，从而加载家目录文件
                if (homePath && homePath !== '/') {
                    // console.log("🏠 Home directory detected:", homePath);
                    setPath(sessionId, homePath);
                }
            })
            .catch(err => {
                // 获取失败不阻断，只是停留在 /
                console.warn("Failed to detect home directory:", err);
            });
    }
  }, [sessionId, isConnectionReady, currentPath, setPath]);

  const fetchFiles = useCallback(async () => {
    if (!sessionId || !connectionId || !isValidSession) return;
    
    setStoreLoading(sessionId, true);
    setError(null);

    try {
      const files = await invoke<FileEntry[]>("list_ssh_files", { 
          id: connectionId,
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