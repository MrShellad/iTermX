// src/features/terminal/components/monitor/MonitorFace.tsx
import { Activity } from "lucide-react";
import { clsx } from "clsx";
import { MonitorTheme, getUsageColorClass } from "@/features/terminal/utils/monitorTheme";

export const MonitorFaceShell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={clsx(
    "h-full w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-sm flex flex-col overflow-hidden",
    className
  )}>
    {children}
  </div>
);

interface InfoFaceProps {
  title: string;
  icon?: React.ReactNode;
  usage: number;
  usageDisplay?: React.ReactNode; 
  tag?: string;
  detail?: React.ReactNode; 
  theme: MonitorTheme;
  subTitle: string; 
  subTitleClassName?: string;
  orientation?: 'horizontal' | 'vertical'; 
}

export const MonitorInfoFace = ({
  title,
  icon,
  usage,
  usageDisplay,
  tag,
  detail,
  theme,
  subTitle,
  subTitleClassName,
  orientation = 'horizontal',
}: InfoFaceProps) => {
  const usageColor = getUsageColorClass(usage, theme.text);

  // === 模式 A: 垂直模式 (侧边栏) ===
  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center py-4">
        <div className="p-3 rounded-xl shrink-0 bg-slate-100/80 dark:bg-white/10 backdrop-blur-sm mb-4 shadow-sm">
          {icon}
        </div>

        <div className="flex flex-col items-center gap-1 text-center w-full">
            {/* 🟢 优化：使用 medium 字重配合字间距，呈现原生精致感 */}
            <span className={clsx(
                "uppercase tracking-[0.05em] font-medium", 
                subTitleClassName || "text-[10px] text-slate-500 dark:text-slate-400"
            )}>
              {subTitle}
            </span>
            {/* 🟢 优化：数值使用 semibold 配合紧凑字间距 */}
            <div className={clsx(
                "text-xl font-semibold tracking-tight leading-tight",
                usageColor
            )}>
              {usageDisplay || `${(usage || 0).toFixed(1)}%`}
            </div>
        </div>
      </div>
    );
  }

  // === 模式 B: 水平模式 (标准卡片) ===
  return (
    <div className="flex flex-col min-h-[7rem] w-full p-4 justify-between relative">
      {/* Header Area */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2.5 rounded-xl shrink-0 bg-slate-100/80 dark:bg-white/10 backdrop-blur-sm">
            {icon}
          </div>
          <div className="flex-1 min-w-0 flex flex-col pt-0.5">
            <div className="flex items-center gap-2">
               {/* 🟢 优化：主标题 13px + semibold */}
               <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                  {title}
               </p>
               {tag && (
                  <span className="text-[10px] font-semibold bg-slate-200/50 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                    {tag}
                  </span>
               )}
            </div>
            {/* 🟢 优化：详情描述使用 medium 字重 */}
            <div className="text-[11px] leading-snug mt-1.5 font-medium text-slate-700/80 dark:text-slate-200/80 truncate">
              {detail}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Area */}
      <div className="flex items-end justify-between min-h-0">
        <div className="flex flex-col pl-0.5">
          {/* 🟢 优化：副标题使用 medium 解决字体糊在一起的问题 */}
          <span className={clsx(
              "uppercase tracking-[0.05em] mb-1 font-medium", 
              subTitleClassName || "text-[10px] text-slate-500 dark:text-slate-400"
          )}>
            {subTitle}
          </span>
          {/* 🟢 优化：大数值使用 2xl + semibold + tracking-tighter */}
          <div className={clsx(
              "text-lg font-semibold tracking-tighter leading-none",
              usageColor
          )}>
            {usageDisplay || `${(usage || 0).toFixed(1)}%`}
          </div>
        </div>
        <Activity className="w-4 h-4 text-slate-400 dark:text-slate-600 mb-1 opacity-40 shrink-0" />
      </div>
    </div>
  );
};