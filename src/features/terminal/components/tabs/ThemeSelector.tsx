import { useTranslation } from "react-i18next";
import { clsx } from "clsx";
import { Palette, ChevronDown, Check, MoreHorizontal } from "lucide-react";
import { useTerminalStore } from "@/store/useTerminalStore";
import { TERMINAL_THEMES } from "../../constants"; // [核心] 引入真实数据源
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// [优化] 动态生成菜单选项，不再硬编码 MOCK_THEMES
const themeOptions = Object.entries(TERMINAL_THEMES).map(([id, theme]) => ({
  id,
  name: id.charAt(0).toUpperCase() + id.slice(1), // 将 id 首字母大写作为名字
  color: theme.background || '#000000' // 使用真实主题的背景色作为预览
}));

export const ThemeSelector = () => {
  const { t } = useTranslation();
  const { theme: currentTheme, setTheme } = useTerminalStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={clsx(
            "flex items-center gap-1 h-7 px-2 mr-1 rounded-md text-xs font-medium outline-none",
            "app-region-no-drag",
            "transition-colors duration-200",
            "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
            "hover:bg-slate-200 dark:hover:bg-white/10"
          )}
          title={t('terminal.theme.select', 'Select Theme')}
        >
          <Palette className="w-3.5 h-3.5" />
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{t('terminal.theme.label', 'Terminal Themes')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {themeOptions.map(theme => {
            const isSelected = currentTheme === theme.id;
            return (
            <DropdownMenuItem 
                key={theme.id} 
                onClick={() => setTheme(theme.id)} 
                className="cursor-pointer flex items-center justify-between"
            >
                <div className="flex items-center">
                {/* 颜色预览圆点 */}
                <div 
                    className="w-3 h-3 rounded-full mr-2 border border-slate-200 dark:border-white/20" 
                    style={{ backgroundColor: theme.color }} 
                />
                {theme.name}
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-500" />}
            </DropdownMenuItem>
            );
        })}
        
        <DropdownMenuSeparator />
        {/* 这个按钮可以跳转到我们在 Settings 里做的全局设置页 */}
        <DropdownMenuItem onClick={() => window.location.hash = '#/settings'}>
            <MoreHorizontal className="w-4 h-4 mr-2" />
            {t('terminal.theme.manage', 'Manage Themes...')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};