import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // --- 基础布局与字体 (保持不变) ---
          "flex h-9 w-full rounded-md px-3 py-1 text-base md:text-sm shadow-sm transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",

          // --- [修改核心] 液态玻璃风格适配 ---
          
          // 1. 边框：改为半透明，模拟玻璃边缘
          // 原代码: border-input
          "border border-slate-200/50 dark:border-white/10",

          // 2. 背景：半透明 + 背景模糊 (Frosted Glass)
          // 原代码: bg-transparent
          "bg-white/50 dark:bg-slate-950/20 backdrop-blur-sm",

          // 3. 交互态：悬停或聚焦时，背景稍微变实，增加可读性
          "hover:bg-white/70 dark:hover:bg-slate-950/30",
          "focus-visible:bg-white/80 dark:focus-visible:bg-slate-950/50",

          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }