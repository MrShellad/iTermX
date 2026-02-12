// src/features/fs/utils/security.ts

// 默认敏感路径列表
// 后期这里可以改为从 useSettingsStore 获取用户自定义配置
const SENSITIVE_PATHS = [
    '/etc',
    '/boot',
    '/proc',
    '/sys',
    '/var/log',
    '/usr/bin',
    '/usr/sbin',
    '/root' // 对于非 root 用户可能是敏感的
];

/**
 * 检查当前路径是否属于敏感区域
 * 逻辑：只要当前路径以敏感路径开头，即视为敏感
 */
export const isSensitivePath = (currentPath: string): boolean => {
    if (!currentPath || currentPath === '/') return false;
    
    // 归一化路径，确保以 / 开头
    const normalized = currentPath.startsWith('/') ? currentPath : `/${currentPath}`;
    
    return SENSITIVE_PATHS.some(sensitive => 
        normalized === sensitive || normalized.startsWith(`${sensitive}/`)
    );
};