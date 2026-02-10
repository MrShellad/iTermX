import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Shield, KeyRound, Terminal } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PasswordSection, KeySection } from "./ServerAuthComponents"; 
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";

// 本地小组件：Switch Button
const AuthTypeSwitcher = ({ value, onChange, t }: { value: string, onChange: (v: any) => void, t: any }) => (
  <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full sm:w-auto">
    <button type="button" onClick={() => onChange('password')}
      className={cn("flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2", value === 'password' ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400")}
    >
      <KeyRound className="w-3.5 h-3.5" /> {t('server.form.vault.password', 'Password')}
    </button>
    <button type="button" onClick={() => onChange('key')}
      className={cn("flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2", value === 'key' ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400")}
    >
      <Terminal className="w-3.5 h-3.5" /> {t('server.form.vault.key', 'Private Key')}
    </button>
  </div>
);

interface AuthCredentialsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  t: any;
  // 从 logic 传入的状态
  authType: string;
  onAuthTypeChange: (type: string) => void;
  passwordSource: string;
  passwordId?: string;
  keySource: string;
  keyId?: string;
  keyName?: string;
  // 动作
  onResetPassword: () => void;
  onResetKey: () => void;
  onSelectFromVault: () => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
}

export const AuthCredentials = ({ 
  register, errors, setValue, t,
  authType, onAuthTypeChange,
  passwordSource, passwordId, onResetPassword, showPassword, onToggleShowPassword,
  keySource, keyId, keyName, onResetKey, onSelectFromVault
}: AuthCredentialsProps) => {
  return (
    <div className="pt-2">
      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
        {t('server.form.credentials', 'Credentials')}
      </Label>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
           <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
             <div className="p-1.5 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-100 dark:border-slate-700"><Shield className="w-4 h-4 text-blue-500" /></div>
             <span className="text-sm font-medium">{t('server.form.authType', 'Auth Type')}</span>
           </div>
           <AuthTypeSwitcher value={authType} onChange={onAuthTypeChange} t={t} />
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
           {/* Username Field */}
           <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 ml-1">{t('server.form.username', 'Username')}</Label>
              <div className="relative group">
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <User className="w-4 h-4" />
                 </div>
                 {/* 🟢 [修改] 添加禁止自动填充属性 */}
                 <Input 
                   {...register("username")} 
                   placeholder="root" 
                   autoComplete="off" 
                   autoCorrect="off" 
                   autoCapitalize="off" 
                   spellCheck="false"
                   className={cn("pl-10 border-slate-200 dark:border-slate-700", errors.username && "border-red-500")} 
                 />
              </div>
           </div>

           {/* Dynamic Password/Key Field */}
           <div className="relative min-h-[100px]"> 
              <AnimatePresence mode="wait">
                 {authType === 'password' ? (
                    <PasswordSection 
                       key="pwd"
                       register={register}
                       source={passwordSource}
                       id={passwordId}
                       onReset={onResetPassword}
                       showPass={showPassword}
                       onToggleShow={onToggleShowPassword}
                    />
                 ) : (
                    <KeySection 
                       key="key"
                       register={register}
                       setValue={setValue}
                       keyName={keyName}
                       source={keySource}
                       id={keyId}
                       onReset={onResetKey}
                       onSelectFromVault={onSelectFromVault}
                    />
                 )}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
};