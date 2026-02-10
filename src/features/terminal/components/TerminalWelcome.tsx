import { useTranslation } from "react-i18next";
import { ServerListPage } from "@/features/server/list";

export const TerminalWelcome = () => {
  const { t } = useTranslation();

  return (
    // 🟢 [修改] 移除了背景色类 (bg-slate-50 dark:bg-slate-950)，现在是全透明的
    <div className="h-full w-full p-8 flex flex-col items-center justify-center">
       <div className="max-w-5xl w-full h-full flex flex-col">
          <div className="mb-8 text-center">
            {/* 🟢 [修改] 使用 i18n 替换硬编码文本 */}
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {t('terminal.welcome.title', 'Welcome to Terminal')}
            </h1>
            <p className="text-slate-500">
              {t('terminal.welcome.subtitle', 'Select a server to start a new session')}
            </p>
          </div>
          
          {/* 这里的 bg-transparent 保持不变 */}
          <div className="flex-1 overflow-hidden relative border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-transparent p-4">
             <ServerListPage />
          </div>
       </div>
    </div>
  );
};