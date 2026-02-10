import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { InputModal } from "@/components/common/InputModal";
import { parsePermissionString, toOctalString, hasPerm } from "@/utils/permission";

export type ModalType = 'newFile' | 'newFolder' | 'rename' | 'delete' | 'chmod' | null;

interface Props {
  isOpen: boolean;
  type: ModalType;
  initialValue?: string;
  fileName?: string;
  isDir?: boolean; 
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (value?: string, options?: { recursive: boolean }) => void;
}

export const FsActionModals = ({ 
    isOpen, 
    type, 
    initialValue = "", 
    fileName, 
    isDir = false, 
    isLoading, 
    onClose, 
    onConfirm 
}: Props) => {
  const { t } = useTranslation();

  // --- 权限状态管理 ---
  const [perms, setPerms] = useState({ owner: 0, group: 0, others: 0 });
  const [isRecursive, setIsRecursive] = useState(false);

  // 初始化
  useEffect(() => {
    if (isOpen && type === 'chmod' && initialValue) {
      setPerms(parsePermissionString(initialValue));
      setIsRecursive(false); 
    }
  }, [isOpen, type, initialValue]);

  const togglePerm = (role: 'owner'|'group'|'others', bit: number) => {
    setPerms(prev => {
      const current = prev[role];
      const next = (current & bit) === bit ? current - bit : current + bit;
      return { ...prev, [role]: next };
    });
  };

  // 1. Delete 逻辑
  if (type === 'delete') {
    return (
      <ConfirmDialog
        open={isOpen}
        onOpenChange={(open) => !open && !isLoading && onClose()}
        title={t('fs.context.delete', 'Delete')}
        description={t('fs.dialog.deleteConfirm', { name: fileName })}
        confirmText={t('common.delete', 'Delete')}
        cancelText={t('common.cancel', 'Cancel')}
        variant="destructive"
        isLoading={isLoading}
        onConfirm={() => onConfirm()}
      />
    );
  }

  // 2. Chmod 逻辑
  if (type === 'chmod') {
    const octalCode = toOctalString(perms.owner, perms.group, perms.others);

    return (
      <ConfirmDialog
        open={isOpen}
        onOpenChange={(open) => !open && !isLoading && onClose()}
        title={t('fs.context.permission', 'Change Permissions')}
        confirmText={t('common.save', 'Save')}
        cancelText={t('common.cancel', 'Cancel')}
        isLoading={isLoading}
        onConfirm={() => onConfirm(octalCode, { recursive: isRecursive })}
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="text-sm text-slate-500 mb-2 flex items-center gap-2">
            {/* [修改] File 标签本地化 */}
            {t('fs.perm.prop_file', 'File')}: <span className="font-medium text-slate-900 dark:text-slate-200">{fileName}</span>
            {isDir && (
                // [修改] Directory 标签本地化
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    {t('fs.perm.dir', 'Directory')}
                </span>
            )}
          </div>

          <div className="border rounded-md overflow-hidden text-sm">
             <div className="grid grid-cols-4 bg-slate-100 dark:bg-slate-800 p-2 font-medium text-center">
              {/* [修改] 表头本地化 */}
              <div className="text-left pl-2">{t('fs.perm.scope', 'Scope')}</div>
              <div>{t('fs.perm.read', 'Read')}</div>
              <div>{t('fs.perm.write', 'Write')}</div>
              <div>{t('fs.perm.execute', 'Execute')}</div>
            </div>
            {['owner', 'group', 'others'].map((role) => (
               <div key={role} className="grid grid-cols-4 p-2 border-t dark:border-slate-700 items-center text-center capitalize">
                  {/* [修改] 角色名本地化 (使用模板字符串动态获取 key) */}
                  <div className="text-left pl-2 font-medium">
                    {t(`fs.perm.${role}`, role)}
                  </div>
                  {[4, 2, 1].map(bit => (
                    <div key={bit}>
                       <input 
                         type="checkbox" 
                         checked={hasPerm((perms as any)[role], bit)} 
                         onChange={() => togglePerm(role as any, bit)} 
                         className="accent-blue-600 w-4 h-4 align-middle" 
                       />
                    </div>
                  ))}
               </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 h-6">
                {isDir && (
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        <input 
                            type="checkbox" 
                            checked={isRecursive} 
                            onChange={(e) => setIsRecursive(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        {/* [修改] 递归选项本地化 */}
                        <span>{t('fs.perm.recursive', 'Recursive to sub-files')}</span>
                    </label>
                )}
            </div>

            <div className="flex items-center gap-2 text-sm">
                {/* [修改] Octal 标签本地化 */}
                <span className="text-slate-500">{t('fs.perm.octal', 'Octal')}:</span>
                <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono font-bold text-blue-600">
                {octalCode}
                </code>
            </div>
          </div>
        </div>
      </ConfirmDialog>
    );
  }

  // 3. 通用 InputModal 逻辑
  const modalConfig = {
      newFile: {
          title: t('fs.context.newFile', 'New File'),
          placeholder: t('fs.placeholder.file', 'example.txt'),
          inputType: 'file' as const,
          confirmLabel: t('common.create', 'Create')
      },
      newFolder: {
          title: t('fs.context.newFolder', 'New Folder'),
          placeholder: t('fs.placeholder.folder', 'New Folder'),
          inputType: 'folder' as const,
          confirmLabel: t('common.create', 'Create')
      },
      rename: {
          title: t('fs.context.rename', 'Rename'),
          placeholder: "",
          inputType: (fileName && fileName.includes('.')) ? 'file' as const : 'folder' as const,
          confirmLabel: t('common.save', 'Save')
      }
  };

  const config = type ? modalConfig[type as keyof typeof modalConfig] : null;

  if (!isOpen || !config) return null;

  return (
    <InputModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(val) => onConfirm(val)}
      title={config.title}
      placeholder={config.placeholder}
      type={config.inputType}
      defaultValue={initialValue}
      confirmLabel={config.confirmLabel}
      isLoading={isLoading}
    />
  );
};