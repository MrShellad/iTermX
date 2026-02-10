// src/features/fs/editor/config.ts

export const SUPPORTED_EDITOR_EXTENSIONS: Record<string, string> = {
    // Web
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'svg': 'xml',
    
    // Config
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'ini': 'ini',
    'conf': 'ini',
    'env': 'properties',
    'properties': 'properties',
    'dockerfile': 'dockerfile',
    
    // Scripts / Code
    'sh': 'shell',
    'bash': 'shell',
    'py': 'python',
    'rs': 'rust',
    'go': 'go',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'cpp',
    'java': 'java',
    'php': 'php',
    'rb': 'ruby',
    'lua': 'lua',
    'sql': 'sql',
    
    // Text
    'txt': 'plaintext',
    'md': 'markdown',
    'log': 'plaintext'
};

// 检查文件是否可编辑
export const isEditable = (fileName: string): boolean => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return Object.prototype.hasOwnProperty.call(SUPPORTED_EDITOR_EXTENSIONS, ext);
};

// 获取对应的 Monaco Language
export const getLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return SUPPORTED_EDITOR_EXTENSIONS[ext] || 'plaintext';
};