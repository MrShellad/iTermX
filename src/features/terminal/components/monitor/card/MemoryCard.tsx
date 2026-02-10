// src/features/terminal/components/monitor/card/MemoryCard.tsx
import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatBytes } from "@/utils/format";
import { MonitorCard } from "../MonitorCard";
import { BaseMonitorCardProps } from "../types"; 
import { clsx } from "clsx";

/**
 * 通用的内存详情项组件
 */
const MemDetailItem = ({ 
  label, 
  value, // 这里可以是字符串（如 "0.1G / 4G"）或数字
  colorClass 
}: { 
  label: string; 
  value: React.ReactNode; 
  colorClass?: string 
}) => (
  <div className="flex justify-between items-center bg-slate-100/50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5 shadow-sm">
    <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-medium tracking-wider">
      {label}
    </span>
    <span className={clsx("text-[11px]", colorClass || "text-slate-700 dark:text-slate-200")}>
      {value}
    </span>
  </div>
);

export const MemoryCard = ({ id, data, isExpanded, onToggle, icon, color = "purple" }: BaseMonitorCardProps) => {
  const { t } = useTranslation();
  const memData = data?.mem; // 从全量 sessionData 中提取内存数据

  return (
    <MonitorCard
      id={id}
      title={t('monitor.mem.title', 'Memory')}
      icon={icon || <Zap className="w-5 h-5" />}
      color={color}
      usage={memData?.usage || 0}
      detail={
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {memData ? `${formatBytes(memData.used)} / ${formatBytes(memData.total)}` : "..."}
        </span>
      }
      isExpanded={isExpanded}
      onToggle={onToggle}
      subTitle={t('monitor.usage', 'Usage')}
    >
      <div className="flex flex-col gap-3 animate-in fade-in duration-300">
        {/* 1. Swap 使用情况：整合已用与总计 */}
        <MemDetailItem 
          label={t('monitor.mem.swaput', 'Swap (Used/Total)')}
          value={
            memData 
              ? `${formatBytes(memData.swapUsed)} / ${formatBytes(memData.swapTotal)}` 
              : '-'
          } 
          colorClass="text-blue-600 dark:text-blue-400" 
        />
        
        {/* 2. 缓存与缓冲区：并排显示 */}
        <div className="grid grid-cols-2 gap-3">
          <MemDetailItem 
            label={t('monitor.mem.cache', 'Cache')}
            value={memData ? formatBytes(memData.cached) : '0 B'} 
          />
          <MemDetailItem 
            label={t('monitor.mem.buffers', 'Buffers')} 
            value={memData ? formatBytes(memData.buffers) : '0 B'} 
          />
        </div>

        {/* 3. Free (纯粹空闲) 内存 */}
        <MemDetailItem 
          label={t('monitor.mem.free', 'Free (Unused)')} 
          value={memData ? formatBytes(memData.free) : '0 B'} 
          colorClass="text-emerald-600 dark:text-emerald-400" 
        />

        {/* 4. 可用性说明提示 */}
        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic px-1 mt-1">
          * {t('monitor.mem.available_hint', 'Available memory includes cache and buffers.')}
        </p>
      </div>
    </MonitorCard>
  );
};