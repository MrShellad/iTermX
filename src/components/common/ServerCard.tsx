import { clsx } from "clsx";
import { Pin, Star, Server as ServerIcon } from "lucide-react";
import { ICON_MAP } from "@/features/server/domain/constants"; // [引用 1] 调用您上传的常量定义
import { ServerFormValues } from "@/features/server/form/domain/schema";

interface ServerCardProps {
  server: ServerFormValues;
  onClick: () => void;
  /** 右上角操作按钮的点击事件 (例如：取消收藏) */
  onAction?: (e: React.MouseEvent) => void;
  /** 右上角按钮的图标，默认为 Star */
  actionIcon?: React.ReactNode;
  /** 是否显示右上角操作按钮，默认为 true */
  showAction?: boolean;
  className?: string;
}

export const ServerCard = ({ 
  server, 
  onClick, 
  onAction, 
  actionIcon, 
  showAction = true,
  className 
}: ServerCardProps) => {
  // 1. 获取图标组件
  // 优先使用 ICON_MAP 中定义的图标，如果没有匹配则回退到 ServerIcon
  const IconComponent = (server.icon && ICON_MAP[server.icon]) 
    ? ICON_MAP[server.icon] 
    : ServerIcon;

  return (
    <div 
      onClick={onClick}
      className={clsx(
        "group relative flex-shrink-0 w-60 aspect-[4/3] rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-300",
        // 背景与边框：玻璃拟态风格
        "bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-white/10",
        // 悬停效果：边框变蓝，背景微亮
        "hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:bg-white/60 dark:hover:bg-slate-900/60",
        // 阴影效果
        "shadow-sm dark:shadow-xl hover:shadow-md dark:hover:shadow-2xl hover:scale-[1.02]",
        className
      )}
    >
      {/* 左上角：置顶标记 (仅当 isPinned 为真时显示) */}
      {server.is_pinned && (
        <div className="absolute top-3 left-3 text-slate-400 dark:text-slate-500 rotate-45">
          <Pin className="w-3 h-3 fill-current" />
        </div>
      )}

      {/* 中间：图标区域 (圆形背景) */}
      <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors
        bg-slate-100 dark:bg-gradient-to-br dark:from-slate-700 dark:to-slate-800 border border-slate-200 dark:border-white/5
        group-hover:bg-blue-50 dark:group-hover:from-blue-600 dark:group-hover:to-blue-500
      ">
        {/* 渲染动态图标 */}
        <IconComponent className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-white transition-colors" />
      </div>

      {/* 底部：文本信息 */}
      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">
          {server.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate opacity-70">
          {server.host}
        </p>
      </div>
      
      {/* 右上角：操作按钮 (默认显示，hover 时才出现) */}
      {showAction && onAction && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onAction(e);
          }}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/50 dark:hover:bg-black/20 rounded-full"
          title="Toggle favorite"
        >
          {actionIcon || <Star className="w-4 h-4 fill-amber-500 text-amber-500" />}
        </button>
      )}
    </div>
  );
};