import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Terminal, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  logs: string[];
  serverName?: string;
  onClose?: () => void;
  isError?: boolean;
}

export const ConnectionStatusModal = ({ open, logs, serverName, onClose, isError }: Props) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!open) return null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-[450px] p-0 border-none bg-[#1e1e1e] text-zinc-300 shadow-2xl rounded-xl overflow-hidden font-mono select-none">
        {/* Header */}
        <div className="p-4 bg-[#252526] flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {isError 
                  ? t('server.sshlog.failed', 'Connection Failed') 
                  : t('server.sshlog.connecting', 'Connecting...')}
            </span>
          </div>
          {!isError ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          ) : (
            <button onClick={onClose} className="hover:text-white transition-colors">
              <XCircle className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex flex-col">
            <div className="text-[13px] font-bold text-white truncate">{serverName}</div>
            {/* 🟢 [修改] 添加本地化: 建立安全隧道 */}
            <div className="text-[10px] text-zinc-500 uppercase tracking-tighter">
              {t('server.sshlog.tunnel', 'Establishing Secure Tunnel')}
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="h-56 overflow-y-auto bg-black/40 rounded-lg p-3 text-[11px] leading-relaxed custom-scrollbar border border-white/5 space-y-1"
          >
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2 break-all animate-in fade-in slide-in-from-left-1 duration-200">
                <span className="text-emerald-500 shrink-0 select-none">❯</span>
                {/* 日志内容通常来自后端，直接显示即可 */}
                <span className={cn(log.toLowerCase().includes('failed') || log.toLowerCase().includes('error') ? "text-red-400" : "")}>
                  {log}
                </span>
              </div>
            ))}
            {/* 🟢 [修改] 添加本地化: 初始化引擎 */}
            {logs.length === 0 && (
              <div className="text-zinc-600 italic">
                {t('server.sshlog.init', 'Initializing engine...')}
              </div>
            )}
          </div>
          
          {isError && (
             <button 
               onClick={onClose}
               className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-xs transition-colors"
             >
               {t('common.close', 'Close')}
             </button>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};