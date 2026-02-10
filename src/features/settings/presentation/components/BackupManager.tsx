import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useBackupLogic } from "../../application/useBackupLogic"; 

// Sub Components
import { WebDavConfigCard } from "./backup/WebDavConfigCard";
import { CloudActionsCard } from "./backup/CloudActionsCard";
import { BackupHistoryModal } from "./backup/BackupHistoryModal";

export const BackupManager = () => {
  const { t, form, settings, state, actions } = useBackupLogic();

  return (
    // 🟢 [修改] 调整宽度为 max-w-4xl，适应并排布局
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-10">
      
      {/* 1. WebDAV Settings (Full Width) */}
      <div className="w-full">
        <WebDavConfigCard 
          t={t}
          form={form}
          settings={settings}
          isConfigured={state.isConfigured}
          isTesting={state.isTesting}
          onSave={actions.handleSaveAndTest}
          onToggleAuto={actions.toggleAutoBackup}
          onIntervalChange={actions.setInterval}
        />
      </div>

      {/* 2. Actions Row (Split 50/50 inside component, aligned with above) */}
      <div className="w-full">
        <CloudActionsCard 
          t={t}
          isBackingUp={state.isBackingUp}
          isExporting={state.isExporting}
          isImporting={state.isImporting}
          onManualBackup={actions.handleManualBackup}
          onOpenHistory={actions.openHistory}
          onRestoreLatest={() => actions.selectRestore(null)}
          onExportLocal={actions.handleLocalExport}
          onImportLocal={actions.handleLocalImport}
        />
      </div>

      {/* Modals */}
      <BackupHistoryModal 
        t={t}
        isOpen={state.historyOpen}
        onClose={actions.closeHistory}
        isLoading={state.isLoadingList}
        isDeleting={state.isDeleting}
        isConfigured={state.isConfigured}
        backupList={state.backupList}
        onRestore={actions.selectRestore}
        onDelete={actions.handleDeleteBackup}
      />

      <ConfirmDialog
        open={state.confirmOpen}
        onOpenChange={actions.closeConfirm}
        title={t('settings.backup.warningTitle', 'Warning: Data Overwrite')}
        description={t('settings.backup.warningDesc', 'This action will completely overwrite your current local settings and database. Unsaved changes will be lost. Are you sure?')}
        variant="destructive"
        confirmText={t('settings.backup.confirm', 'Confirm Restore')}
        cancelText={t('common.cancel', 'Cancel')}
        onConfirm={actions.performRestore}
      />
    </div>
  );
};