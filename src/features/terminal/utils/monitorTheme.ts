
export type MonitorColorVariant = "blue" | "purple" | "green" | "orange";

export interface MonitorTheme {
  bg: string;
  text: string;
  stroke: string;
  gradientStart: string;
}

export const MONITOR_COLOR_MAP: Record<MonitorColorVariant, MonitorTheme> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    stroke: "#3b82f6",
    gradientStart: "#3b82f6",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    stroke: "#a855f7",
    gradientStart: "#a855f7",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    stroke: "#22c55e",
    gradientStart: "#22c55e",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    stroke: "#f97316",
    gradientStart: "#f97316",
  },
};

/**
 * 根据数值获取警告颜色
 */
export const getUsageColorClass = (val: number, defaultColorClass: string) => {
  if (val > 80) return "text-red-500";
  if (val > 50) return "text-yellow-500";
  return defaultColorClass;
};