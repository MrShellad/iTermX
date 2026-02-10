import { useState, useEffect } from 'react';
import { 
    ArrowLeft, ArrowRight, ArrowUp, RotateCw, 
    Upload, Eye, EyeOff, ArrowRightLeft, 
    CheckCircle2, XCircle, Loader2 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFileStore } from '@/store/useFileStore';
import { useTransferStore } from '@/store/useTransferStore';
import { GlassTooltip } from '@/components/common/GlassTooltip';
// [核心] 引入 Action Hook
import { useFileActions } from '../hooks/useFileActions';

interface Props {
  sessionId: string;
}

export const FsTopBar = ({ sessionId }: Props) => {
  const { t } = useTranslation();
  
  // 1. 文件系统 Store：用于导航和状态读取
  const { 
    getSession, 
    setPath, 
    goBack, 
    goForward, 
    goUp, 
    toggleHidden 
  } = useFileStore();

  // 2. 传输列表 Store：用于开关传输面板
  const { toggleOpen: toggleTransfer } = useTransferStore();

  // 3. [核心] 动作 Hook：用于上传、刷新和获取反馈状态
  const { 
    handleUpload, 
    executeAction, // 用于触发 refresh
    isSubmitting,  // 上传时的 Loading 状态
    toastMessage   // 上传结果的 Toast 提示
  } = useFileActions(sessionId);
  
  // 获取当前 Session 状态
  const sessionState = getSession(sessionId);
  const { currentPath, showHidden } = sessionState;

  // 本地输入框状态 (用于地址栏编辑)
  const [inputPath, setInputPath] = useState(currentPath);

  // 当外部路径变化时，同步更新输入框
  useEffect(() => {
    setInputPath(currentPath);
  }, [currentPath]);

  // 地址栏回车跳转
  const handlePathSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPath(sessionId, inputPath);
    }
  };

  const btnClass = "p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center gap-2 p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 relative">
      
      {/* --- Toast 提示区域 (用于显示上传/刷新反馈) --- */}
      {toastMessage && (
          <div className={`absolute top-12 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full shadow-lg text-xs flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300 border ${
              toastMessage.type === 'error' 
                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/80 dark:border-red-800 dark:text-red-100' 
                : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
          }`}>
              {toastMessage.type === 'error' ? <XCircle className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
              {toastMessage.msg}
          </div>
      )}

      {/* --- 1. 导航按钮组 --- */}
      <div className="flex items-center gap-1">
        <GlassTooltip content={t('fs.nav.back')}>
            <button 
                onClick={() => goBack(sessionId)} 
                className={btnClass}
                disabled={sessionState.historyIndex <= 0}
            >
                <ArrowLeft className="w-4 h-4" />
            </button>
        </GlassTooltip>
        
        <GlassTooltip content={t('fs.nav.forward')}>
            <button 
                onClick={() => goForward(sessionId)} 
                className={btnClass}
                disabled={sessionState.historyIndex >= sessionState.history.length - 1}
            >
                <ArrowRight className="w-4 h-4" />
            </button>
        </GlassTooltip>

        <GlassTooltip content={t('fs.nav.up')}>
            <button onClick={() => goUp(sessionId)} className={btnClass}>
                <ArrowUp className="w-4 h-4" />
            </button>
        </GlassTooltip>
      </div>

      {/* --- 2. 地址栏 --- */}
      <div className="flex-1 mx-2">
        <input 
          type="text"
          value={inputPath}
          onChange={(e) => setInputPath(e.target.value)}
          onKeyDown={handlePathSubmit}
          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded transition-colors focus:ring-2 focus:ring-blue-500 outline-none font-mono text-slate-700 dark:text-slate-200"
        />
      </div>

      {/* --- 3. 功能按钮组 --- */}
      <div className="flex items-center gap-1">
        
        {/* [功能 1] 刷新 */}
        <GlassTooltip content={t('fs.action.refresh')}>
            <button 
                onClick={() => executeAction('refresh')} // 使用 action 统一管理
                className={btnClass}
            >
                <RotateCw className="w-4 h-4" />
            </button>
        </GlassTooltip>
        
        {/* [功能 2] 上传 */}
        <GlassTooltip content={t('fs.action.upload')}>
            <button 
                className={btnClass} 
                onClick={handleUpload} // 调用上传 Hook
                disabled={isSubmitting} // 上传中禁用
            >
                {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                ) : (
                    <Upload className="w-4 h-4" />
                )}
            </button>
        </GlassTooltip>
        
        {/* [功能 3] 显示/隐藏文件 */}
        <GlassTooltip content={showHidden ? t('fs.view.hideHidden') : t('fs.view.showHidden')}>
            <button 
                onClick={() => toggleHidden(sessionId)} 
                className={`${btnClass} ${showHidden ? 'bg-slate-200 dark:bg-slate-800' : ''}`} // 激活状态加深背景
            >
                {showHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </GlassTooltip>

        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* [功能 4] 传输管理面板开关 */}
        <GlassTooltip content={t('fs.transfer.manager')}>
            <button 
                onClick={toggleTransfer}
                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400 transition-colors"
            >
                <ArrowRightLeft className="w-4 h-4" />
            </button>
        </GlassTooltip>
      </div>
    </div>
  );
};