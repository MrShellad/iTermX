// src/features/settings/domain/backup.ts

export interface WebDavFormValues {
  webdavUrl: string;
  username: string;
  password?: string; // 仅在输入时存在，不回显
}

export interface CloudBackupFile {
  name: string;
  date: string;
  size: string;
}

// 定义整个 UI 的状态形状
export interface BackupState {
  isTesting: boolean;
  isBackingUp: boolean;
  isLoadingList: boolean;
  isDeleting: boolean;
  isConfigured: boolean;
  
  // 弹窗状态
  historyOpen: boolean;
  confirmOpen: boolean;
  
  // 数据
  backupList: CloudBackupFile[];
  selectedBackup: CloudBackupFile | null;
  // 🟢 [新增] 本地操作状态
  isExporting: boolean;
  isImporting: boolean;
}