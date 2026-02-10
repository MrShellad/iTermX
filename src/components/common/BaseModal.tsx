import { useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { clsx } from "clsx";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode; 
  className?: string;
  zIndex?: number;
}

export const BaseModal = ({ 
  isOpen, 
  onClose, 
  title, 
  icon, 
  children, 
  footer, 
  className,
  zIndex = 100
}: BaseModalProps) => {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }} 
    >
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      <div 
        className={clsx(
          // 父容器保持 rounded-xl
          "relative w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]",
          className || "max-w-2xl"
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* === Header === */}
        {/* 🟢 [修复] 添加 rounded-t-xl 以防止毛玻璃溢出覆盖圆角 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shrink-0 backdrop-blur-sm rounded-t-xl">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                {icon}
              </div>
            )}
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg tracking-tight">
              {title}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* === Content === */}
        {/* 如果没有 footer，内容区域底部也可能需要圆角，但通常 footer 存在时不需要 */}
        <div className={clsx(
            "flex-1 min-h-0 p-4 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50",
            // 如果没有 footer，内容区域底部需要圆角
            !footer && "rounded-b-xl"
        )}>
          {children}
        </div>

        {/* === Footer === */}
        {/* 🟢 [修复] 添加 rounded-b-xl 以防止毛玻璃溢出覆盖圆角 */}
        {footer && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shrink-0 backdrop-blur-sm flex justify-end gap-2 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};