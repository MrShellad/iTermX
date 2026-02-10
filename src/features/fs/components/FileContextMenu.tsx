import { useEffect, useRef, useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileEntry } from '@/features/fs/types';
import { clsx } from 'clsx';
import { 
    FilePlus, FolderPlus, RefreshCw, Terminal, 
    Code, ExternalLink, Link, Edit3, Download, 
    Copy, Shield, Trash2, Scissors, ClipboardPaste,
    Plus, ChevronRight, Upload
} from 'lucide-react';
import { FileIcon, FolderIcon } from './FileIcons'; 

export type FileActionType = 
    | 'refresh' | 'newFile' | 'newFolder' | 'openTerminal'
    | 'openBuiltin' | 'openLocal' | 'copyPath' | 'rename'
    // [修复 1] 将 'permissions' 改为 'chmod' 以匹配逻辑层
    | 'download' | 'copy' | 'move' | 'chmod' | 'delete'
    | 'cut' | 'paste'
    | 'upload';

interface Props {
    x: number;
    y: number;
    file?: FileEntry; 
    hasClipboard?: boolean; 
    onClose: () => void;
    onAction: (action: FileActionType, file?: FileEntry) => void;
}

// 1. 分隔线组件
const Divider = () => <div className="h-px bg-slate-200 dark:bg-slate-700 my-0.5 mx-2" />;

// 2. 菜单项组件
interface MenuItemProps {
    icon?: any;
    label: string;
    action?: FileActionType;
    danger?: boolean;
    hasSubmenu?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    file?: FileEntry;
    onClose: () => void;
    onAction: (action: FileActionType, file?: FileEntry) => void;
}

