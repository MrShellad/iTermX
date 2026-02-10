import { useState, useEffect, useRef } from "react";
import { KeyRound, Loader2, X } from "lucide-react"; // 引入 X 图标
import { useTranslation } from "react-i18next";
import { clsx } from "clsx"; // 假设你有 clsx，如果没有可以直接用字符串拼接

interface PasswordModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  onSubmit: (password: string) => Promise<void> | void;
  // 🟢 [新增] 关闭回调，解决 TS 报错
  onClose: () => void; 
  isLoading?: boolean;
}

export const PasswordModal = ({ 
  isOpen, 
  title, 
  description, 
  onSubmit, 
  onClose, // 🟢 解构 onClose
  isLoading = false 
}: PasswordModalProps) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  // 🟢 [新增] 输入框 Ref，用于手动聚焦
  const inputRef = useRef<HTMLInputElement>(null);

  // 状态重置与自动聚焦
  useEffect(() => {
    if (isOpen) {
      setPassword("");
      // 🟢 [优化] 延迟聚焦，确保 DOM 渲染完成后再执行 focus，比 autoFocus 更可靠
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 监听 ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      await onSubmit(password);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
        
        {/* 🟢 [新增] 右上角关闭按钮 */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title || t('common.authRequired', 'Authentication Required')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {description || t('common.authDesc', 'Please enter your password to reconnect.')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef} // 🟢 绑定 Ref
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('common.password', 'Password')}
              className={clsx(
                "w-full bg-slate-50 dark:bg-slate-950 border rounded-lg px-4 py-3 text-sm transition-all outline-none",
                "border-slate-200 dark:border-slate-800",
                "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              )}
            />
          </div>

          <div className="flex gap-3">
            {/* 🟢 [新增] 取消按钮 */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={!password || isLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.confirm', 'Confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};