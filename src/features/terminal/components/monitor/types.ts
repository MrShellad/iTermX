// src/features/terminal/components/monitor/types.ts
import { ReactNode, ComponentType } from "react";
import { MonitorColorVariant } from "@/features/terminal/utils/monitorTheme";

/**
 * 所有业务卡片 (CpuCard, MemCard 等) 必须遵循的基础接口
 */
export interface BaseMonitorCardProps {
  id: string;
  data: any;           // 这里的 data 是完整的 sessionData 对象
  isExpanded: boolean;
  onToggle: (id: string) => void;
  icon?: ReactNode;
  color?: MonitorColorVariant;
}

/**
 * 用于 TerminalMonitor.tsx 中的配置描述符定义
 */
export interface MonitorDescriptor {
  id: string;
  Component: ComponentType<BaseMonitorCardProps>;
  icon: ReactNode;
  color: MonitorColorVariant;
}