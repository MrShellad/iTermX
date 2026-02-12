import { useEffect, useState } from "react";
import { format } from "date-fns";
// 🟢 [新增] 引入中文语言包
import { zhCN } from "date-fns/locale";
// 🟢 [新增] 引入本地 Logo
import Logo from "@/assets/logo.png";
import { cn } from "@/lib/utils"; // 假设你有这个工具函数，如果没有可以直接写在 className 里

export const DashboardHeader = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full flex items-center justify-center py-4">
      
      {/* 🟢 [修改] 磨砂玻璃卡片容器 */}
      <div className={cn(
          "flex flex-row items-center gap-6 md:gap-10 px-8 py-3 rounded-2xl transition-all",
          "bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl", // 核心磨砂效果
          "border border-white/40 dark:border-white/10",      // 细腻的边框
          "shadow-lg shadow-slate-200/20 dark:shadow-black/20" // 柔和的阴影
      )}>
        
        {/* Logo 部分 */}
        <div className="flex items-center gap-3">
            {/* 🟢 [修改] 替换为图片 Logo */}
            <div className="w-16 h-16 flex items-center justify-center">
                <img 
                    src={Logo} 
                    alt="PiTerm Logo" 
                    className="w-full h-full object-contain drop-shadow-sm" 
                />
            </div>
            
            <div className="text-left">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight">
                    PiTerm
                </h1>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
                    Terminal
                </p>
            </div>
        </div>

        {/* 竖线分隔符 */}
        <div className="hidden md:block w-px h-8 bg-slate-300/50 dark:bg-white/10" />

        {/* 时间部分 */}
        <div className="flex flex-col md:flex-row items-baseline md:gap-3">
            <div className="text-3xl md:text-4xl font-light text-slate-800 dark:text-white tabular-nums tracking-tighter leading-none">
                {format(time, "HH:mm")}
            </div>
            
            {/* 🟢 [修改] 日期本地化 & 样式微调 */}
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {format(time, "EEE, MM月dd日", { locale: zhCN })}
            </div>
        </div>

      </div>
    </div>
  );
};