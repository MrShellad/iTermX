import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle, AppWindow } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  variant?: 'default' | 'destructive';
  children?: ReactNode;
  icon?: ReactNode; // 允许传入自定义图标
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  cancelText = "取消",
  confirmText = "确认",
  onConfirm,
  isLoading = false,
  variant = 'default',
  children,
  icon
}: ConfirmDialogProps) => {

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    await onConfirm();
  };

  // 根据 variant 决定默认图标
  const DefaultIcon = variant === 'destructive' ? AlertTriangle : AppWindow;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn(
        // [macOS 风格核心容器]
        "p-0 gap-0",
        "w-[320px] sm:w-[360px]", // 典型的 macOS 弹窗宽度
        "rounded-[16px]", // macOS 窗口圆角
        // 背景：深色半透明 + 高斯模糊 + 饱和度提升 (Glassmorphism)
        "bg-white/90 dark:bg-[#282828]/85 backdrop-blur-xl backdrop-saturate-150",
        // 边框：非常细微的内发光/边框效果
        "border border-black/5 dark:border-white/10",
        // 阴影：深邃的窗口阴影
        "shadow-2xl",
        "overflow-hidden"
      )}>
        
        {/* 内容区域 */}
        <div className="flex flex-col items-center justify-center p-6 pt-8 text-center">
          
          {/* [macOS 风格图标] */}
          <div className="mb-4 shadow-lg rounded-[14px] overflow-hidden">
             {icon ? icon : (
                <div className={cn(
                  "w-14 h-14 flex items-center justify-center bg-gradient-to-br",
                  variant === 'destructive' 
                    ? "from-orange-400 to-yellow-500 text-white" // 警告风格
                    : "from-blue-500 to-cyan-500 text-white" // 默认 Finder/App 风格
                )}>
                  <DefaultIcon className="w-8 h-8 drop-shadow-md" strokeWidth={2.5} />
                </div>
             )}
          </div>

          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-center text-[15px] font-bold leading-tight text-black dark:text-white/95">
              {title}
            </AlertDialogTitle>
            {description && (
              <AlertDialogDescription className="text-center text-[13px] text-zinc-500 dark:text-zinc-300 leading-normal">
                {description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>

          {children && (
            <div className="py-2 text-[13px] w-full">
              {children}
            </div>
          )}
        </div>

        {/* [macOS 风格按钮组] */}
        <AlertDialogFooter className={cn(
          "p-4 pt-0 sm:justify-center sm:space-x-3", // 底部 padding
          "flex flex-row gap-3" // 按钮之间有间距
        )}>
          
          {/* 取消按钮：通常是深灰色背景 */}
          <AlertDialogCancel 
            disabled={isLoading} 
            className={cn(
              "flex-1 h-9 rounded-[6px] border-0 shadow-sm", // 高度较小，圆角适中
              "bg-zinc-200 hover:bg-zinc-300 text-zinc-900", // 亮色模式
              "dark:bg-[#454545] dark:hover:bg-[#555555] dark:text-white", // 暗色模式：深灰背景
              "text-[13px] font-medium mt-0 transition-all active:scale-[0.98]"
            )}
          >
            {cancelText}
          </AlertDialogCancel>
          
          {/* 确认按钮：实体色 */}
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 h-9 rounded-[6px] border-0 shadow-sm",
              "text-[13px] font-medium text-white transition-all active:scale-[0.98]",
              variant === 'destructive' 
                ? "bg-red-500 hover:bg-red-600 dark:bg-[#FF453A] dark:hover:bg-[#FF5F55]" // 红色警告
                : "bg-blue-500 hover:bg-blue-600 dark:bg-[#007AFF] dark:hover:bg-[#208BFF]" // 蓝色默认
            )}
          >
            {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};