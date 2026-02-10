import { useState } from 'react';
import { useKeyStore } from '@/store/useKeyStore';
import { ShieldCheck, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
    onSuccess?: () => void; // 解锁/设置成功后的回调
}

export const VaultAuthForm = ({ onSuccess }: Props) => {
    const { status, setupVault, unlockVault, isLoading } = useKeyStore();
    const [password, setPassword] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [error, setError] = useState('');
    const { t } = useTranslation();

    const handleSetup = async () => {
        if (password !== confirmPwd) {
            setError(t('keys.error.pwdMismatch', 'Passwords do not match'));
            return;
        }
        if (password.length < 6) {
            setError(t('keys.error.pwdShort', 'Password must be at least 6 characters'));
            return;
        }
        await setupVault(password);
        onSuccess?.();
    };

    const handleUnlock = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const success = await unlockVault(password);
        if (success) {
            onSuccess?.();
        } else {
            setError(t('keys.error.wrongPwd', 'Incorrect password'));
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 w-full">
            <div className="flex justify-center mb-6">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    {status === 'uninitialized' ? (
                        <ShieldCheck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    ) : (
                        <Lock className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    )}
                </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">
                {status === 'uninitialized' ? t('keys.setup.title', 'Setup Key Vault') : t('keys.setup.unlock_title', 'Unlock Vault')}
            </h2>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm max-w-xs">
                {status === 'uninitialized' 
                    ? t('keys.setup.desc', 'Your keys are encrypted using a master password. Please set one up to continue.')
                    : t('keys.setup.unlock_desc', 'Please enter your master password to access your keys.')}
            </p>

            <form onSubmit={status === 'locked' ? handleUnlock : (e) => { e.preventDefault(); handleSetup(); }} className="space-y-4 w-full max-w-sm">
                <div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder={status === 'uninitialized' ? t('keys.placeholder.setPwd', 'Set Master Password') : t('keys.placeholder.enterPwd', 'Master Password')}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        autoFocus
                    />
                </div>
                
                {status === 'uninitialized' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <input
                            type="password"
                            value={confirmPwd}
                            onChange={(e) => setConfirmPwd(e.target.value)}
                            placeholder={t('keys.placeholder.confirmPwd', 'Confirm Password')}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                )}

                {error && <p className="text-red-500 text-sm text-center animate-in shake">{error}</p>}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                        <>
                            {status === 'uninitialized' ? t('common.create', 'Create Vault') : t('common.unlock', 'Unlock')}
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};