import { TERMINAL_THEMES } from "@/features/terminal/constants";

// 终端主题列表
export const builtinThemeOptions = Object.keys(TERMINAL_THEMES).map(key => ({
  label: key.charAt(0).toUpperCase() + key.slice(1), 
  value: key
}));

// 通用的模糊度选项 (供 select 备用，虽然我们现在用 slider，但保留预设是个好习惯)
export const blurOptions = [
    { label: 'None', value: 0 },
    { label: 'Low (5px)', value: 5 },
    { label: 'Medium (10px)', value: 10 },
    { label: 'High (20px)', value: 20 },
    { label: 'Ultra (40px)', value: 40 },
];

// 通用的亮度选项
export const brightnessOptions = [
    { label: '30% (Dark)', value: 0.3 },
    { label: '50%', value: 0.5 },
    { label: '70% (Default)', value: 0.7 },
    { label: '90%', value: 0.9 },
    { label: '100% (Original)', value: 1.0 },
];