// src/features/terminal/components/FileManagerPanel.tsx
import { FsTopBar } from "@/features/fs/components/FsTopBar";
import { FileList } from "@/features/fs/components/FileList";
import { TransferManager } from "@/features/fs/components/TransferManager";

// Hooks
import { useFileManager } from "@/features/terminal/hooks/useFileManager";
// 引入 Store 仅用于校验会话有效性，不用于传参替换
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
  // 1. 校验逻辑：仅用于判断是否显示 "NoSessionView"
  const session = useTerminalStore(state => 
    sessionId ? state.sessions[sessionId] : undefined
  );
  const serverConfig = useServerStore(state => 
    state.servers.find(s => s.id === session?.serverId)
  );

  const isValid = sessionId && session && serverConfig;
  
  // 2. [核心修正] 必须传 sessionId (前端 Tab ID) 给 Hook
  // Hook 内部会自动反查 Connection ID 用于后端通信
  // 如果传 connectionId，会导致多个 Tab 状态冲突，且 Hook 内部查找 Session 会失败
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
        
        {/* 顶部工具栏 - 传 sessionId */}
        <div className="shrink-0 z-10">
            <FsTopBar sessionId={sessionId} />
        </div>

        {/* 文件列表容器 - 传 sessionId */}
        <div className="flex-1 min-h-0 relative flex flex-col">
            {isLoading && <LoadingOverlay />}
            
            {error && <ErrorBar error={error} onRetry={fetchFiles} />}

            <FileList sessionId={sessionId} />
        </div>

        {/* 传输管理器 (全局组件，其实不需要传 ID，或是内部处理) */}
        <TransferManager />
    </div>
  );
};