import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Radio, FolderTree, Book } from "lucide-react";
import { clsx } from "clsx";

import { GlassTooltip } from "@/components/common/GlassTooltip";

import { useSettingsStore } from "@/features/settings/application/useSettingsStore";
import { useTerminalStore } from "@/store/useTerminalStore";
import { TERMINAL_THEMES } from "../constants";

import { useCommandSender } from "../application/useCommandSender";
import { SnippetLibraryModal } from "./command/SnippetLibraryModal";

export const CommandToolbar = () => {
  const { t } = useTranslation();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const settings = useSettingsStore(s => s.settings);
  const customThemes = useSettingsStore(s => s.customThemes);
  const themeId = settings['terminal.theme'] || 'default';
  
  const allThemes = { ...TERMINAL_THEMES, ...customThemes };
  const themeObj = allThemes[themeId] || allThemes['default'];

  const { fileManagerHeight, setFileManagerHeight } = useTerminalStore();
  const isFileManagerOpen = fileManagerHeight > 5;

  const {
    inputValue,
    setInputValue,
    activeSessionId,
    isBroadcastMode,
    toggleBroadcast,
    sendCommand
  } = useCommandSender();

  const toggleFileManager = () => {
    if (isFileManagerOpen) {
        sessionStorage.setItem('last_fm_height', String(fileManagerHeight));
        setFileManagerHeight(0);
    } else {
        const lastHeight = Number(sessionStorage.getItem('last_fm_height'));
        setFileManagerHeight(lastHeight && lastHeight > 50 ? lastHeight : 280);
    }
  };

  const handleSnippetSelect = (code: string, autoRun: boolean) => {
      const safeCode = code || ''; 
      if (autoRun) {
          sendCommand(safeCode);
      } else {
          setInputValue(safeCode);
      }
      // Modal 内部控制关闭，或者保持开启方便连续操作
  };

  const handleManualSend = () => sendCommand(inputValue);

  const inputStyle = {
      color: themeObj.foreground,
      backgroundColor: 'rgba(128, 128, 128, 0.15)', 
      borderColor: 'transparent'
  };
  
  const safeInputValue = inputValue || '';

  return (
    <>
        <div 
            className="flex items-center gap-2 px-3 py-2 w-full shrink-0 z-30 transition-colors duration-300"
            style={{
                backgroundColor: themeObj.background,
                color: themeObj.foreground,
                borderTop: `1px solid`,
                borderColor: 'rgba(128, 128, 128, 0.2)' 
            }}
        >
        {/* 1. 文件管理器按钮 */}
        <GlassTooltip 
            content={isFileManagerOpen 
                ? t('cmd.collapseFileManager', 'Collapse File Manager') 
                : t('cmd.expandFileManager', 'Expand File Manager')}
            side="top"
        >
            <Button 
                size="icon" 
                variant="ghost" 
                onClick={toggleFileManager}
                className="shrink-0 h-7 w-7 rounded transition-all hover:bg-white/10"
                style={{
                    color: themeObj.foreground,
                    opacity: isFileManagerOpen ? 1 : 0.6
                }}
            >
                <FolderTree className="w-4 h-4" />
            </Button>
        </GlassTooltip>

        {/* 2. 代码库按钮 */}
        <GlassTooltip content={t('cmd.library', 'Snippet & History')} side="top">
            <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setIsLibraryOpen(true)}
                className="shrink-0 h-7 w-7 rounded transition-all hover:bg-white/10"
                style={{
                    color: themeObj.foreground,
                    opacity: 0.8
                }}
            >
                <Book className="w-4 h-4" />
            </Button>
        </GlassTooltip>

        {/* 3. 输入框 */}
        <Input 
            value={safeInputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleManualSend();
                }
            }}
            placeholder={activeSessionId ? t('cmd.typeCommand', 'Type command...') : t('cmd.noSession', 'No active session')}
            disabled={!activeSessionId}
            className="h-7 text-xs font-mono disabled:opacity-50 flex-1 focus-visible:ring-1 focus-visible:ring-blue-500/50 placeholder:opacity-50"
            style={inputStyle}
        />

        {/* 分割线 */}
        <div 
            className="h-4 w-[1px] mx-1" 
            style={{ backgroundColor: themeObj.foreground, opacity: 0.2 }}
        />

        {/* 4. 广播按钮 */}
        <GlassTooltip 
            content={isBroadcastMode 
                ? t('cmd.broadcastOn', 'Broadcast: ON') 
                : t('cmd.broadcastOff', 'Broadcast: OFF')}
            side="top"
        >
            <Button 
                size="icon" 
                variant="ghost" 
                onClick={toggleBroadcast}
                className={clsx(
                    "shrink-0 h-7 w-7 rounded transition-all",
                    isBroadcastMode 
                        ? "text-red-500 bg-red-500/10 hover:bg-red-500/20" 
                        : "hover:bg-white/10"
                )}
                style={{
                    color: isBroadcastMode ? undefined : themeObj.foreground,
                    opacity: isBroadcastMode ? 1 : 0.7
                }}
            >
                <Radio className="w-3.5 h-3.5" />
            </Button>
        </GlassTooltip>

        {/* 5. 发送按钮 */}
        <Button 
            size="icon" 
            onClick={handleManualSend}
            disabled={!safeInputValue.trim() || !activeSessionId}
            className="h-7 w-7 shrink-0 disabled:opacity-30 rounded transition-all"
            style={{
                backgroundColor: '#2563eb', // blue-600
                color: '#ffffff'
            }}
        >
            <Send className="w-3 h-3" />
        </Button>
        </div>

        {/* 🟢 [修复] 使用 activeSessionId || null 来解决类型错误 */}
        <SnippetLibraryModal 
            isOpen={isLibraryOpen}
            onClose={() => setIsLibraryOpen(false)}
            onSelect={handleSnippetSelect}
            sessionId={activeSessionId || null} 
        />
    </>
  );
};