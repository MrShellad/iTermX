import { Server } from "@/features/server/domain/types";
import { CardSize } from "../domain/types"; // 移除了 CARD_DIMENSIONS 的引用
import { ServerCard } from "./ServerCard";
import { ServerCardSkeleton } from "./ServerCardSkeleton"; 
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useTranslation } from "react-i18next";
interface Props {
  servers: Server[];
  cardSize: CardSize;
  actions: any;
  onEdit: (s: Server) => void;
  isLoading?: boolean;
  shouldAnimate?: boolean;
}

// 🟢 [优化] 定义更紧凑的卡片最小宽度
// sm: 220px (原可能为 280px+)
// md: 260px (原可能为 320px+)
// lg: 320px (原可能为 380px+)
const COMPACT_WIDTHS: Record<CardSize, string> = {
  sm: "220px", 
  md: "260px",
  lg: "320px"
};

export const ServerGrid = ({ 
  servers, 
  cardSize, 
  actions, 
  onEdit, 
  isLoading = false,
  shouldAnimate = true
}: Props) => {
  const { t } = useTranslation();
  const gridStyle = {
    // 🟢 [修改] 使用自定义的紧凑宽度
    gridTemplateColumns: `repeat(auto-fill, minmax(${COMPACT_WIDTHS[cardSize]}, 1fr))`
  } as React.CSSProperties;

  // 1. Loading 骨架屏
  if (isLoading && servers.length === 0) {
    return (
      <div className="grid gap-4 p-2 content-start" style={gridStyle}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ServerCardSkeleton key={`skeleton-${i}`} size={cardSize} />
        ))}
      </div>
    );
  }

  // 2. 动画配置
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldAnimate ? 0.05 : 0, 
        delayChildren: 0.02
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
  };

  return (
    <motion.div 
      className="grid gap-4 p-2 content-start"
      style={gridStyle}
      variants={containerVariants}
      initial={shouldAnimate ? "hidden" : "visible"}
      animate="visible"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {servers.map((server) => (
          <motion.div
            key={server.id}
            layout 
            variants={itemVariants}
            initial={shouldAnimate ? "hidden" : "visible"}
            animate="visible"
            exit="exit"
          >
            <ServerCard 
              data={server}
              size={cardSize}
              onConnect={() => actions.handleConnect(server)}
              onCopyIP={() => actions.handleCopyIP(server.ip)}
              onPin={() => actions.handlePin(server)}
              onDelete={() => actions.handleDelete(server.id)}
              onEdit={() => onEdit(server)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      
      {!isLoading && servers.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-muted rounded-xl bg-muted/20"
        >
           <p>{t('server.list.empty', 'No servers found matching your criteria.')}</p>
        </motion.div>
      )}
    </motion.div>
  );
};