import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useDashboardStore } from "@/features/dashboard/store/useDashboardStore";
// 🟢 引入配置好的 EMOJI_CONFIG 和彩蛋 Emoji 池
import { EMOJI_CONFIG, BOUNCE_EMOJI_POOL } from "../../domain/emojiConfig";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next"; // 🟢 引入翻译 Hook

interface PhysicsData {
  id: string;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  size: number;
  scale: number; 
  opacity: number; 
  isExiting: boolean;
}

const BOUNCE_DURATION = 5000; 
const EXIT_START_TIME = 4000; 

export const DailyEmoji = () => {
  const { t } = useTranslation(); // 🟢 初始化翻译函数
  const showEmoji = useDashboardStore(state => state.settings.showEmoji);
  const updateSettings = useDashboardStore(state => state.updateSettings);
  const [currentEmoji, setCurrentEmoji] = useState(EMOJI_CONFIG[EMOJI_CONFIG.length - 1]);

  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [activeEmojis, setActiveEmojis] = useState<PhysicsData[]>([]);
  const physicsState = useRef<PhysicsData[]>([]);
  const domRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const requestRef = useRef<number | undefined>(undefined);

  // 基础逻辑：计算当前 Emoji
  useEffect(() => {
    const calcEmoji = () => {
      const now = new Date();
      const dateStr = format(now, "MM-dd");
      const timeStr = format(now, "HH:mm");

      const dateMatch = EMOJI_CONFIG.find(r => r.type === 'date' && r.value === dateStr);
      if (dateMatch) { setCurrentEmoji(dateMatch); return; }

      const timeMatch = EMOJI_CONFIG.find(r => {
        if (r.type !== 'time') return false;
        const [start, end] = r.value.split("-");
        return timeStr >= start && timeStr <= end;
      });
      if (timeMatch) { setCurrentEmoji(timeMatch); return; }

      setCurrentEmoji(EMOJI_CONFIG.find(r => r.type === 'default')!);
    };

    calcEmoji();
    const timer = setInterval(calcEmoji, 60000);
    return () => clearInterval(timer);
  }, []);

  // 物理引擎：保持高性能直接 DOM 操作
  const animate = useCallback(() => {
    const { innerWidth, innerHeight } = window;
    
    physicsState.current.forEach(item => {
        item.x += item.vx;
        item.y += item.vy;
        item.rotation += item.vr;

        const radius = item.size / 2;
        if (item.x < radius) { item.x = radius; item.vx = Math.abs(item.vx) * 0.9; }
        else if (item.x > innerWidth - radius) { item.x = innerWidth - radius; item.vx = -Math.abs(item.vx) * 0.9; }

        if (item.y < radius) { item.y = radius; item.vy = Math.abs(item.vy) * 0.9; }
        else if (item.y > innerHeight - radius) { item.y = innerHeight - radius; item.vy = -Math.abs(item.vy) * 0.9; }

        if (item.isExiting) {
            item.scale -= 0.02; 
            item.opacity -= 0.02;
            if (item.scale < 0) item.scale = 0;
        }

        const el = domRefs.current.get(item.id);
        if (el) {
            el.style.transform = `translate3d(${item.x - radius}px, ${item.y - radius}px, 0) rotate(${item.rotation}deg) scale(${item.scale})`;
            el.style.opacity = item.opacity.toString();
        }
    });

    requestRef.current = requestAnimationFrame(animate);
  }, []);

  const triggerBounceEffect = useCallback(() => {
    const count = 35;
    const { innerWidth, innerHeight } = window;
    const newEmojis: PhysicsData[] = [];

    for (let i = 0; i < count; i++) {
      newEmojis.push({
        id: Math.random().toString(36).substr(2, 9),
        // 🟢 使用配置中的 BOUNCE_EMOJI_POOL
        emoji: BOUNCE_EMOJI_POOL[Math.floor(Math.random() * BOUNCE_EMOJI_POOL.length)],
        x: innerWidth / 2,
        y: innerHeight / 2,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
        size: Math.random() * 20 + 40,
        scale: 1,
        opacity: 1,
        isExiting: false,
      });
    }

    physicsState.current = newEmojis;
    setActiveEmojis(newEmojis);

    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(animate);

    setTimeout(() => {
        physicsState.current.forEach(item => item.isExiting = true);
    }, EXIT_START_TIME);

    setTimeout(() => {
        setActiveEmojis([]);
        physicsState.current = [];
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }, BOUNCE_DURATION);

  }, [animate]);

  const handleEmojiClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.stopPropagation();

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    const newCount = clickCount + 1;
    
    if (newCount >= 7) {
      triggerBounceEffect();
      setClickCount(0);
    } else {
      setClickCount(newCount);
      clickTimerRef.current = setTimeout(() => setClickCount(0), 1000);
    }
  };

  if (!showEmoji) return null;

  return (
    <>
      <div className="absolute bottom-8 right-10 z-50 group">
        <TooltipProvider>
          <Tooltip>
              <TooltipTrigger asChild>
                  <div 
                    onClick={handleEmojiClick}
                    className="flex items-center justify-center text-6xl hover:scale-110 active:scale-90 transition-transform duration-300 cursor-help relative select-none drop-shadow-2xl filter hover:brightness-110"
                  >
                      {currentEmoji.emoji}
                      {clickCount > 0 && (
                        <span className="absolute -left-6 top-0 text-lg font-black text-blue-500 animate-pulse pointer-events-none select-none italic">
                          {clickCount}
                        </span>
                      )}
                      <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSettings({ showEmoji: false });
                          }}
                          className="absolute -top-2 -right-2 bg-slate-800/80 text-slate-400 hover:text-red-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-sm"
                      >
                          <X className="w-3 h-3" />
                      </button>
                  </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                {/* 🟢 使用 t() 配合 tooltipKey 实现本地化显示 */}
                <p>{t(currentEmoji.tooltipKey)}</p>
              </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {activeEmojis.length > 0 && createPortal(
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {activeEmojis.map(emoji => (
            <div
              key={emoji.id}
              ref={(el) => {
                if (el) domRefs.current.set(emoji.id, el);
                else domRefs.current.delete(emoji.id);
              }}
              className="absolute select-none will-change-transform"
              style={{
                left: 0,
                top: 0,
                fontSize: emoji.size,
                transform: `translate3d(${window.innerWidth/2}px, ${window.innerHeight/2}px, 0)`,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))'
              }}
            >
              {emoji.emoji}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};