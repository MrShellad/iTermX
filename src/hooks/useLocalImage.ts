import { useState, useEffect } from "react";
import { readFile, BaseDirectory } from "@tauri-apps/plugin-fs";

/**
 * 将本地文件路径转换为可显示的 URL (Blob URL)
 * @param path data/background/xxx.png 或 Base64 字符串
 */
export function useLocalImage(path: string | undefined | null) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    // 1. 空值处理
    if (!path) {
      setSrc(null);
      return;
    }

    // 2. 兼容旧数据 (Base64) 或网络图片 (http)
    if (path.startsWith("data:") || path.startsWith("http")) {
      setSrc(path);
      return;
    }

    // 3. 读取本地文件转 Blob
    let active = true;
    let objectUrl: string | null = null;

    const load = async () => {
      try {
        // 读取 AppConfig 下的文件 (例如: data/background/bg_123.png)
        const bytes = await readFile(path, { baseDir: BaseDirectory.AppConfig });
        const blob = new Blob([bytes]);
        objectUrl = URL.createObjectURL(blob);
        
        if (active) {
            setSrc(objectUrl);
        }
      } catch (error) {
        console.error("Failed to load background image:", error);
        if (active) setSrc(null);
      }
    };

    load();

    // 4. 清理内存
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  return src;
}