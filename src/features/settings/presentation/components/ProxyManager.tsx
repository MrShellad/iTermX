import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Edit2, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KeyVaultGuard } from "@/features/keys/components/KeyVaultGuard";
import { useSettingsStore } from "../../application/useSettingsStore";
import { ProxyEditDialog } from "./ProxyEditDialog";
import { ProxyItem } from "../../domain/types";
import { ConfirmDialog } from "@/components/common/ConfirmDialog"; // 🟢 [新增] 引入美化确认框

// 分组渲染辅助组件
const ProxyGroup = ({ 
    title, 
    list, 
    onEdit, 
    onDelete 
}: { 
    title: string, 
    list: ProxyItem[], 
    onEdit: (p: ProxyItem) => void, 
    onDelete: (id: string) => void 
}) => {
    if (list.length === 0) return null;
    return (
        <div className="mb-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">{title}</div>
            <div className="space-y-2">
                {list.map(proxy => (
                    <div key={proxy.id} className="group flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-blue-500 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                {proxy.type.startsWith('socks') ? <Shield className="w-4 h-4 text-purple-500" /> : <Globe className="w-4 h-4 text-blue-500" />}
                            </div>
                            <div>
                                <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{proxy.name}</div>
                                <div className="text-xs text-slate-500 font-mono">
                                    {proxy.host}:{proxy.port} 
                                    {proxy.encryptedAuth && <span className="ml-2 text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-400">Auth</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(proxy)}>
                                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-red-500" onClick={() => onDelete(proxy.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ProxyManager = () => {
    const { t } = useTranslation();
    const proxies = useSettingsStore(s => s.proxies);
    const addProxy = useSettingsStore(s => s.addProxy);
    const updateProxy = useSettingsStore(s => s.updateProxy);
    const removeProxy = useSettingsStore(s => s.removeProxy);

    // 编辑弹窗状态
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProxy, setEditingProxy] = useState<ProxyItem | undefined>(undefined);

    // 🟢 [新增] 删除确认弹窗状态
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [proxyToDelete, setProxyToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleAdd = () => {
        setEditingProxy(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (proxy: ProxyItem) => {
        setEditingProxy(proxy);
        setIsDialogOpen(true);
    };

    // 🟢 [修改] 点击删除按钮只打开弹窗，不直接删除
    const handleDeleteClick = (id: string) => {
        setProxyToDelete(id);
        setDeleteDialogOpen(true);
    };

    // 🟢 [新增] 确认删除逻辑
    const executeDelete = async () => {
        if (!proxyToDelete) return;
        
        setIsDeleting(true);
        try {
            await removeProxy(proxyToDelete);
            setDeleteDialogOpen(false);
            setProxyToDelete(null);
        } catch (error) {
            console.error("Failed to delete proxy", error);
        } finally {
            setIsDeleting(false);
        }
    };

    // 分组逻辑
    const httpProxies = proxies.filter(p => p.type.startsWith('http'));
    const socksProxies = proxies.filter(p => p.type.startsWith('socks'));

    return (
        <KeyVaultGuard>
            <div className="pt-2">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-slate-500">
                        {t('settings.proxy.description', 'Manage your proxies securely. Passwords are encrypted with your Master Key.')}
                    </p>
                    <Button size="sm" onClick={handleAdd} className="gap-1">
                        <Plus className="w-4 h-4" />
                        {t('settings.proxy.add', 'Add Proxy')}
                    </Button>
                </div>

                {proxies.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                        {t('settings.proxy.empty', 'No proxies configured')}
                    </div>
                ) : (
                    <>
                        <ProxyGroup title="HTTP / HTTPS" list={httpProxies} onEdit={handleEdit} onDelete={handleDeleteClick} />
                        <ProxyGroup title="SOCKS4 / SOCKS5" list={socksProxies} onEdit={handleEdit} onDelete={handleDeleteClick} />
                    </>
                )}

                {/* 编辑/新增弹窗 */}
                <ProxyEditDialog 
                    isOpen={isDialogOpen} 
                    onClose={() => setIsDialogOpen(false)}
                    onSave={(p) => {
                        if (editingProxy) {
                            updateProxy(p);
                        } else {
                            addProxy(p);
                        }
                    }}
                    initialData={editingProxy}
                />

                {/* 🟢 [新增] 删除确认弹窗 */}
                <ConfirmDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    title={t('common.deleteProxy', 'Delete Proxy')}
                    description={t('common.deleteProxyConfirm', 'Are you sure you want to delete this proxy configuration? This action cannot be undone.')}
                    variant="destructive"
                    confirmText={t('common.delete', 'Delete')}
                    cancelText={t('common.cancel', 'Cancel')}
                    onConfirm={executeDelete}
                    isLoading={isDeleting}
                />
            </div>
        </KeyVaultGuard>
    );
};