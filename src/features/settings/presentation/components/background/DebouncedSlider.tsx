import { useState, useEffect, useRef, memo } from "react";
import { Slider } from "@/components/ui/slider";

interface Props {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  label: string;
  displayValue: string;
}

export const DebouncedSlider = memo(({ 
  value, min, max, step, onChange, label, displayValue 
}: Props) => {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setLocalValue(value); }, [value]);

  const handleValueChange = (newVals: number[]) => {
    const newVal = newVals[0];
    setLocalValue(newVal);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { onChange(newVal); }, 300);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 rounded">
          {displayValue.replace('{value}', String(localValue))}
        </span>
      </div>
      <Slider value={[localValue]} min={min} max={max} step={step} onValueChange={handleValueChange} />
    </div>
  );
});
DebouncedSlider.displayName = 'DebouncedSlider';