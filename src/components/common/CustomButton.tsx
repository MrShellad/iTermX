import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CustomButtonProps extends ButtonProps {
  /**
   * 加载状态
   * - true: 显示 loading 图标，禁用点击
   */
  isLoading?: boolean;

  /**
   * 快捷键提示 (例如: "⌘S")
   * 仅在非 loading 状态下显示
   */
  shortcut?: string;

  /**
   * 左侧图标组件 (LucideIcon)
   * 加载时会被 Spinner 替换。
   * 如果需要特定颜色的图标，请不传此 prop，而是将图标作为 children 传入。
   */
  icon?: React.ElementType;
}

export const CustomButton = forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({
    children,
    className,
    variant,
    size,
    isLoading = false,
    shortcut,
    disabled,
    icon: Icon,
    ...props
  }, ref) => {

    // 判断是否为纯图标按钮 (无文字)
    const isIconOnly = size === "icon";

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        disabled={disabled || isLoading}
        className={cn(
          // 🟢 [修改] 强制使用 flex 布局居中，并统一间距，解决对齐问题
          "inline-flex items-center justify-center gap-2",
          "relative transition-all active:scale-[0.98]",
          className
        )}
        {...props}
      >
        {/* Loading 状态 */}
        {isLoading && (
          <Loader2
            className={cn(
                "animate-spin",
                // 🟢 [修改] 不再需要 margin，由父级 gap 控制
                isIconOnly ? "h-4 w-4" : "h-4 w-4"
            )}
          />
        )}

        {/* 正常状态下的图标 (加载时隐藏) */}
        {!isLoading && Icon && (
          <Icon
            className={cn(
                // 🟢 [修改] 不再需要 margin，由父级 gap 控制
                isIconOnly ? "h-4 w-4" : "h-4 w-4"
            )}
          />
        )}

        {/* 按钮文本 */}
        {!isIconOnly ? (
            isLoading ? (
                // Loading 时文字变淡
                <span className="opacity-80">{children}</span>
            ) : (
                // 🟢 [修改] 正常时直接渲染 children，不包裹 span，保证 flex 布局生效
                children
            )
        ) : (
            // 对于 icon-only 按钮，加载时隐藏 children
            !isLoading && children
        )}

        {/* 快捷键提示 (右侧) */}
        {shortcut && !isLoading && !isIconOnly && (
          // 🟢 [修改] 使用 ml-auto 将快捷键推到最右侧
          <kbd className={cn(
            "pointer-events-none ml-auto pl-1 inline-flex h-5 select-none items-center gap-1 font-mono text-[10px] font-medium opacity-100",
            (variant === 'default' || variant === 'destructive')
                ? "text-white/70"
                : "text-slate-400"
          )}>
            {shortcut}
          </kbd>
        )}
      </Button>
    );
  }
);

CustomButton.displayName = "CustomButton";