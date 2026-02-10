// src/features/terminal/components/monitor/card/CpuCard.tsx
import { useTranslation } from "react-i18next";
import { MonitorCard } from "../MonitorCard";
import { MonitorChart } from "../MonitorChart";
import { MONITOR_COLOR_MAP } from "@/features/terminal/utils/monitorTheme";
import { BaseMonitorCardProps } from "../types";
import { clsx } from "clsx";
import { Cpu } from "lucide-react";

// 通用详情项组件 - 采用桌面端精致字重
const CpuDetailItem = ({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) => (
  <div className="flex justify-between items-center bg-slate-100/50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5 shadow-sm">
    <span className="text-[10px] uppercase font-medium text-slate-500 dark:text-slate-400 tracking-widest">{label}</span>
    <span className={clsx("text-[11px] tabular-nums", colorClass || "text-slate-700 dark:text-slate-200")}>
      {value}
    </span>
  </div>
);

export const CpuCard = ({ id, data, isExpanded, onToggle, icon, color = "blue" }: BaseMonitorCardProps) => {
  const { t } = useTranslation();
  const cpuData = data?.cpu;
  const history = data?.history || [];

  return (
    <MonitorCard
      id={id}
      title={t('monitor.cpu.title', 'CPU')}
      icon={icon}
      color={color}
      usage={cpuData?.usage || 0}
      // 🟢 详情头部：数值与单位分离，确保数字始终可见
      detail={
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-tight">
          <div className="flex items-baseline gap-1">
            <span className="text-slate-600 dark:text-slate-200">
              {cpuData?.physicalCores || '-'}
            </span>
            <span className="text-slate-400">
              {t('monitor.cpu.cores_label', 'P-Cores')}
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700 font-light">|</span>
          <div className="flex items-baseline gap-1">
            <span className="text-slate-600 dark:text-slate-200">
              {cpuData?.logicalThreads || '-'}
            </span>
            <span className="text-slate-400">
              {t('monitor.cpu.threads_label', 'Threads')}
            </span>
          </div>
        </div>
      }
      isExpanded={isExpanded}
      onToggle={onToggle}
      subTitle={t('monitor.usage', 'Usage')}
    >
      <div className="flex flex-col gap-4 animate-in fade-in duration-300">
        
        {/* 处理器名称 */}
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 shadow-sm">
           <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-widest px-0.5">
             {t('monitor.cpu.model', 'Processor Model')}
           </span>
           <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Cpu className="w-4 h-4" />
             </div>
             <span className="text-[12px] text-slate-700 dark:text-slate-200 leading-tight">
               {cpuData?.model || t('monitor.loading', 'Loading...')}
             </span>
           </div>
        </div>

        {/* 负载统计 */}
        <div className="grid grid-cols-3 gap-2">
          <CpuDetailItem label={t('monitor.cpu.load_1m', 'Load 1m')} value={cpuData?.loadAvg?.[0].toFixed(2) || '0.00'} />
          <CpuDetailItem label={t('monitor.cpu.load_5m', 'Load 5m')} value={cpuData?.loadAvg?.[1].toFixed(2) || '0.00'} />
          <CpuDetailItem label={t('monitor.cpu.load_15m', 'Load 15m')} value={cpuData?.loadAvg?.[2].toFixed(2) || '0.00'} />
        </div>

        {/* 占用细分 */}
        <div className="grid grid-cols-2 gap-2">
          <CpuDetailItem label={t('monitor.cpu.user', 'User')} value={`${cpuData?.breakdown?.user.toFixed(1)}%`} colorClass="text-blue-500" />
          <CpuDetailItem label={t('monitor.cpu.system', 'System')} value={`${cpuData?.breakdown?.system.toFixed(1)}%`} colorClass="text-emerald-500" />
          <CpuDetailItem label={t('monitor.cpu.iowait', 'IO Wait')} value={`${cpuData?.breakdown?.iowait.toFixed(1)}%`} colorClass="text-amber-500" />
          <CpuDetailItem label={t('monitor.cpu.idle', 'Idle')} value={`${cpuData?.breakdown?.idle.toFixed(1)}%`} colorClass="text-slate-400" />
        </div>

        {/* 🟢 单核 Minibars：显式指定 u 和 i 的类型以修复报错 */}
        {cpuData?.perCoreUsage && cpuData.perCoreUsage.length > 0 && (
          <div className="flex flex-col gap-2 p-3 bg-slate-100/30 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/5">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-widest">
                {t('monitor.cpu.per_core', 'Per Core Activity')}
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-x-3 gap-y-2">
              {cpuData.perCoreUsage.map((u: number, i: number) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500 ease-out" 
                      style={{ width: `${u}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 text-center tabular-nums">{i}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-28 w-full">
          <MonitorChart 
              data={history} 
              theme={MONITOR_COLOR_MAP[color]} 
              colorId={`${id}-chart`} 
          />
        </div>
      </div>
    </MonitorCard>
  );
};