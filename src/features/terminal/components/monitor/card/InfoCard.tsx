// src/features/terminal/components/monitor/card/InfoCard.tsx
import { useTranslation } from "react-i18next";
import { formatUptime } from "@/utils/format";
import { MonitorCard } from "../MonitorCard";
import { BaseMonitorCardProps } from "../types"; // [对齐] 引入统一类型

export const InfoCard = ({ id, data, isExpanded, onToggle, icon, color = "green" }: BaseMonitorCardProps) => {
  const { t } = useTranslation();
  
  // 提取 OS 专用字段
  const osData = data?.os;

  const items = osData ? [
    { label: t('monitor.info.timezone', 'Timezone'), val: osData.timezone },
    { label: t('monitor.info.kernel', 'Kernel'), val: osData.kernel },
    { label: t('monitor.info.arch', 'Arch'), val: osData.arch },
  ] : [];

  return (
    <MonitorCard
      id={id}
      title={t('monitor.info.title', 'System Info')}
      icon={icon}
      color={color}
      isExpanded={isExpanded}
      onToggle={onToggle}
      detail=<span className="text-[11px] text-slate-400">{osData?.distro || t('monitor.loading', 'Loading...')}</span>
      usage={0}
      usageDisplay={osData ? formatUptime(osData.uptime) : "-"}
      subTitle={t('monitor.info.uptime', 'Uptime')} 
    >
      {/* 展开后的详细列表 */}
      <div className="flex flex-col gap-2 animate-in fade-in duration-300">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-[11px] py-1.5 border-b border-slate-200/60 dark:border-white/5 last:border-0">
            <span className="text-slate-400 uppercase font-medium tracking-wider">
              {item.label}
            </span>
            <span className="text-slate-700 dark:text-slate-200 font-mono truncate max-w-[180px]" title={item.val}>
              {item.val}
            </span>
          </div>
        ))}
      </div>
    </MonitorCard>
  );
};