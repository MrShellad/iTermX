import React, { useEffect, useRef, useState } from 'react'; // 🟢 引入 useState
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';

export interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  onClose: () => void;
  items: ContextMenuItem[];
  theme?: {
    background: string;
    foreground: string;
    cursor?: string;
    selection?: string; // 🟢 1. 新增：接收高亮背景色
  };
}

export const ContextMenu = ({ x, y, visible, onClose, items, theme }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  // 🟢 2. 新增：记录当前悬停的菜单项索引，以便应用动态样式
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 点击外部关闭逻辑
  useEffect(() => {
    if (!visible) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);

  // 每次菜单显示时重置悬停状态
  useEffect(() => {
    if (visible) setHoveredIndex(null);
  }, [visible]);

  if (!visible) return null;

  const bgColor = theme?.background || '#1e1e1e';
  const textColor = theme?.foreground || '#e5e7eb';
  // 获取高亮色，如果没有传则使用默认的半透明白
  const selectionColor = theme?.selection || 'rgba(255, 255, 255, 0.1)';

  return createPortal(
    <div
      ref={menuRef}
      className="fixed min-w-[180px] overflow-hidden rounded-lg shadow-2xl flex flex-col z-[99999] backdrop-blur-sm"
      style={{
        top: y,
        left: x,
        backgroundColor: bgColor, 
        color: textColor,
        border: '1px solid rgba(128, 128, 128, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="py-1">
        {items.map((item, index) => (
          <button
            key={index}
            disabled={item.disabled}
            onClick={(e) => {
              e.stopPropagation();
              item.onClick();
              onClose();
            }}
            // 🟢 3. 监听鼠标进出，控制高亮状态
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={clsx(
              "group flex w-full items-center justify-between px-3 py-1.5 text-sm transition-colors duration-75", // 加快一点过渡
              item.disabled 
                ? "opacity-40 cursor-not-allowed" 
                : "cursor-pointer",
              item.danger && !item.disabled && "text-red-400"
            )}
            // 🟢 4. 动态样式：如果未禁用且被悬停，则应用 theme.selection 颜色
            style={{
                backgroundColor: (!item.disabled && hoveredIndex === index) ? selectionColor : 'transparent'
            }}
          >
            <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-4 h-4 opacity-70">
                  {item.icon}
                </span>
                <span className="font-medium text-[13px]">{item.label}</span>
            </div>

            {item.shortcut && (
                <span className="ml-6 text-[10px] opacity-40 font-mono tracking-wide">
                    {item.shortcut}
                </span>
            )}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
};