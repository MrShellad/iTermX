import { TerminalTab } from "@/store/useTerminalStore";
import { useSettingsStore } from "@/features/settings/application/useSettingsStore";
import { TERMINAL_THEMES } from "../constants";
import { clsx } from "clsx";
import { XtermView } from "./XtermView";

interface Props {
  tab: TerminalTab;
  isActive: boolean;
}

export const TerminalSessionView = ({ tab, isActive }: Props) => {
  const isSplit = tab.sessions.length > 1;
  const settings = useSettingsStore(s => s.settings);
  const customThemes = useSettingsStore(s => s.customThemes);
  
  // 主题背景色逻辑保持在布局层，用于填充 Grid 间隙
  const themeId = settings['terminal.theme'] || 'default';
  const allThemes = { ...TERMINAL_THEMES, ...customThemes };
  const themeObj = allThemes[themeId] || allThemes['default'];

  return (
    <div 
      className={clsx("w-full h-full p-1 overflow-hidden")}
      style={{ backgroundColor: themeObj.background }}
    >
       {isSplit ? (
         <div className="grid grid-cols-2 h-full gap-1">
            {tab.sessions.map(sid => (
                <div key={sid} className="border border-white/10 relative">
                   <XtermView sessionId={sid} isActive={isActive} />
                </div>
            ))}
         </div>
       ) : (
         <XtermView sessionId={tab.sessions[0]} isActive={isActive} />
       )}
    </div>
  );
};