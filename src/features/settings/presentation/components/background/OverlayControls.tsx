import { memo } from "react";
import { Palette } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { DebouncedSlider } from "./DebouncedSlider";

const PRESET_COLORS = ['#000000', '#ffffff', '#0f172a', '#1e293b'];

interface Props {
  color: string;
  opacity: number;
  onColorChange: (val: string) => void;
  onOpacityChange: (val: number) => void;
}

export const OverlayControls = memo(({ color, opacity, onColorChange, onOpacityChange }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <Palette className="w-3 h-3" />
          {t('settings.appearance.overlay', 'Overlay Color')}
        </span>
        <div className="flex items-center gap-2">
          {/* 预设颜色 */}
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              className={clsx(
                "w-4 h-4 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm transition-transform hover:scale-110",
                color === c && "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900"
              )}
              style={{ backgroundColor: c }}
              onClick={() => onColorChange(c)}
            />
          ))}
          {/* 颜色选择器 */}
          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 ml-1">
            <input 
              type="color" 
              value={color} 
              onChange={(e) => onColorChange(e.target.value)}
              className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 m-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
      <DebouncedSlider 
        label={t('settings.appearance.overlayOpacity', 'Overlay Opacity')}
        value={opacity} min={0} max={0.9} step={0.05} displayValue="{value}" onChange={onOpacityChange}
      />
    </div>
  );
});
OverlayControls.displayName = 'OverlayControls';