import { useState, useCallback } from "react";
import { toast } from "sonner"; // 假设使用 sonner，如不同请修改
import { useTranslation } from "react-i18next";

// Termite 字段映射表 (逻辑部分)
const TERMITE_MAPPING: Record<string, string> = {
  'background': 'background',
  'foreground': 'foreground',
  'cursor': 'cursor',
  'color0': 'black',
  'color1': 'red',
  'color2': 'green',
  'color3': 'yellow',
  'color4': 'blue',
  'color5': 'magenta',
  'color6': 'cyan',
  'color7': 'white',
  'color8': 'brightBlack',
  'color9': 'brightRed',
  'color10': 'brightGreen',
  'color11': 'brightYellow',
  'color12': 'brightBlue',
  'color13': 'brightMagenta',
  'color14': 'brightCyan',
  'color15': 'brightWhite',
};

// 颜色标准化工具
export const normalizeToHex = (color: string | undefined): string => {
  if (!color) return '#000000';
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) {
    if (trimmed.length === 7) return trimmed;
    if (trimmed.length === 4) return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
    if (trimmed.length > 7) return trimmed.substring(0, 7);
    return trimmed.padEnd(7, '0');
  }
  // 简单的 RGB 处理
  if (trimmed.startsWith('rgb')) {
     const nums = trimmed.match(/\d+/g);
     if (nums && nums.length >= 3) {
        const r = parseInt(nums[0]).toString(16).padStart(2, '0');
        const g = parseInt(nums[1]).toString(16).padStart(2, '0');
        const b = parseInt(nums[2]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
     }
  }
  return '#000000';
};

interface ImportResult {
  colors: Record<string, string>;
  success: boolean;
}

export const useThemeImport = () => {
  const { t } = useTranslation();
  const [isImporting, setIsImporting] = useState(false);

  const validateFile = (file: File): boolean => {
    // 1. 限制大小 (例如最大 50KB)
    const MAX_SIZE = 50 * 1024; 
    if (file.size > MAX_SIZE) {
      toast.error(t('settings.theme.importErrorSize', 'File is too large (max 50KB)'));
      return false;
    }

    // 2. 限制扩展名 (可选，Termite 配置有时没有扩展名或为 .config, .ini)
    const allowedExtensions = ['.config', '.ini', '.txt'];
    const hasExtension = file.name.includes('.');
    if (hasExtension) {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
         // 这里可以是个警告而不是错误，因为 Linux 配置文件经常没后缀
         console.warn("Unusual file extension:", ext);
      }
    }

    return true;
  };

  const parseContent = (content: string): Record<string, string> => {
    const lines = content.split(/\r?\n/);
    const extractedColors: Record<string, string> = {};
    let validCount = 0;

    lines.forEach(line => {
      const trimmedLine = line.trim();

      // 跳过空行、注释行 (# 或 ;) 和 Section 标题
      if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith(';') || trimmedLine.startsWith('[')) {
        return;
      }

      // 必须包含等号
      if (!trimmedLine.includes('=')) return;

      const equalIndex = trimmedLine.indexOf('=');
      const keyRaw = trimmedLine.substring(0, equalIndex).trim();
      let valueRaw = trimmedLine.substring(equalIndex + 1).trim();

      // 处理行内注释
      if (valueRaw.includes(' ')) {
         const parts = valueRaw.split(/\s+/);
         valueRaw = parts[0]; 
      }
      
      const appKey = TERMITE_MAPPING[keyRaw];
      if (appKey && valueRaw) {
        const colorVal = valueRaw.replace(/['"]/g, '');
        extractedColors[appKey] = normalizeToHex(colorVal);
        validCount++;
      }
    });

    if (validCount === 0) {
      throw new Error("No valid color configuration found");
    }

    return extractedColors;
  };

  const importFromFile = useCallback(async (file: File): Promise<ImportResult> => {
    setIsImporting(true);
    
    try {
      if (!validateFile(file)) {
        return { colors: {}, success: false };
      }

      const text = await file.text();
      // 3. 验证内容是否为空
      if (!text.trim()) {
        toast.error(t('settings.theme.importErrorEmpty', 'File is empty'));
        return { colors: {}, success: false };
      }

      const parsedColors = parseContent(text);
      
      toast.success(t('settings.theme.importSuccess', 'Theme imported successfully'));
      return { colors: parsedColors, success: true };

    } catch (error) {
      console.error("Theme import failed:", error);
      toast.error(t('settings.theme.importErrorParse', 'Failed to parse theme file format'));
      return { colors: {}, success: false };
    } finally {
      setIsImporting(false);
    }
  }, [t]);

  return {
    importFromFile,
    isImporting
  };
};