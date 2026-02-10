import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Edit2, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "../../application/useSettingsStore";
import { TERMINAL_THEMES } from "@/features/terminal/constants";
import { CustomTheme } from "../../domain/types";
import { ThemeEditorModal } from "./ThemeEditorModal";
// [新增] 引入刚刚完善的确认弹窗
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export const ThemeManager = () => {
  const { t } = useTranslation();
  const customThemes = useSettingsStore(s => s.customThemes);
  const addCustomTheme = useSettingsStore(s => s.addCustomTheme);
  const updateCustomTheme = useSettingsStore(s => s.updateCustomTheme);
  const removeCustomTheme = useSettingsStore(s => s.removeCustomTheme);

  // 编辑器状态
  const [editorState, setEditorState] = useState<{
    isOpen: boolean;
    initial?: CustomTheme;
    base?: CustomTheme;
  }>({ isOpen: false });

  // [新增] 删除确认弹窗的状态 (存储当前要删除的主题 ID，为 null 时关闭)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // =========================================================
  // 🟢 [修复关键] 
  // 1. 先生成内置主题列表
  // 2. 过滤：如果 customThemes 里已经有了同名 ID (即用户覆盖了内置主题)，
  //    则不显示内置的那个，只显示自定义的那个。
  // =========================================================
  const builtinThemes = Object.entries(TERMINAL_THEMES).map(([id, theme]) => ({
      id, 
      name: id.charAt(0).toUpperCase() + id.slice(1), 
      ...theme, 
      isBuiltin: true 
  })).filter(builtin => !customThemes[builtin.id]); 

  const allThemes: CustomTheme[] = [
    ...builtinThemes,
    ...Object.values(customThemes)
  ];

  const handleEdit = (theme: CustomTheme) => {
    if (theme.isBuiltin) {
      // 引导复制
      setEditorState({ isOpen: true, base: theme });
    } else {
      // 直接编辑
      setEditorState({ isOpen: true, initial: theme });
    }
  };

  // [修改] 点击删除按钮只触发状态变更
  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
  };

  // [新增] 实际执行删除
  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      removeCustomTheme(deleteTargetId);
      setDeleteTargetId(null); // 关闭弹窗
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {allThemes.map(theme => (
          <div 
            key={theme.id} 
            className="group relative border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:border-blue-500 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm truncate pr-2">{theme.name}</span>
              {theme.isBuiltin ? (
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 shrink-0">Built-in</span>
              ) : (
                  <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded shrink-0">User</span>
              )}
            </div>
            
            {/* 颜色预览条 */}
            <div className="flex h-3 rounded-full overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
               <div style={{width: '20%', background: theme.background}} />
               <div style={{width: '20%', background: theme.foreground}} />
               <div style={{width: '20%', background: theme.blue}} />
               <div style={{width: '20%', background: theme.green}} />
               <div style={{width: '20%', background: theme.red}} />
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEdit(theme)} title={theme.isBuiltin ? "Copy & Edit" : "Edit"}>
                {theme.isBuiltin ? <Copy className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
              </Button>
              {!theme.isBuiltin && (
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 text-red-500 hover:text-red-600" 
                    // [修改] 调用新的点击处理函数
                    onClick={() => handleDeleteClick(theme.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
        
        {/* 新增按钮 */}
        <button 
          onClick={() => setEditorState({ isOpen: true, base: allThemes[0] })}
          className="flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-blue-500 min-h-[88px]"
        >
          <Plus className="w-6 h-6 mb-1" />
          <span className="text-xs">{t('settings.theme.add', 'Add New')}</span>
        </button>
      </div>

      {/* 主题编辑器弹窗 */}
      <ThemeEditorModal 
        isOpen={editorState.isOpen}
        onClose={() => setEditorState({ isOpen: false })}
        onSave={(theme) => {
            if (customThemes[theme.id]) {
                updateCustomTheme(theme);
            } else {
                addCustomTheme(theme);
            }
        }}
        initialTheme={editorState.initial}
        baseTheme={editorState.base}
      />

      {/* [新增] 删除确认弹窗 */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title={t('settings.theme.deleteConfirmTitle', 'Delete Theme')}
        description={t('settings.theme.deleteConfirmDesc', 'Are you sure you want to delete this custom theme? This action cannot be undone.')}
        confirmText={t('common.delete', 'Delete')}
        cancelText={t('common.cancel', 'Cancel')}
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};