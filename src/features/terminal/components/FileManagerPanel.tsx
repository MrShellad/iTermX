// src/features/terminal/components/FileManagerPanel.tsx
import { FsTopBar } from "@/features/fs/components/FsTopBar";
import { FileList } from "@/features/fs/components/FileList";
import { TransferManager } from "@/features/fs/components/TransferManager";

// Hooks
import { useFileManager } from "@/features/terminal/hooks/useFileManager";
// 引入 Store
import { useTerminalStore } from "@/store/useTerminalStore";
import { useServerStore } from "@/features/server/application/useServerStore";

// Components
import { 
  NoSessionView, 
  NoSftpView, 
  TimeoutView, 
  WaitingConnectionView 
} from "./FileManager/StatusViews";
import { LoadingOverlay, ErrorBar } from "./FileManager/FileManagerUI";

interface Props {
  sessionId?: string;
  isActive: boolean;
}

export const FileManagerPanel = ({ sessionId }: Props) => {
  // 1. 获取会话和服务器配置
  const session = useTerminalStore(state => 
    sessionId ? state.sessions[sessionId] : undefined
  );
  
  // 🟢 从 useServerStore 中查找当前连接对应的服务器配置
  // 您的 Store 结构支持通过 ID 查找，且 server 对象包含 username 和 ip
  const serverConfig = useServerStore(state => 
    state.servers.find(s => s.id === session?.serverId)
  );

  const isValid = sessionId && session && serverConfig;
  
  // 2. File Manager Hook
  const { 
    isConnectionReady, 
    hasFiles, 
    isLoading, 
    error, 
    fetchFiles, 
  } = useFileManager(sessionId);

  // 3. 状态守卫渲染
  if (!isValid) {
      return <NoSessionView />;
  }

  if (error === 'no_sftp') {
      return <NoSftpView onRetry={fetchFiles} />;
  }

  if (error === 'timeout') {
      return <TimeoutView onRetry={fetchFiles} />;
  }

  if (!isConnectionReady && !hasFiles) {
      return <WaitingConnectionView onForceLoad={fetchFiles} />;
  }

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden">
        
        {/* 顶部工具栏 */}
        <div className="shrink-0 z-10">
            {/* 🟢 [核心修改] 将用户信息传给 FsTopBar */}
            <FsTopBar 
                sessionId={sessionId} 
                username={serverConfig.username} // 例如 "root" 或 "ubuntu"
            />
        </div>

        {/* 文件列表容器 */}
        <div className="flex-1 min-h-0 relative flex flex-col">
            {isLoading && <LoadingOverlay />}
            
            {error && <ErrorBar error={error} onRetry={fetchFiles} />}

            <FileList sessionId={sessionId} />
        </div>

        {/* 传输管理器 */}
        <TransferManager />
    </div>
  );
};