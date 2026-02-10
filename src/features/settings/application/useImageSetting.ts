import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { writeFile, readFile, mkdir, BaseDirectory, exists, remove } from '@tauri-apps/plugin-fs';

export const useImageSetting = (value: any, onChange: (val: any) => void) => {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 加载预览图逻辑
  useEffect(() => {
    let activeUrl: string | null = null;
    let isActive = true;

    const loadPreview = async () => {
      if (!value) {
        if (isActive) setPreviewUrl(null);
        return;
      }
      // 兼容旧数据 (Base64) 或网络图片
      if (typeof value === 'string' && (value.startsWith('data:') || value.startsWith('http'))) {
        if (isActive) setPreviewUrl(value);
        return;
      }

      try {
        // 读取 AppConfig 下的文件
        const bytes = await readFile(value, { baseDir: BaseDirectory.AppConfig });
        const blob = new Blob([bytes]);
        activeUrl = URL.createObjectURL(blob);
        
        if (isActive) setPreviewUrl(activeUrl);
      } catch (e) {
        console.error("Failed to load image blob:", e);
        if (isActive) setPreviewUrl(null);
      }
    };

    loadPreview();

    return () => {
      isActive = false;
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, [value]);

  // 2. 处理文件上传
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const limit = 10 * 1024 * 1024; // 10MB
    if (file.size > limit) {
      toast.error(t('settings.appearance.imageTooLarge', 'Image too large (Max 10MB)'));
      return;
    }

    setIsProcessing(true);
    try {
      const targetDir = 'data/background';
      
      // 检查/创建目录
      const dirExists = await exists(targetDir, { baseDir: BaseDirectory.AppConfig });
      if (!dirExists) {
        await mkdir(targetDir, { baseDir: BaseDirectory.AppConfig, recursive: true });
      }

      // 写入文件
      const buffer = await file.arrayBuffer();
      const ext = file.name.substring(file.name.lastIndexOf('.')) || '.png';
      const relativePath = `${targetDir}/bg_${Date.now()}${ext}`;

      await writeFile(relativePath, new Uint8Array(buffer), { baseDir: BaseDirectory.AppConfig });

      // 清理旧文件
      if (value && typeof value === 'string' && !value.startsWith('data:') && !value.startsWith('http')) {
        try {
          await remove(value, { baseDir: BaseDirectory.AppConfig });
        } catch (ignore) {}
      }

      onChange(relativePath);
      toast.success(t('common.success', 'Saved'));

    } catch (err) {
      console.error(err);
      toast.error("Failed to save image");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 3. 清除图片
  const handleClear = async () => {
    if (value && typeof value === 'string' && !value.startsWith('data:') && !value.startsWith('http')) {
      try {
        await remove(value, { baseDir: BaseDirectory.AppConfig });
      } catch (e) { console.error(e); }
    }
    onChange(null);
  };

  const triggerUpload = () => fileInputRef.current?.click();

  return {
    previewUrl,
    isProcessing,
    fileInputRef,
    handleUpload,
    handleClear,
    triggerUpload
  };
};