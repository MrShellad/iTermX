import { File, FileCode, FileImage, FileText, FileVideo, FileAudio, FileArchive, Folder } from "lucide-react";
import { clsx } from "clsx";

export const FolderIcon = ({ className }: { className?: string }) => {
  return <Folder className={clsx("fill-yellow-400 text-yellow-600", className)} />;
};

export const DefaultIcon = ({ className }: { className?: string }) => {
  return <File className={clsx("text-slate-400", className)} />;
};

export const FileIcon = ({ ext, className }: { ext: string; className?: string }) => {
  const c = clsx("w-5 h-5", className);
  
  // 简单的后缀匹配逻辑
  switch (ext.toLowerCase()) {
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <FileImage className={clsx(c, "text-purple-500")} />;
    
    case 'mp4':
    case 'mkv':
    case 'mov':
    case 'avi':
      return <FileVideo className={clsx(c, "text-red-500")} />;
    
    case 'mp3':
    case 'wav':
    case 'flac':
      return <FileAudio className={clsx(c, "text-pink-500")} />;
    
    case 'zip':
    case 'tar':
    case 'gz':
    case '7z':
    case 'rar':
      return <FileArchive className={clsx(c, "text-orange-500")} />;
    
    case 'js':
    case 'ts':
    case 'tsx':
    case 'jsx':
    case 'json':
    case 'html':
    case 'css':
    case 'py':
    case 'rs':
    case 'go':
    case 'c':
    case 'cpp':
    case 'sh':
    case 'yaml':
    case 'yml':
      return <FileCode className={clsx(c, "text-blue-500")} />;
      
    case 'txt':
    case 'md':
    case 'log':
      return <FileText className={clsx(c, "text-slate-500")} />;
      
    default:
      return <DefaultIcon className={c} />;
  }
};