import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Server } from "@/features/server/domain/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTerminalStore } from "@/store/useTerminalStore";
import { useKeyStore } from "@/store/useKeyStore";
import { HostKeyData } from "@/features/server/components/HostKeyVerificationModal";
import { useTranslation } from "react-i18next"; // 🟢 1. 引入

export const useServerConnect = () => {
  const { t } = useTranslation(); // 🟢 2. 初始化
  const [isConnecting, setIsConnecting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLogError, setIsLogError] = useState(false);
  const [verificationData, setVerificationData] = useState<HostKeyData | null>(null);
  const [pendingServer, setPendingServer] = useState<Server | null>(null);

  const { createTab } = useTerminalStore();
  const status = useKeyStore((state) => state.status);
  const openGlobalUnlockModal = useKeyStore((state) => state.openGlobalUnlockModal);
  const navigate = useNavigate();

  // 监听后端推送的实时日志
  useEffect(() => {
    const unlisten = listen<string>('ssh-log', (event) => {
      setLogs(prev => [...prev, event.payload]);
    });
    return () => { unlisten.then(f => f()); };
  }, []);

  const executeConnection = async (server: Server) => {
    try {
      // 🟢 本地化日志
      setLogs(prev => [...prev, t('server.logs.registering', 'Registering connection session...')]); 
      
      try {
        await invoke('update_last_connected', { id: server.id });
      } catch (e) {
        console.error("❌ Failed to update stats:", e);
      }

      createTab({
        id: server.id,
        title: server.name,
        type: 'ssh',
        serverIp: server.ip
      });

      // 稍微延迟一点点关闭，让用户看清最后一条“成功”日志
      setTimeout(() => {
        setIsConnecting(false);
        navigate('/terminal');
      }, 300);

    } catch (error: any) {
      setIsLogError(true);
      // 🟢 本地化错误日志 (插值)
      const errorMsg = error.message || error;
      setLogs(prev => [...prev, `[ERROR] ${t('server.logs.errorAbort', 'Connection aborted')}: ${errorMsg}`]);
      
      // 🟢 本地化 Toast
      toast.error(t('server.errorTerminal', 'Failed to open terminal: {{message}}', { message: errorMsg }));
    }
  };

  const connect = async (server: Server) => {
    if (isConnecting) return;
    
    if (status !== 'unlocked') {
        // 🟢 本地化 Toast (这句之前可能翻译过，这里复用 key)
        toast.info(t('server.locked_connect', 'Please unlock the Vault to connect.'));
        openGlobalUnlockModal();
        return;
    }
    
    // 初始化连接状态
    setLogs([]);
    setIsLogError(false);
    setIsConnecting(true);
    setPendingServer(server);

    // 如果是密钥认证，直接执行连接
    if (server.authType === 'key') {
        // 🟢 本地化日志
        setLogs(prev => [...prev, t('server.logs.authKey', 'Auth Method: Public Key. Initializing tunnel...')]);
        await executeConnection(server);
        return;
    }

    try {
        // 🟢 本地化日志
        setLogs(prev => [...prev, t('server.logs.preflight', 'Initiating pre-flight host verification...')]);
        
        // 1. 发起主机密钥预检查
        const checkResult = await invoke<{ status: string, data?: HostKeyData }>('check_host_key', { 
            id: server.id,
            host: server.ip,
            port: server.port
        });

        if (checkResult.status === 'verified') {
            await executeConnection(server);
        } else {
            // 需要人工验证时，先隐藏日志弹窗，以免重叠
            setIsConnecting(false); 
            setVerificationData(checkResult.data || null);
        }

    } catch (error: any) {
        setIsLogError(true);
        // 🟢 本地化错误日志
        setLogs(prev => [...prev, `[ERROR] ${t('server.logs.preflightError', 'Pre-flight failed')}: ${error}`]);
        console.error("Host check failed", error);
    }
  };

  // 用户在验证弹窗点击“信任”
  const handleTrustAndConnect = async () => {
    if (!pendingServer || !verificationData) return;
    
    // 🟢 本地化日志
    setLogs(prev => [...prev, t('server.logs.trusted', 'Host key trusted. Saving to known_hosts...')]);
    setIsConnecting(true); // 重新打开日志弹窗

    try {
        await invoke('trust_host_key', {
            id: pendingServer.id,
            fingerprint: verificationData.fingerprint,
            keyType: verificationData.keyType
        });
        await executeConnection(pendingServer);
    } catch (error: any) {
        setIsLogError(true);
        // 🟢 本地化错误日志
        setLogs(prev => [...prev, `[ERROR] ${t('server.logs.saveError', 'Failed to save host key')}: ${error}`]);
        
        // 🟢 本地化 Toast
        toast.error(t('server.errorTrust', 'Failed to trust host key'));
    }
  };

  return { 
      connect, 
      isConnecting,
      logs, 
      isLogError,
      pendingServer,
      verificationData,
      handleTrustAndConnect,
      handleCancelVerification: () => {
          setIsConnecting(false);
          setVerificationData(null);
          setPendingServer(null);
      },
      closeLogModal: () => {
          setIsConnecting(false);
          setIsLogError(false);
      }
  };
};