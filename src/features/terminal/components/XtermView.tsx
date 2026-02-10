import { useRef } from "react"; 
import { ContextMenu } from "@/components/common/ContextMenu";
import { useTerminalSession } from "../application/useTerminalSession";
import { useTerminalContextMenu } from "../application/useTerminalContextMenu";
import { useTranslation } from "react-i18next"; 
import { useTerminalAutocomplete } from "../application/useTerminalAutocomplete";
import { AutocompletePopup } from "./AutocompletePopup";
import { PasswordModal } from "@/components/common/PasswordModal"; 
import { Loader2 } from "lucide-react"; 

interface Props {
  sessionId: string;
  isActive: boolean;
}

export const XtermView = ({ sessionId, isActive }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  
  // 核心 Hook
  const { 
    mountRef, 
    termRef, 
    style, // 🟢 包含 padding 和 themeObj
    isPasswordRequired, 
    closePasswordModal,
    reconnectWithPassword,
    status 
  } = useTerminalSession(sessionId, isActive);

  const { menuConfig, menuItems, handleClose } = useTerminalContextMenu(containerRef, termRef, sessionId);

  // 联想 Hook
  const { 
    visible: acVisible, 
    cursorInfo,
    suggestions, 
    selectedIndex, 
    applyCompletion 
  } = useTerminalAutocomplete(termRef.current, sessionId);

  return (
    <div 
      ref={containerRef} 
      // 🟢 [修复] 增加 box-border 和 overflow-hidden 确保布局稳定
      className="w-full h-full relative overflow-hidden box-border" 
      // 🟢 [核心修复] 将 Hook 返回的 padding 应用到 style 上
      style={{ padding: `${style.padding}px` }}
    >
      {/* 连接状态遮罩 */}
      {status === 'connecting' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px] transition-all duration-300">
           <div className="flex items-center gap-3 px-6 py-3 bg-slate-900/80 border border-white/10 rounded-full shadow-2xl backdrop-blur-md">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-sm font-medium text-slate-200">
                {t('terminal.connecting', 'Connecting to server...')}
              </span>
           </div>
        </div>
      )}

      {/* 终端挂载点 - 占满容器内部（受父级 padding 约束） */}
      <div ref={mountRef} className="w-full h-full" />
      
      {/* 自动补全弹窗 */}
      <AutocompletePopup
            visible={acVisible}
            cursorInfo={cursorInfo || { x: 0, y: 0, lineHeight: 0 }}
            items={suggestions}
            selectedIndex={selectedIndex}
            onSelect={applyCompletion}
            theme={{
                background: style.themeObj.background || '#1e1e1e',
                foreground: style.themeObj.foreground || '#ffffff',
                cursor: style.themeObj.cursor || '#ffffff'
            }}
        />

        {/* 右键菜单 */}
        <ContextMenu 
            x={menuConfig.x}
            y={menuConfig.y}
            visible={menuConfig.visible}
            onClose={handleClose}
            items={menuItems}
            theme={{
                background: style.themeObj.background || '#000000',
                foreground: style.themeObj.foreground || '#ffffff',
                cursor: style.themeObj.cursor || '#ffffff',
                selection: (style.themeObj as any).selectionBackground || 'rgba(255, 255, 255, 0.2)'
            }}
        />

        {/* 密码重连弹窗 */}
        <PasswordModal 
            isOpen={isPasswordRequired}
            title={t('terminal.reconnectAuth', 'Session Expired')}
            description={t('terminal.reconnectDesc', 'This is a temporary connection. Please re-enter the password to reconnect.')}
            onSubmit={async (pwd) => {
               await reconnectWithPassword(pwd);
            }}
            onClose={closePasswordModal} 
        />
    </div>
  );
};