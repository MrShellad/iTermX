// src/features/server/form/presentation/components/ServerAuthComponents.tsx
import { useRef } from "react";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { ServerFormValues } from "../../domain/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, RotateCcw, CheckCircle2, KeyRound, FolderOpen, Database } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
// [新增]
import { useTranslation } from "react-i18next";

interface SectionProps {
  register: UseFormRegister<ServerFormValues>;
  setValue?: UseFormSetValue<ServerFormValues>;
  onReset: () => void;
  errors?: FieldErrors<ServerFormValues>;
  onSelectFromVault?: () => void;
}

interface PasswordProps extends SectionProps {
  source: string;
  id?: string | null;

  showPass: boolean;
  onToggleShow: () => void;
}

interface KeyProps extends SectionProps {
  source: string;
  id?: string | null;
  keyName?: string;
}

export const PasswordSection = ({ register, source, id, onReset, showPass, onToggleShow }: PasswordProps) => {
    const { t } = useTranslation(); // [新增]
    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}
            className="space-y-1.5"
        >
            <Label className="text-xs text-slate-500 ml-1">{t('server.form.password', 'Password')}</Label>
            
            {source === 'store' && id ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                    <div className="p-1.5 bg-white dark:bg-emerald-950 rounded-full shadow-sm">
                        <Lock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 flex flex-col">
                        <span className="text-xs font-bold">{t('server.form.vault.secured', 'Securely Stored')}</span>
                        <span className="text-[10px] opacity-80 truncate max-w-[180px]"></span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-800">
                        <RotateCcw className="w-3 h-3 mr-1" /> {t('common.change', 'Change')}
                    </Button>
                </div>
            ) : (
                <div className="relative group">
                    {/* [修复] 添加 z-10 */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <KeyRound className="w-4 h-4" />
                    </div>
                    <Input 
                        type={showPass ? "text" : "password"} 
                        {...register("password")} 
                        placeholder={t('server.form.passwordPlaceholder', 'Enter password...')}
                        className="pl-10 pr-10 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500/20 bg-white dark:bg-slate-900"
                    />
                    <button type="button" onClick={onToggleShow} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export const KeySection = ({ register, setValue, source, id, onReset, onSelectFromVault }: KeyProps) => {
  const { t } = useTranslation(); // [新增]
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024) {
        toast.error("File is too large");
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        if (setValue) {
            setValue("privateKey", event.target?.result as string, { shouldDirty: true, shouldValidate: true });
            toast.success("Key loaded");
        }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <motion.div 
        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
        className="space-y-4"
    >
        <div className="space-y-1.5">
            <div className="flex justify-between items-end">
                <Label className="text-xs text-slate-500 ml-1">{t('server.form.privateKey', 'Private Key')}</Label>
                {(!id || source === 'manual') && (
                    <div className="flex gap-2">
                        <input type="file" ref={fileInputRef} className="hidden" accept=".pem,.key,.ppk,text/plain" onChange={handleFileUpload} />
                        <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[10px] gap-1.5 bg-slate-50 dark:bg-slate-900 border-dashed" onClick={() => fileInputRef.current?.click()}>
                            <FolderOpen className="w-3 h-3 text-slate-500" /> {t('common.loadFile', 'Load File')}
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[10px] gap-1.5 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 hover:text-blue-700" onClick={onSelectFromVault}>
                            <Database className="w-3 h-3" /> {t('server.form.vault.select', 'Select from Vault')}
                        </Button>
                    </div>
                )}
            </div>
            
            {source === 'store' && id ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                    <div className="p-1.5 bg-white dark:bg-blue-950 rounded-full shadow-sm"><CheckCircle2 className="w-4 h-4" /></div>
                    <div className="flex-1 flex flex-col">
                        <span className="text-xs font-bold">{t('server.form.vault.associated', 'Vault Associated')}</span>
                        <span className="text-[10px] opacity-80">{t('server.form.vault.keyReady', 'Key is ready')}</span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-800">
                        <RotateCcw className="w-3 h-3 mr-1" /> {t('common.reset', 'Reset')}
                    </Button>
                </div>
            ) : (
                <textarea 
                    {...register("privateKey")}
                    className="w-full h-24 p-3 text-xs font-mono rounded-lg resize-none border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                />
            )}
        </div>
        
        {(!id || source === 'manual') && (
            <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 ml-1">{t('server.form.passphrase', 'Passphrase')}</Label>
                <div className="relative group">
                    {/* [修复] 添加 z-10 */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <Lock className="w-3.5 h-3.5" />
                    </div>
                    <Input type="password" {...register("passphrase")} placeholder={t('common.optional', 'Optional')} className="pl-10 h-9 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500/20 bg-white dark:bg-slate-900" />
                </div>
            </div>
        )}
    </motion.div>
  );
};