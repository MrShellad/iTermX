import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileEntry } from '@/features/fs/types';
import { useFileStore } from '@/store/useFileStore';
import { formatBytes } from '@/utils/format';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { FileIcon, FolderIcon } from './FileIcons'; 
import { FileContextMenu, FileActionType } from './FileContextMenu';
import { useFileActions } from '../hooks/useFileActions';
import { FsActionModals } from './FsActionModals'; 
import { clsx } from 'clsx'; 

// [修改] 移除了 FileEditor 和 createPortal 的引用，因为现在是独立窗口模式

// 简单的骨架屏组件
const FileListSkeleton = () => (
  <div className="p-2 space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-2 p-2 animate-pulse">
        <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded shrink-0"></div>
        <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded hidden sm:block"></div>
        <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded hidden md:block"></div>
      </div>
    ))}
  </div>
);

interface Props {
  sessionId: string;
}

export const FileList = ({ sessionId }: Props) => {
  const { t } = useTranslation();
  const { getSession } = useFileStore();
  const state = getSession(sessionId);
  
  const { files, sortField, sortOrder, isLoading } = state;

  // 获取 Action Hook
  const { 
      handleSort, 
      handleDoubleClick, 
      executeAction, 
      modalState, 
      closeModal, 
      handleModalConfirm,
      toastMessage,
      isSubmitting,
      hasClipboard,
      // [修改] 不再需要 editorState 和 closeEditor
  } = useFileActions(sessionId);

  // 右键菜单状态
  const [menu, setMenu] = useState<{ x: number, y: number, file?: FileEntry } | null>(null);

  // 排序逻辑
  const sortedFiles = useMemo(() => {
    if (!files) return [];
    const sorted = [...files];
    sorted.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      let comparison = 0;
      switch (sortField) {
        case 'size': comparison = a.size - b.size; break;
        case 'lastModified': comparison = a.lastModified - b.lastModified; break;
        case 'name':
        default: comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }); break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    return sorted;
  }, [files, sortField, sortOrder]);

  // 点击关闭菜单
  useEffect(() => {
    const handleClick = () => { if (menu) setMenu(null); };
    window.addEventListener('click', handleClick);
    return () => { window.removeEventListener('click', handleClick); };
  }, [menu]);

  const handleCloseMenu = useCallback(() => { setMenu(null); }, []);

  const onMenuAction = useCallback((action: FileActionType, file?: FileEntry) => {
      executeAction(action, file);
      setMenu(null);
  }, [executeAction]);

  const onEmptyContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setMenu({ x: e.clientX, y: e.clientY, file: undefined });
  };

  const onRowContextMenu = (e: React.MouseEvent, file: FileEntry) => {
      e.preventDefault();
      e.stopPropagation(); 
      setMenu({ x: e.clientX, y: e.clientY, file });
  };

  const SortIcon = ({ field }: { field: string }) => {
      if (sortField !== field) return null;
      return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  // 是否显示骨架屏
  const showSkeleton = isLoading && files.length === 0;

  return (
    <div className="h-full flex flex-col min-h-0 relative" onContextMenu={onEmptyContextMenu}>
      
      {/* Toast Notification */}
      {toastMessage && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full shadow-lg text-xs flex items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-300 ${
              toastMessage.type === 'error' 
                ? 'bg-red-100 text-red-700 dark:bg-red-900/80 dark:text-red-100' 
                : 'bg-slate-800/90 text-white'
          }`}>
              {toastMessage.type === 'error' ? <XCircle className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4 text-green-400" />}
              {toastMessage.msg}
          </div>
      )}

      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_100px_100px_100px_150px] gap-2 p-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 select-none bg-slate-50 dark:bg-slate-900/50 shrink-0">
         <div className="w-6"></div> 
         <div className="cursor-pointer hover:text-slate-800 dark:hover:text-slate-300" onClick={() => handleSort('name')}>
             {t('fs.col.name')} <SortIcon field="name" />
         </div>
         <div className="cursor-pointer hover:text-slate-800 dark:hover:text-slate-300 text-right" onClick={() => handleSort('size')}>
             {t('fs.col.size')} <SortIcon field="size" />
         </div>
         <div>{t('fs.col.perm')}</div>
         <div>{t('fs.col.owner')}</div>
         <div className="cursor-pointer hover:text-slate-800 dark:hover:text-slate-300 text-right" onClick={() => handleSort('lastModified')}>
             {t('fs.col.date')} <SortIcon field="lastModified" />
         </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {showSkeleton ? (
            <FileListSkeleton />
        ) : (
            <>
                {sortedFiles.map((file) => {
                    const isContextActive = menu?.file?.path === file.path;

                    return (
                        <div 
                            key={file.path}
                            className={clsx(
                                "grid grid-cols-[auto_1fr_100px_100px_100px_150px] gap-2 p-2 text-sm border-b border-slate-100 dark:border-slate-800/50 items-center group transition-colors select-none",
                                isContextActive 
                                    ? "bg-blue-100 dark:bg-blue-900/40" 
                                    : "hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer" 
                            )}
                            onContextMenu={(e) => onRowContextMenu(e, file)}
                            onDoubleClick={() => handleDoubleClick(file)}
                        >
                            <div className="w-6 flex justify-center shrink-0">
                                {file.isDir ? <FolderIcon className="w-5 h-5" /> : <FileIcon ext={file.extension} className="w-5 h-5" />}
                            </div>
                            <div className="truncate font-medium text-slate-700 dark:text-slate-200" title={file.name}>{file.name}</div>
                            <div className="text-right font-mono text-slate-500 text-xs shrink-0">{file.isDir ? '-' : formatBytes(file.size)}</div>
                            <div className="font-mono text-slate-500 text-xs truncate shrink-0">{file.permissions}</div>
                            <div className="text-slate-500 text-xs truncate shrink-0">{file.owner}</div>
                            <div className="text-right font-mono text-slate-500 text-xs shrink-0">
                                {new Date(file.lastModified).toLocaleDateString()}
                            </div>
                        </div>
                    );
                })}

                {!isLoading && files.length === 0 && (
                    <div className="p-10 text-center text-slate-400 italic">
                        {t('fs.empty')}
                    </div>
                )}
            </>
        )}
      </div>

      {/* Context Menu */}
      {menu && (
        <FileContextMenu 
            x={menu.x} 
            y={menu.y} 
            file={menu.file} 
            hasClipboard={hasClipboard}
            onClose={handleCloseMenu} 
            onAction={onMenuAction} 
        />
      )}

      {/* Action Modals */}
      <FsActionModals 
          isOpen={!!modalState.type}
          type={modalState.type}
          fileName={modalState.file?.name}
          initialValue={modalState.initialInput || modalState.file?.name || ''} 
          isDir={modalState.file?.isDir} 
          isLoading={isSubmitting}
          onClose={closeModal}
          onConfirm={handleModalConfirm}
      />

      {/* [修改] 移除了底部的 FileEditor 渲染代码 */}
    </div>
  );
};