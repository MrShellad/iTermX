import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

interface ExpandableCardProps {
  id: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ExpandableCard = ({
  id,
  isExpanded,
  onToggle,
  header,
  children,
  className,
}: ExpandableCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // 当展开时，滚动到容器顶部
  useEffect(() => {
    if (isExpanded && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [isExpanded]);

  return (
    <motion.div
      ref={cardRef}
      layout // [关键] 开启自动布局动画
      initial={false}
      className={clsx(
        "relative rounded-xl transition-all duration-300 overflow-hidden",
        "border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 backdrop-blur-md",
        isExpanded ? "z-10 shadow-2xl ring-2 ring-blue-500/20" : "z-0 shadow-sm",
        className
      )}
    >
      {/* 头部区域：保持原有信息不变 */}
      <div 
        className="cursor-pointer select-none"
        onClick={() => onToggle(id)}
      >
        {header}
      </div>

      {/* 展开区域 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20"
          >
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};