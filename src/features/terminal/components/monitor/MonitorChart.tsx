// src/features/terminal/components/monitor/MonitorChart.tsx
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { MonitorTheme } from "@/features/terminal/utils/monitorTheme";

interface MonitorChartProps {
  data: { time: number; usage: number }[];
  theme: MonitorTheme;
  colorId: string;
  // [新增] 支持自定义 Y 轴范围，默认 0-100 (百分比)
  domain?: [number, number | 'auto']; 
}

export const MonitorChart = ({ data, theme, colorId, domain = [0, 100] }: MonitorChartProps) => {
  return (
    // 使用 h-full 确保在 MonitorCard 展开区域内自动拉伸
    <div className="w-full h-full -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${colorId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.gradientStart || theme.stroke} stopOpacity={0.4} />
              <stop offset="100%" stopColor={theme.gradientStart || theme.stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <YAxis domain={domain} hide />
          
          <Area
            type="monotone"
            dataKey="usage"
            stroke={theme.stroke}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#grad-${colorId})`}
            isAnimationActive={false} // 实时数据建议关闭动画以提升性能
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};