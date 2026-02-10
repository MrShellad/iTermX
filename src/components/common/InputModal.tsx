import React, { useState, useEffect, useRef } from 'react';
import { File, Folder, X, Loader2 } from 'lucide-react'; // [新增] 引入 Loader2
import { clsx } from 'clsx';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title?: string;
  placeholder?: string;
  type?: 'file' | 'folder';
  defaultValue?: string;
  confirmLabel?: string;
  // [新增] 接收 loading 状态
  isLoading?: boolean;
}

export const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = "Create New",
  placeholder = "Enter name...",
  type = 'folder',
  defaultValue = "",
  confirmLabel = "Create",
  isLoading = false // [新增] 默认为 false
}) => {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError("");
      setTimeout(() => {
        // 如果正在加载，不要聚焦，防止用户误操作
        if (!isLoading) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
      }, 50);
    }
  }, [isOpen, defaultValue, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLoading) return; // [新增] 防止重复提交
    
    if (!value.trim()) {
      setError("Name cannot be empty");
      return;
    }
    onSubmit(value.trim());
    // 注意：这里不再调用 onClose()，而是等待父组件处理完 isLoading 后决定是否关闭
    // 或者由父组件在成功后手动设置 isOpen=false
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) { // [新增] 加载中禁止关闭
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="input-modal-overlay" aria-modal="true" role="dialog">
      <div className="input-modal-content">
        <button
          onClick={onClose}
          disabled={isLoading} // [新增] 加载中禁用关闭
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 data-[state=open]:text-slate-500 dark:ring-offset-slate-950 dark:focus:ring-slate-300 dark:data-[state=open]:bg-slate-800 dark:data-[state=open]:text-slate-400"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="input-modal-header">
          <div className="flex items-center gap-2">
            {type === 'folder' ? (
              <Folder className="h-5 w-5 text-blue-500" />
            ) : (
              <File className="h-5 w-5 text-slate-500" />
            )}
            <h2 className="input-modal-title">{title}</h2>
          </div>
        </div>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <input
              ref={inputRef}
              disabled={isLoading} // [新增] 加载中禁用输入
              className={clsx("input-modal-input", error && "border-red-500 focus-visible:ring-red-500")}
              placeholder={placeholder}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
                handleKeyDown(e);
              }}
            />
            {error && <span className="text-xs text-red-500 animate-pulse">{error}</span>}
          </div>
        </div>

        <div className="input-modal-footer">
          <button
            type="button"
            disabled={isLoading} // [新增] 加载中禁用取消
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium ring-offset-white transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
            onClick={onClose}
          >
            Cancel
          </button>
          
          {/* [修改] 提交按钮状态处理 */}
          <button
            type="button"
            disabled={isLoading} 
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-slate-50 ring-offset-white transition-colors hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
            onClick={() => handleSubmit()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wait...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};