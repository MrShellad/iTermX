import { SettingsSidebar } from "./components/SettingsSidebar";
import { SettingsContent } from "./components/SettingsContent";

export const SettingsPage = () => {
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* 🟢 [修改说明] 
         删除了 "bg-slate-50 dark:bg-slate-950" 
         现在这个容器是透明的，Sidebar 和 Content 的半透明背景
         就能直接叠加在 MainLayout 的全局壁纸上了。
      */}
      <SettingsSidebar />
      <SettingsContent />
    </div>
  );
};