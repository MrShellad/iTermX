import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/common/ConfirmDialog"; // 引入公共组件
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Server } from "@/features/server/domain/types";
import { Key, Lock } from "lucide-react"; // 移除了 AlertTriangle，因为 ConfirmDialog 内部会处理

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  server: Server | null;
  relatedKeyId?: string;
  relatedKeyType?: 'password' | 'private_key';
  isKeyUsedByOthers?: boolean;
  relatedServerNames?: string[];
  onConfirm: (deleteKey: boolean) => void;
}

export const DeleteServerModal = ({
  isOpen,
  onOpenChange,
  server,
  relatedKeyId,
  relatedKeyType,
  isKeyUsedByOthers,
  relatedServerNames = [],
  onConfirm
}: Props) => {
  const { t } = useTranslation();
  const [deleteKey, setDeleteKey] = useState(false);

  // 每次打开重置状态
  useEffect(() => {
    if (isOpen) {
        // 如果是密码且没有被复用，默认勾选删除（用户体验优化）
        // 如果是密钥，默认不勾选，防止误删
        if (relatedKeyType === 'password' && !isKeyUsedByOthers) {
            setDeleteKey(true);
        } else {
            setDeleteKey(false);
        }
    }
  }, [isOpen, relatedKeyType, isKeyUsedByOthers]);

  // 处理确认逻辑：将本地状态 deleteKey 传递给父组件
  const handleConfirm = async () => {
    onConfirm(deleteKey);
  };

  if (!server) return null;

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={onOpenChange}
      title={t('server.delete.title', 'Delete Server?')}
      description={t('server.delete.confirm', 'Are you sure you want to delete server "{{name}}"? This action cannot be undone.', { name: server.name })}
      confirmText={t('common.delete', 'Delete')}
      cancelText={t('common.cancel', 'Cancel')}
      variant="destructive" // 使用红色警告风格
      onConfirm={handleConfirm}
    >
        {/* children 区域：放置额外的复选框逻辑
           ConfirmDialog 会自动将其渲染在标题下方、按钮上方
        */}
        {relatedKeyId && (
            <div className="mt-2 mb-1 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 text-left">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                        {relatedKeyType === 'password' 
                            ? <Lock className="w-4 h-4 text-orange-500"/> 
                            : <Key className="w-4 h-4 text-blue-500"/>
                        }
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="delete-key" 
                                checked={deleteKey} 
                                onCheckedChange={(c) => setDeleteKey(!!c)}
                                disabled={isKeyUsedByOthers}
                                className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500" // 匹配删除风格
                            />
                            <Label 
                                htmlFor="delete-key" 
                                className={`text-[13px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-700 dark:text-zinc-300`}
                            >
                                {relatedKeyType === 'password' 
                                    ? t('server.delete.deletePassword', 'Also delete the associated password')
                                    : t('server.delete.deleteKey', 'Also delete the associated private key')
                                }
                            </Label>
                        </div>

                        {isKeyUsedByOthers && (
                            <div className="text-[11px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                <p className="font-semibold mb-1">
                                    {t('server.deleteKeyUsedWarning', 'Credential used by other servers:')}
                                </p>
                                <ul className="list-disc list-inside opacity-90 pl-1">
                                    {relatedServerNames.slice(0, 3).map(name => (
                                        <li key={name} className="truncate">{name}</li>
                                    ))}
                                    {relatedServerNames.length > 3 && (
                                        <li>... (+{relatedServerNames.length - 3})</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </ConfirmDialog>
  );
};