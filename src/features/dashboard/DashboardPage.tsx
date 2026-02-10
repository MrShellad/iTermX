import { useTranslation } from "react-i18next";
import { DashboardHeader } from "./components/DashboardHeader";
// 🟢 [修改] 引入新的快速连接组件
import { QuickConnect } from "./components/widgets/QuickConnect"; 

// 暂时注释掉未使用的组件引用
// import { RecentConnections } from "./components/RecentConnections";
// import { StarredServers } from "./components/StarredServers";
// import { SponsorSection } from "./components/SponsorSection";

import { DailyEmoji } from "./components/widgets/DailyEmoji";
import { useDashboardStore } from "./store/useDashboardStore";

export const DashboardPage = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useDashboardStore();

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden text-slate-900 dark:text-slate-50 font-sans selection:bg-blue-500/30">
      
      <div className="relative z-10 flex flex-col h-full w-full mx-auto">
         
         {/* === 头部区域 === */}
         <div className="shrink-0 pt-6 pb-2 px-6 md:px-12">
            <div className="max-w-6xl mx-auto w-full">
                <DashboardHeader />
            </div>
         </div>

         {/* === 滚动区域 === */}
         <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-6 md:px-12 pt-2 pb-6">
             
             {/* 居中容器 */}
             <div className="max-w-4xl mx-auto w-full space-y-12 mt-8">
                 
                 {/* 🟢 [新增] 快速连接区域 (替换了原来的 Beta 警告) */}
                 <section className="w-full">
                    <QuickConnect />
                 </section>

                 {/* 🟢 [保留] 原有功能模块占位 (未来取消注释即可) */}
                 {/* <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <RecentConnections />
                    <StarredServers />
                    <SponsorSection />
                 </div> 
                 */}

                 {/* 底部调试开关 */}
                 <div className="flex items-center justify-center gap-4 pt-10 opacity-30 hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => updateSettings({ showEmoji: !settings.showEmoji })}
                        className="text-[10px] uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        {settings.showEmoji ? t('dashboard.hideEmoji', 'Hide Emoji') : t('dashboard.showEmoji', 'Show Emoji')}
                    </button>

                 </div>
             </div>

         </div>
      </div>

      <DailyEmoji />
    </div>
  );
};