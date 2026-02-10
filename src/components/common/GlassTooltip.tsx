import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import clsx from 'clsx';
import { ReactNode } from 'react';

interface GlassTooltipProps {
  children: ReactNode;
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export const GlassTooltip = ({ 
  children, 
  content, 
  side = 'right', 
  className 
}: GlassTooltipProps) => {
  return (
    <TooltipPrimitive.Provider 
      delayDuration={100} 
      // [修改 1] 设置为 0，让 Tooltip 离开时不需要等待“切换延迟”
      skipDelayDuration={0} 
      // [修改 2] 禁止鼠标悬停在 Tooltip 内容上。一旦离开触发器，立刻关闭。
      disableHoverableContent={true}
    >
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={10} 
            className={clsx(
              // [修改 3] pointer-events-none：让鼠标事件“穿透”Tooltip。
              // 即使 Tooltip 还在做消失动画，用户的点击也能直接作用于下方的按钮。
              "pointer-events-none",

              // 基础布局与动画 (稍微加快了 exit 动画: duration-200 -> duration-150)
              "z-[100] overflow-hidden rounded-md px-3 py-1.5 text-xs font-medium",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
              
              // 磨砂玻璃核心样式
              "bg-slate-900/70 text-slate-100 backdrop-blur-md border border-white/10 shadow-xl",
              
              className
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-white/10" width={11} height={5} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};