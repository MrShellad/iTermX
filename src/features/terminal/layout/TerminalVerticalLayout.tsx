import { useState, useCallback, useEffect, useRef } from "react";
import { useTerminalStore } from "@/store/useTerminalStore";
import { clsx } from "clsx";

interface Props {
  top: React.ReactNode;    // 终端 Session
  bottom: React.ReactNode; // 文件管理器
  bottomContentTitle?: string; // 辅助用于无障碍或调试
}

const MIN_HEIGHT = 100;
const MAX_HEIGHT = 600;

export const TerminalVerticalLayout = ({ top, bottom }: Props) => {
  const { fileManagerHeight, setFileManagerHeight } = useTerminalStore();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [localHeight, setLocalHeight] = useState(fileManagerHeight);
  const [isResizing, setIsResizing] = useState(false);
  const animationFrameId = useRef<number | null>(null);

  // 同步 Store
  useEffect(() => {
    if (!isResizing) setLocalHeight(fileManagerHeight);
  }, [fileManagerHeight, isResizing]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setLocalHeight(fileManagerHeight);
    document.body.style.cursor = 'row-resize';
  }, [fileManagerHeight]);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    setFileManagerHeight(localHeight);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    document.body.style.cursor = '';
  }, [localHeight, setFileManagerHeight]);

  const resize = useCallback((e: MouseEvent) => {
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    animationFrameId.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      // 计算逻辑：容器底部 - 鼠标Y坐标 = 底部面板高度
      const newHeight = rect.bottom - e.clientY;

      if (newHeight >= MIN_HEIGHT && newHeight <= MAX_HEIGHT) {
        setLocalHeight(newHeight);
      }
    });
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <div ref={containerRef} className="flex flex-col w-full h-full relative overflow-hidden">
      
      {/* 1. 遮罩层 (解决 iframe 卡顿 + 全局事件捕获) */}
      {isResizing && (
        <div 
          className="fixed inset-0 z-[9999] cursor-row-resize bg-transparent select-none" 
          onMouseUp={stopResizing} 
        />
      )}

      {/* 2. 上半部分：终端 (Flex 1 自动填满剩余空间) */}
      <div 
        className={clsx(
          "flex-1 min-h-0 w-full relative",
          isResizing && "pointer-events-none select-none"
        )}
      >
        {top}
      </div>

      {/* 3. 拖拽手柄 */}
      <div
        className={clsx(
          "w-full cursor-row-resize z-20 flex-shrink-0 relative group transition-colors duration-200",
          "h-[1px] bg-slate-200 dark:bg-slate-800",
          isResizing ? "bg-blue-600 h-[2px]" : "hover:bg-blue-500/50"
        )}
        onMouseDown={startResizing}
      >
        {/* 增加点击区域 */}
        <div className="absolute inset-x-0 -top-2 -bottom-2 bg-transparent" />
      </div>

      {/* 4. 下半部分：文件管理 (固定高度) */}
      <div
        className={clsx(
          "w-full flex-shrink-0 bg-transparent relative", // 确保 relative 以便 z-index 生效
          isResizing && "pointer-events-none select-none"
        )}
        style={{ height: localHeight }}
      >
        {bottom}
      </div>
    </div>
  );
};