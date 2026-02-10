import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
// ⚠️ 请根据你的实际目录结构确认引用路径
import { ServerFormValues } from "../../domain/schema";
import { Zap, Activity, Timer, RefreshCw } from "lucide-react";

interface AdvancedSettingsProps {
  t: any; // 这里的类型取决于你使用的 i18n 库，通常是 TFunction
  register: UseFormRegister<ServerFormValues>;
  errors: FieldErrors<ServerFormValues>;
  watch: UseFormWatch<ServerFormValues>;
  setValue: UseFormSetValue<ServerFormValues>;
}

export const AdvancedSettings = ({ t, register, errors, watch, setValue }: AdvancedSettingsProps) => {
  // 监听自动重连开关
  const autoReconnect = watch("autoReconnect");

  // 安全翻译辅助函数
  const translate = (key: string, fallback: string) => t ? t(key, fallback) : fallback;

  // 🚫 核心逻辑：拦截非法字符 (负号、小数点、e指数)
  const preventInvalidInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 允许的操作: Backspace, Delete, Tab, Escape, Enter, 方向键
    if (
      ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
    ) {
      return;
    }
    // 禁止输入: e, E, +, -, . (防止科学计数法、负数、小数)
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-4 pt-2">
      
      {/* 1. 连接超时 (Connection Timeout) */}
      <div className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30">
            <Timer className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="flex-1">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {translate('server.form.timeout', 'Connection Timeout')}
          </Label>
          <p className="text-[10px] text-slate-500">
            {translate('server.form.timeoutDesc', 'Max wait time in seconds (Integer only).')}
          </p>
          {errors.connectTimeout && (
            <p className="text-[10px] text-red-500 mt-1">{errors.connectTimeout.message}</p>
          )}
        </div>
        <div className="w-20">
          <Input 
            type="number"
            min={1} // Schema 限制最小为 1
            step={1} // 限制步长为整数
            onKeyDown={preventInvalidInput} // 拦截键盘输入
            {...register("connectTimeout", { 
              valueAsNumber: true,
              required: "Required",
              min: { value: 1, message: "Min 1s" }
            })}
            className="h-8 text-right text-xs bg-white dark:bg-slate-800"
            placeholder="10"
          />
        </div>
      </div>

      {/* 2. 心跳间隔 (Keep-Alive) */}
      <div className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
            <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {translate('server.form.keepalive', 'Keep-Alive Interval')}
          </Label>
          <p className="text-[10px] text-slate-500">
            {translate('server.form.keepaliveDesc', 'Seconds between packets (0 to disable).')}
          </p>
           {errors.keepAliveInterval && (
            <p className="text-[10px] text-red-500 mt-1">{errors.keepAliveInterval.message}</p>
          )}
        </div>
        <div className="w-20">
          <Input 
            type="number" 
            min={0}
            step={1}
            onKeyDown={preventInvalidInput}
            {...register("keepAliveInterval", { 
              valueAsNumber: true,
              min: { value: 0, message: "Min 0" }
            })}
            className="h-8 text-right text-xs bg-white dark:bg-slate-800"
            placeholder="60"
          />
        </div>
      </div>

      {/* 3. 自动重连 (Auto Reconnect) */}
      <div className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {translate('server.form.reconnect', 'Auto Reconnect')}
          </Label>
          <p className="text-[10px] text-slate-500">
            {translate('server.form.reconnectDesc', 'Automatically retry if disconnected.')}
          </p>
        </div>
        <Switch 
          checked={!!autoReconnect}
          onCheckedChange={(val) => setValue("autoReconnect", val, { shouldDirty: true })}
          className="scale-90"
        />
      </div>

      {/* 4. 最大重连次数 (Max Retries) - 仅当开启自动重连时显示 */}
      {autoReconnect && (
        <div className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 ml-6 border-l-4 border-l-blue-500/20">
          <RefreshCw className="w-4 h-4 text-slate-400" />
          <div className="flex-1">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {translate('server.form.retries', 'Max Retries')}
            </Label>
            <p className="text-[10px] text-slate-500">
                {translate('server.form.retriesDesc', 'Maximum attempts (Integer).')}
            </p>
             {errors.maxReconnects && (
              <p className="text-[10px] text-red-500 mt-1">{errors.maxReconnects.message}</p>
            )}
          </div>
          <div className="w-20">
             <Input 
                type="number" 
                min={0}
                step={1}
                onKeyDown={preventInvalidInput}
                {...register("maxReconnects", { 
                  valueAsNumber: true,
                  min: { value: 0, message: "Min 0" }
                })}
                className="h-8 text-right text-xs bg-white dark:bg-slate-800"
                placeholder="3"
             />
          </div>
        </div>
      )}
    </div>
  );
};