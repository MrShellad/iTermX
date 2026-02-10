import { 
  MoreHorizontal, 
  LucideIcon 
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

// 定义菜单项的类型
export type ActionMenuItem = {
  type?: 'item';        // 默认为 item
  label: string;
  icon?: LucideIcon;    // 可选图标
  onClick?: () => void; // 点击回调
  danger?: boolean;     // 是否是危险操作（红色）
  disabled?: boolean;
} | {
  type: 'separator';    // 分割线类型
};

interface ActionMenuProps {
  items: ActionMenuItem[];
  triggerIcon?: React.ReactNode; // 允许自定义触发按钮图标
  align?: 'start' | 'end' | 'center';
  className?: string; // 允许外部微调 Trigger 的位置
}

export const ActionMenu = ({ 
  items, 
  triggerIcon, 
  align = 'end',
  className
}: ActionMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className={clsx(
          "flex items-center justify-center p-1 rounded-md transition-colors outline-none",
          "hover:bg-slate-100 dark:hover:bg-white/10",
          "data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-white/10",
          "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
          className
        )}
      >
        {triggerIcon || <MoreHorizontal className="w-5 h-5" />}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align={align}
        className={clsx(
          "w-36 shadow-xl p-1",
          // 统一的亮/暗色样式配置
          "bg-white border-slate-200 text-slate-700",
          "dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300"
        )}
      >
        {items.map((item, index) => {
          // 1. 渲染分割线
          if (item.type === 'separator') {
            return (
              <DropdownMenuSeparator 
                key={index} 
                className="bg-slate-100 dark:bg-slate-800 my-1" 
              />
            );
          }

          // 2. 渲染普通菜单项
          return (
            <DropdownMenuItem
              key={index}
              onClick={(e) => {
                e.stopPropagation(); // 防止冒泡触发卡片点击
                item.onClick?.();
              }}
              disabled={item.disabled}
              className={clsx(
                "cursor-pointer flex items-center px-2 py-1.5 rounded-sm text-sm outline-none transition-colors",
                // 危险操作 vs 普通操作
                item.danger 
                  ? "text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20" 
                  : "focus:bg-slate-50 dark:focus:bg-white/10 dark:focus:text-slate-100"
              )}
            >
              {item.icon && (
                <item.icon className={clsx(
                  "w-4 h-4 mr-2",
                  item.danger ? "opacity-100" : "opacity-70"
                )} />
              )}
              <span>{item.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};