import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { invoke } from '@tauri-apps/api/core';
import { toast } from "sonner";
import { ask, save, open } from '@tauri-apps/plugin-dialog'; // 🟢 [修改] 引入 save, open
import { useSettingsStore } from "./useSettingsStore";
import { 
  WebDavFormValues, 
  CloudBackupFile, 
  BackupState 
} from "../domain/backup";

export const useBackupLogic = () => {
  const { t } = useTranslation();
  const settings = useSettingsStore(s => s.settings);
  const updateSettings = useSettingsStore(s => s.updateSettings);

  const [state, setState] = useState<BackupState>({
    isTesting: false,
    isBackingUp: false,
    isLoadingList: false,
    isDeleting: false,
    isConfigured: !!settings['backup.webdavUrl'] && !!settings['backup.username'],
    historyOpen: false,
    confirmOpen: false,
    backupList: [],
    selectedBackup: null,
    // 🟢 [新增] 初始化本地操作状态
    isExporting: false,
    isImporting: false,
  });

  const updateState = (updates: Partial<BackupState>) => 
    setState(prev => ({ ...prev, ...updates }));

  const form = useForm<WebDavFormValues>({
    defaultValues: {
      webdavUrl: settings['backup.webdavUrl'] || "",
      username: settings['backup.username'] || "",
      password: "" 
    },
    mode: 'onBlur'
  });

  useEffect(() => {
      form.setValue('webdavUrl', settings['backup.webdavUrl'] || '');
      form.setValue('username', settings['backup.username'] || '');
      updateState({ isConfigured: !!settings['backup.webdavUrl'] && !!settings['backup.username'] });
  }, [settings, form]);

  // --- Cloud Actions (Existing) ---

  const fetchBackupList = useCallback(async () => {
    const url = settings['backup.webdavUrl'];
    const username = settings['backup.username'];
    
    if (!url || !username) return;

    updateState({ isLoadingList: true });
    try {
      const list = await invoke<CloudBackupFile[]>('get_backup_list', { 
        url, 
        username, 
        password: null 
      });
      const sortedList = list.sort((a, b) => b.name.localeCompare(a.name));
      updateState({ backupList: sortedList });
    } catch (e) {
      console.error(e);
      toast.error(t('settings.backup.loadHistoryFailed', `Failed to load history: ${e}`));
    } finally {
      updateState({ isLoadingList: false });
    }
  }, [settings, t]);

  const handleDeleteBackup = async (filename: string) => {
    updateState({ isDeleting: true });
    try {
      const url = settings['backup.webdavUrl'];
      const username = settings['backup.username'];
      
      await invoke('delete_cloud_backup', {
        url,
        username,
        password: null,
        filename
      });
      
      toast.success(t('common.deletedSuccess', "Deleted successfully"));
      await fetchBackupList(); 
    } catch (e) {
      toast.error(t('common.deleteFailed', `Delete failed: ${e}`));
    } finally {
      updateState({ isDeleting: false });
    }
  };

  const handleSaveAndTest = async () => {
    updateState({ isTesting: true });
    try {
      const { webdavUrl, username, password } = form.getValues();
      
      if (!webdavUrl || !username) {
        toast.error(t('settings.backup.missing', 'Please fill URL and Username'));
        return;
      }

      if (password) {
        await invoke('save_webdav_password', { password });
        form.setValue('password', '');
        toast.success(t('settings.backup.saved', 'Credentials secured locally'));
      }

      await invoke('check_webdav', { 
        url: webdavUrl, 
        username, 
        password: password || null 
      });

      updateSettings({
        'backup.webdavUrl': webdavUrl,
        'backup.username': username,
      });

      toast.success(t('settings.backup.connected', 'Connection successful'));
    } catch (e) {
      console.error(e);
      toast.error(t('settings.backup.connectionFailed', `Connection failed: ${e}`));
    } finally {
      updateState({ isTesting: false });
    }
  };

  const handleManualBackup = async () => {
    updateState({ isBackingUp: true });
    try {
      const url = settings['backup.webdavUrl'];
      const username = settings['backup.username'];
      if(!url || !username) throw new Error("WebDAV not configured");

      const deviceName = settings['general.deviceName'] || 'Unknown Device';
      const deviceId = settings['general.deviceId'] || 'unknown-id';

      await invoke('create_cloud_backup', { 
        url, 
        username, 
        password: null,
        deviceName, 
        deviceId
      });
      
      toast.success(t('settings.backup.backupSuccess', "Backup uploaded successfully"));
      fetchBackupList();
    } catch (e) {
      toast.error(t('settings.backup.backupFailed', `Backup failed: ${e}`));
    } finally {
      updateState({ isBackingUp: false });
    }
  };

  const onConfirmRestore = async () => {
      const url = settings['backup.webdavUrl'];
      const username = settings['backup.username'];
      
      if (!state.selectedBackup) {
         updateState({ confirmOpen: false });
         return;
      }

      const filename = state.selectedBackup.name; 
      const currentDeviceName = settings['general.deviceName'];

      if (currentDeviceName && filename.includes('backup_') && !filename.includes(currentDeviceName)) {
         const match = filename.match(/backup_(.*?)_\d+\.json/);
         const sourceDevice = match ? match[1] : "another device";

         const yes = await ask(
             t('settings.backup.overwriteWarningBody', 
               `This backup appears to be from "${sourceDevice}".\nRestoring it will overwrite your current data on "${currentDeviceName}".\n\nAre you sure you want to continue?`, 
               { source: sourceDevice, current: currentDeviceName }
             ), 
             {
                 title: t('settings.backup.overwriteWarningTitle', '⚠️ Different Device Detected'),
                 kind: 'warning',
                 okLabel: t('common.confirm', 'Overwrite'),
                 cancelLabel: t('common.cancel', 'Cancel')
             }
         );

         if (!yes) {
             updateState({ confirmOpen: false });
             return; 
         }
      }

      try {
          await invoke('restore_cloud_backup', {
              url,
              username,
              password: null,
              filename: state.selectedBackup.name
          });
          toast.success(t('settings.backup.restoreSuccess', "Restore successful. Please restart app."));
      } catch(e) {
          toast.error(t('settings.backup.restoreFailed', `Restore failed: ${e}`));
      }
      updateState({ confirmOpen: false });
  };

  // --- 🟢 Local Actions (New) ---

  const handleLocalExport = async () => {
    updateState({ isExporting: true });
    try {
      // 生成默认文件名: backup_20240101.zip
      const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, "");
      const defaultName = `backup_${dateStr}.zip`;

      const filePath = await save({
        filters: [{ name: 'Backup Archive', extensions: ['zip'] }],
        defaultPath: defaultName
      });

      if (!filePath) return;

      // 调用后端导出命令
      await invoke('export_local_backup', { targetPath: filePath });

      toast.success(t('settings.backup.exportSuccess', 'Backup exported successfully'));
    } catch (e) {
      console.error(e);
      toast.error(t('settings.backup.exportFailed', `Export failed: ${e}`));
    } finally {
      updateState({ isExporting: false });
    }
  };

  const handleLocalImport = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Backup Archive', extensions: ['zip'] }]
      });

      if (!selected) return;
      
      const filePath = typeof selected === 'string' ? selected : selected[0];

      // 覆盖确认
      const confirmed = await ask(
          t('settings.backup.warningDesc', 'This will overwrite current data. Continue?'), 
          { 
            title: t('settings.backup.warningTitle', 'Warning'), 
            kind: 'warning',
            okLabel: t('common.confirm', 'Overwrite'),
            cancelLabel: t('common.cancel', 'Cancel')
          }
      );
      if (!confirmed) return;

      updateState({ isImporting: true });

      // 调用后端导入命令
      await invoke('import_local_backup', { filePath });

      toast.success(t('settings.backup.restoreSuccess', 'Restored successfully. Please restart.'));
    } catch (e) {
      console.error(e);
      toast.error(t('settings.backup.restoreFailed', `Restore failed: ${e}`));
    } finally {
      updateState({ isImporting: false });
    }
  };

  return {
    t,
    form,
    settings,
    state,
    actions: {
      handleSaveAndTest,
      handleManualBackup,
      handleDeleteBackup,
      
      // 🟢 导出新动作
      handleLocalExport,
      handleLocalImport,
      
      openHistory: () => { 
          updateState({ historyOpen: true }); 
          fetchBackupList(); 
      },
      closeHistory: () => updateState({ historyOpen: false }),
      
      selectRestore: (file: CloudBackupFile | null) => 
        updateState({ selectedBackup: file, historyOpen: false, confirmOpen: true }),
      
      closeConfirm: () => updateState({ confirmOpen: false }),
      performRestore: onConfirmRestore, 

      setInterval: (val: string) => updateSettings({ 'backup.interval': val }),
      toggleAutoBackup: (v: boolean) => updateSettings({ 'backup.autoBackup': v }),
    }
  };
};