const MenuItem = ({ 
    icon: Icon, label, action, danger, hasSubmenu, onClick, onMouseEnter, onMouseLeave, 
    file, onClose, onAction 
}: MenuItemProps) => (
    <button 
        onClick={(e) => {
            if (onClick) return onClick(e);
            e.stopPropagation();
            if (action) onAction(action, file);
            if (!hasSubmenu) onClose();
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={clsx(
            "w-full flex items-center gap-2.5 px-2 py-1.5 text-left transition-colors rounded mx-1 my-0.5 relative text-xs font-medium",
            danger 
                ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" 
                : "text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-600/20"
        )}
        style={{ width: 'calc(100% - 8px)' }}
    >
        {Icon && <Icon className="w-3.5 h-3.5 opacity-70 shrink-0" />}
        <span className="truncate flex-1">{label}</span>
        {hasSubmenu && <ChevronRight className="w-3 h-3 opacity-50" />}
    </button>
);

// 3. 新建子菜单组件
const NewSubmenu = ({ 
    t, onMouseEnter, onMouseLeave, file, onClose, onAction 
}: { 
    t: any, onMouseEnter: () => void, onMouseLeave: () => void,
    file?: FileEntry, onClose: () => void, onAction: any
}) => (
    <div 
        className="absolute left-full top-[-4px] pl-1 w-40 z-[60] animate-in fade-in zoom-in-95 duration-75 ease-out"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
    >
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg py-1">
            <MenuItem 
                icon={FilePlus} label={t('fs.context.newFile', 'New File')} action="newFile" 
                file={file} onClose={onClose} onAction={onAction} 
            />
            <MenuItem 
                icon={FolderPlus} label={t('fs.context.newFolder', 'New Folder')} action="newFolder" 
                file={file} onClose={onClose} onAction={onAction} 
            />
        </div>
    </div>
);

const FileContextMenuComponent = ({ x, y, file, hasClipboard, onClose, onAction }: Props) => {
    const { t } = useTranslation();
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: y, left: x });
    const [showNewSubmenu, setShowNewSubmenu] = useState(false);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (menuRef.current) {
            const menuRect = menuRef.current.getBoundingClientRect();
            const winWidth = window.innerWidth;
            const winHeight = window.innerHeight;

            let newLeft = x;
            let newTop = y;
            
            if (x + menuRect.width > winWidth) newLeft = x - menuRect.width;
            if (y + menuRect.height > winHeight) newTop = y - menuRect.height;
            if (newTop < 10) newTop = 10;

            setPosition({ top: newTop, left: newLeft });
        }
    }, [x, y]);

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setShowNewSubmenu(true);
    };

    const handleMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setShowNewSubmenu(false);
        }, 300);
    };

    const commonProps = { file, onClose, onAction };

    return (
        <div 
            ref={menuRef}
            className={clsx(
                "fixed z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md",
                "border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg",
                "py-1 w-52",
                "animate-in fade-in zoom-in-95 duration-75 ease-out origin-top-left"
            )}
            style={{ top: position.top, left: position.left }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="px-3 py-1.5 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700/50 mb-0.5 truncate flex items-center gap-2 select-none text-[10px] uppercase tracking-wider">
                {file ? (file.isDir ? <FolderIcon className="w-3 h-3"/> : <FileIcon ext={file.extension} className="w-3 h-3"/>) : null}
                <span className="truncate">{file ? file.name : t('fs.empty', 'Current Folder')}</span>
            </div>
            
            {/* Group 1: 创建与上传 */}
            <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <MenuItem 
                    icon={Plus} label={t('fs.context.new', 'New')} hasSubmenu 
                    onClick={(e) => e.stopPropagation()} 
                    {...commonProps}
                />
                {showNewSubmenu && (
                    <NewSubmenu 
                        t={t} 
                        onMouseEnter={handleMouseEnter} 
                        onMouseLeave={handleMouseLeave} 
                        {...commonProps} 
                    />
                )}
            </div>
            
            {!file && (
                <MenuItem icon={Upload} label={t('fs.context.upload', 'Upload File')} action="upload" {...commonProps} />
            )}
            
            <Divider />

            {/* Group 2: 打开 */}
            {file && (
                <>
                    <MenuItem icon={Code} label={t('fs.context.openBuiltin')} action="openBuiltin" {...commonProps} />
                    <MenuItem icon={ExternalLink} label={t('fs.context.openLocal')} action="openLocal" {...commonProps} />
                    <Divider />
                </>
            )}

            {/* Group 3: 剪贴板 */}
            {(file || hasClipboard) && (
                <>
                    {file && (
                        <>
                            <MenuItem icon={Copy} label={t('fs.context.copy')} action="copy" {...commonProps} />
                            <MenuItem icon={Scissors} label={t('fs.context.cut')} action="cut" {...commonProps} />
                        </>
                    )}
                    {hasClipboard && (!file || file.isDir) && (
                         <MenuItem icon={ClipboardPaste} label={file ? t('fs.context.pasteInto', 'Paste Into') : t('fs.context.paste', 'Paste')} action="paste" {...commonProps} />
                    )}
                    {(file || hasClipboard) && <Divider />}
                </>
            )}

            {/* Group 4: 通用 */}
            <MenuItem icon={Terminal} label={t('fs.context.openTerminal')} action="openTerminal" {...commonProps} />
            <MenuItem icon={Link} label={t('fs.context.copyPath')} action="copyPath" {...commonProps} />

            {/* Group 5: 编辑 */}
            {file && (
                <>
                    <Divider />
                    <MenuItem icon={Edit3} label={t('fs.context.rename')} action="rename" {...commonProps} />
                    <MenuItem icon={Download} label={t('fs.context.download')} action="download" {...commonProps} />
                    {/* [修复 2] 将 action="permissions" 改为 action="chmod" */}
                    <MenuItem icon={Shield} label={t('fs.context.permissions')} action="chmod" {...commonProps} />
                </>
            )}

            {/* Group 6: 刷新 */}
            {!file && (
                <>
                    <Divider />
                    <MenuItem icon={RefreshCw} label={t('fs.action.refresh')} action="refresh" {...commonProps} />
                </>
            )}

            {/* Group 7: 删除 */}
            {file && (
                <>
                    <Divider />
                    <MenuItem icon={Trash2} label={t('fs.context.delete')} action="delete" danger {...commonProps} />
                </>
            )}
        </div>
    );
};

export const FileContextMenu = memo(FileContextMenuComponent);