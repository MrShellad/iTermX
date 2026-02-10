import { useTranslation } from "react-i18next";
import { clsx } from "clsx";
import { 
  X, TerminalSquare, SplitSquareHorizontal, Minimize2, 
  RefreshCw, Trash2 
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { TerminalTab } from "@/store/useTerminalStore";

interface TerminalTabItemProps {
  tab: TerminalTab;
  isActive: boolean;
  sessionStatus: string;
  onClick: (id: string) => void;
  onClose: (e: React.MouseEvent, id: string) => void;
  onCloseOthers: (id: string) => void;
  onCloseAll: () => void;
  // 🟢 [修复 1] 新增：定义重连回调的类型
  onReconnect: (id: string) => void;
}

export const TerminalTabItem = ({
  tab,
  isActive,
  sessionStatus,
  onClick,
  onClose,
  onCloseOthers,
  onCloseAll,
  // 🟢 [修复 2] 解构出 onReconnect
  onReconnect 
}: TerminalTabItemProps) => {
  const { t } = useTranslation();
  const isSplit = tab.sessions && tab.sessions.length > 1;

  const statusIndicatorClass = {
      'connecting': 'bg-yellow-500 animate-pulse',
      'connected': 'bg-green-500',
      'error': 'bg-red-500',
      'disconnected': 'bg-slate-400'
  }[sessionStatus] || 'bg-slate-400';

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          data-tab-id={tab.id}
          onClick={() => onClick(tab.id)}
          className={clsx(
            "group relative overflow-hidden flex items-center h-9 px-3 min-w-[140px] max-w-[240px] shrink-0 rounded-t-xl cursor-pointer select-none font-medium text-xs transition-colors duration-200",
            "app-region-no-drag border-t border-x",
            isActive 
              ? [
                  "bg-white dark:bg-[#1e1e1e]", 
                  "border-slate-200 dark:border-white/10 border-b-transparent", 
                  "text-blue-600 dark:text-blue-400", 
                  "mb-[-1px] z-10", 
                  "shadow-[0_-2px_5px_rgba(0,0,0,0.02)]"
                ]
              : [
                  "bg-transparent border-transparent",
                  "text-slate-500 dark:text-slate-500", 
                  "hover:bg-slate-200/60 dark:hover:bg-white/5",
                  "hover:text-slate-700 dark:hover:text-slate-300",
                  "mb-0 opacity-80 hover:opacity-100" 
                ]
          )}
        >
          {isActive && (
             <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 dark:bg-blue-400" />
          )}

          <div className="mr-2.5 shrink-0 flex items-center justify-center">
              {tab.type === 'welcome' ? (
                  <TerminalSquare className={clsx("w-4 h-4", isActive ? "text-blue-500 dark:text-blue-400" : "text-slate-400")} />
              ) : (
                  <div className={clsx(
                    "flex items-center justify-center w-4 h-4 rounded-full transition-colors duration-200", 
                    isActive ? "bg-blue-50 dark:bg-blue-500/10" : "bg-slate-100 dark:bg-white/5"
                  )}>
                      <div className={clsx("w-1.5 h-1.5 rounded-full shadow-sm", statusIndicatorClass)} />
                  </div>
              )}
          </div>
          
          <span className="truncate flex-1 font-medium">{tab.title}</span>
          
          {isSplit && <SplitSquareHorizontal className="w-3.5 h-3.5 text-slate-400 mr-1.5 opacity-70" />}

          <div
            onClick={(e) => {
              e.stopPropagation();
              onClose(e, tab.id);
            }}
            className={clsx(
              "p-0.5 rounded-md transition-all duration-200 ml-1 shrink-0",
              isActive 
                ? "opacity-100 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-red-500" 
                : "opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-red-500"
            )}
          >
            <X className="w-3.5 h-3.5" />
          </div>

          {!isActive && (
              <div className="absolute right-0 top-3 bottom-3 w-px bg-slate-300/50 dark:bg-white/10 pointer-events-none" />
          )}
        </div>
      </ContextMenuTrigger>
      
      <ContextMenuContent className="w-56">
        {/* 🟢 [修复 3] 绑定 onClick 事件 */}
        <ContextMenuItem onClick={() => onReconnect(tab.id)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('terminal.tabs.reconnect', '重新连接')}
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem>
          {isSplit ? <Minimize2 className="w-4 h-4 mr-2" /> : <SplitSquareHorizontal className="w-4 h-4 mr-2" />}
          {isSplit ? t('terminal.tabs.unsplit', '取消分屏') : t('terminal.tabs.split', '添加至分屏')}
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={(e) => onClose(e as any, tab.id)}>
          <X className="w-4 h-4 mr-2" />
          {t('terminal.tabs.close', '关闭标签')}
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onCloseOthers(tab.id)}>
          <Trash2 className="w-4 h-4 mr-2" />
          {t('terminal.tabs.closeOthers', '关闭其他标签')}
        </ContextMenuItem>
        
        <ContextMenuItem onClick={onCloseAll} className="text-red-500 focus:text-red-500">
          <Trash2 className="w-4 h-4 mr-2" />
          {t('terminal.tabs.closeAll', '关闭所有标签')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};