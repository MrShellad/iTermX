import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { writeFile, readFile, mkdir, BaseDirectory, exists, remove } from '@tauri-apps/plugin-fs';

export const useWallpaperActions = (currentImage: string | null, onUpdate: (path: string | null) => void) => {
  const { t } = useTranslation();
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. 生成预览图 Blob URL
  useEffect(() => {
    let activeUrl: string | null = null;
    let isActive = true;

    const load = async () => {
      if (!currentImage) { 
        if(isActive) setPreviewSrc(null); 
        return; 
      }
      if (currentImage.startsWith('data:') || currentImage.startsWith('http')) {
        if(isActive) setPreviewSrc(currentImage);
      } else {
        try {
          const bytes = await readFile(currentImage, { baseDir: BaseDirectory.AppConfig });
          const blob = new Blob([bytes]);
          activeUrl = URL.createObjectURL(blob);
          if(isActive) setPreviewSrc(activeUrl);
        } catch (e) {
          console.error("Failed to load wallpaper preview:", e);
          if(isActive) setPreviewSrc(null);
        }
      }
    };
    load();
    return () => { 
      isActive = false;
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, [currentImage]);

  // 2. 处理上传
  const handleUpload = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('settings.appearance.imageTooLarge', 'Image too large (Max 10MB)'));
      return;
    }

    setIsProcessing(true);
    try {
      const targetDir = 'data/background';
      const dirExists = await exists(targetDir, { baseDir: BaseDirectory.AppConfig });
      if (!dirExists) {
        await mkdir(targetDir, { baseDir: BaseDirectory.AppConfig, recursive: true });
      }
      
      const buffer = await file.arrayBuffer();
      const ext = file.name.substring(file.name.lastIndexOf('.')) || '.png';
      const relativePath = `${targetDir}/bg_${Date.now()}${ext}`;
      
      await writeFile(relativePath, new Uint8Array(buffer), { baseDir: BaseDirectory.AppConfig });
      
      // 清理旧文件
      if (currentImage && !currentImage.startsWith('data:') && !currentImage.startsWith('http')) {
        try { await remove(currentImage, { baseDir: BaseDirectory.AppConfig }); } catch {}
      }
      
      onUpdate(relativePath);
      toast.success(t('settings.appearance.saved', "Wallpaper saved"));
    } catch (err) {
      console.error(err);
      toast.error(t('settings.appearance.error', "Failed to save wallpaper"));
    } finally {
      setIsProcessing(false);
    }
  }, [currentImage, onUpdate, t]);

  // 3. 清理
  const handleClear = useCallback(async () => {
    if (currentImage && !currentImage.startsWith('data:') && !currentImage.startsWith('http')) {
      try { await remove(currentImage, { baseDir: BaseDirectory.AppConfig }); } catch {}
    }
    onUpdate(null);
  }, [currentImage, onUpdate]);

  return { previewSrc, isProcessing, handleUpload, handleClear };
};