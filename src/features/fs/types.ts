// 文件基本信息
export interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  size: number; // 字节
  lastModified: number; // 时间戳
  permissions: string; // rwxr-xr-x
  owner: string;
  group: string;
  extension: string; // 用于匹配图标
}

// 排序选项
export type SortField = 'name' | 'size' | 'lastModified' | 'type';
export type SortOrder = 'asc' | 'desc';

// 传输任务状态
export type TransferStatus = 'pending' | 'processing' | 'completed' | 'error' | 'canceled';

// 传输任务项 (上传/下载)
export interface TransferItem {
  id: string;
  type: 'upload' | 'download';
  name: string;
  localPath: string;
  remotePath: string;
  size: number;
  transferred: number; // 已传输字节
  speed: number; // bytes/s
  progress: number; // 0-100
  status: TransferStatus;
  startTime: number;
  error?: string;
}