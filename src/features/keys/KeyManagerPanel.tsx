import { useState } from 'react';
import { KeyVaultGuard } from './components/KeyVaultGuard';
import { KeyManagerToolbar } from './components/KeyManagerToolbar';
import { useKeyStore } from '@/store/useKeyStore';
import { KeyCard } from './components/KeyCard';
import { KeyActionModal } from './components/KeyActionModal';
import { DeleteKeyModal } from './components/DeleteKeyModal';
import { clsx } from 'clsx';
import { useTranslation } from "react-i18next";
export const KeyManagerPanel = () => {
    const { keys, viewMode } = useKeyStore();
    const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
    const { t } = useTranslation();
    return (
        // 🟢 [修改] 添加 select-none 禁止文本选中
        <div className="h-full flex flex-col text-slate-900 dark:text-slate-100 select-none">
            <KeyVaultGuard>
                
                {/* 1. 顶部工具栏 */}
                <div className="shrink-0">
                    <KeyManagerToolbar />
                </div>

                {/* 2. 内容区域 */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {keys.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <p>{t('keys.empty', 'No keys found. Create one to get started.')}</p>
                        </div>
                    ) : (
                        <div className={clsx(
                            viewMode === 'grid' 
                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                : "flex flex-col gap-2"
                        )}>
                            {keys.map(key => (
                                <KeyCard 
                                    key={key.id} 
                                    data={key} 
                                    onDelete={(id) => setKeyToDelete(id)} 
                                />
                            ))}
                        </div>
                    )}
                </div>
                
                {/* 编辑/新增弹窗 */}
                <KeyActionModal />

                {/* 删除确认弹窗 */}
                <DeleteKeyModal 
                    keyId={keyToDelete} 
                    onClose={() => setKeyToDelete(null)} 
                />

            </KeyVaultGuard>
        </div>
    );
};