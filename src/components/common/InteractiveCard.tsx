import React from "react";
import { cn } from "@/lib/utils";

// --- 1. Root Container ---
interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  isActive?: boolean;
  isPinned?: boolean;
}

export const InteractiveCard = React.forwardRef<HTMLDivElement, InteractiveCardProps>(
  ({ className, isActive, isPinned, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "i-card",
          isActive && "is-active",
          isPinned && "is-pinned",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InteractiveCard.displayName = "InteractiveCard";

// --- 2. Header Components ---
export const InteractiveCardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("i-card-header", className)} {...props}>
    {children}
  </div>
);

export const InteractiveCardIcon = ({ className, children, style, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("i-icon", className)} style={style} {...props}>
    {children}
  </div>
);

// --- 3. Body Components ---
// 一个简单的 Flex 容器，用于放置 Badge 等内容
export const InteractiveCardBody = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={cn(
      // [优化] 移除 py-1，减小 gap (2->1)，减小 mb (2->1) 以实现紧凑布局
      "flex-1 flex flex-col justify-start gap-1 min-h-0 mb-1", 
      className
    )} 
    {...props}
  >
    {children}
  </div>
);

interface InteractiveCardBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  isHighlighted?: boolean;
}

export const InteractiveCardBadge = ({ className, isHighlighted, children, ...props }: InteractiveCardBadgeProps) => (
  <div className={cn("i-badge", isHighlighted && "is-highlighted", className)} {...props}>
    {children}
  </div>
);

// --- 4. Footer Components ---
export const InteractiveCardFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("i-card-footer", className)} {...props}>
    {children}
  </div>
);

export const InteractiveCardTagsWrapper = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("i-tags-wrapper", className)} {...props}>
    {children}
  </div>
);

export const InteractiveCardTag = ({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("i-tag", className)} {...props}>
    {children}
  </span>
);

export const InteractiveCardButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button 
      ref={ref} 
      // [优化] 类名改为 i-btn-connect，对应新的透明/变色按钮样式
      className={cn("i-btn-connect", className)} 
      {...props}
    >
      {children}
    </button>
  )
);
InteractiveCardButton.displayName = "InteractiveCardButton";