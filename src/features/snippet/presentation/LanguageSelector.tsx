import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { FileCode, FileJson, Terminal, Hash, FileType, Database, Code2 } from "lucide-react";
import { SnippetLanguage } from "../domain/types";
import { useTranslation } from "react-i18next"; // [新增]

// 定义语言配置
const LANGUAGES: { value: SnippetLanguage; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: 'Plain Text', icon: <FileType className="w-4 h-4" /> },
  { value: 'typescript', label: 'TypeScript', icon: <FileCode className="w-4 h-4 text-blue-500" /> },
  { value: 'javascript', label: 'JavaScript', icon: <FileCode className="w-4 h-4 text-yellow-500" /> },
  { value: 'python', label: 'Python', icon: <Hash className="w-4 h-4 text-green-500" /> },
  { value: 'json', label: 'JSON', icon: <FileJson className="w-4 h-4 text-orange-500" /> },
  { value: 'sql', label: 'SQL', icon: <Database className="w-4 h-4 text-purple-500" /> },
  { value: 'bash', label: 'Bash / Shell', icon: <Terminal className="w-4 h-4 text-slate-500" /> },
  { value: 'html', label: 'HTML', icon: <Code2 className="w-4 h-4 text-red-500" /> },
  { value: 'css', label: 'CSS', icon: <Hash className="w-4 h-4 text-sky-500" /> },
];

interface Props {
  value: SnippetLanguage;
  onChange: (val: SnippetLanguage) => void;
}

export const LanguageSelector = ({ value, onChange }: Props) => {
  const { t } = useTranslation();

  return (
    <Select value={value} onValueChange={(v) => onChange(v as SnippetLanguage)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t('snippet.language.placeholder', 'Select Language')} />
      </SelectTrigger>
      
      {/* [关键修复] 添加 z-[200] 确保下拉菜单浮在 Modal(z-100) 之上 */}
      <SelectContent className="z-[200] max-h-[300px]">
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            <div className="flex items-center gap-2">
              {lang.icon}
              <span>{lang.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};