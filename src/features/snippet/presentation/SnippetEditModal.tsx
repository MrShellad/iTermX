import { useState, useEffect } from "react";
import { BaseModal } from "@/components/common/BaseModal";
import { Code2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Snippet, SnippetLanguage } from "../domain/types";
import { LanguageSelector } from "./LanguageSelector";
import { TagSelector } from "./TagSelector";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Snippet;
}

export const SnippetEditModal = ({ isOpen, onClose, onSubmit, initialData }: Props) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    language: 'text' as SnippetLanguage,
    code: '',
    tags: [] as string[]
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title,
          language: initialData.language,
          code: initialData.code,
          tags: initialData.tags
        });
      } else {
        setFormData({ title: '', language: 'text', code: '', tags: [] });
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = () => {
    if (!formData.title || !formData.code) return;

    const cleanTags = Array.from(new Set(
      formData.tags.map(t => t.trim()).filter(Boolean)
    ));

    onSubmit({
      title: formData.title,
      language: formData.language,
      code: formData.code,
      tags: cleanTags
    });
    onClose();
  };

  const modalTitle = initialData 
    ? t('snippet.fields.edit_title', 'Edit Snippet') 
    : t('snippet.fields.new_title', 'New Snippet');

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      icon={<Code2 className="w-5 h-5" />}
      className="max-w-4xl h-[85vh]"
      
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSubmit} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4" /> 
            {t('common.save', 'Save Snippet')}
          </Button>
        </>
      }
    >
      {/* 🟢 [布局核心] 
          1. -m-4: 抵消 BaseModal 默认的 padding 
          2. h-[calc(100%+2rem)]: 补回因负 margin 损失的高度，确保填满容器
          3. flex-row: 左右布局 
      */}
      <div className="flex flex-col md:flex-row h-[calc(100%+2rem)] -m-4">
        
        {/* === 左侧栏: 侧边栏风格 === */}
        {/* 1. bg-slate-50: 浅灰色背景，与右侧区分
           2. p-5: 统一的内边距，解决输入框左侧截断/贴边问题
        */}
        <div className="w-full md:w-[280px] flex flex-col gap-5 shrink-0 p-5 bg-slate-50/80 dark:bg-black/20 overflow-y-auto custom-scrollbar">
          
          {/* Title */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-500 ml-0.5">
              {t('snippet.fields.title', 'Title')}
            </label>
            <Input 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder={t('snippet.fields.title_placeholder', 'e.g. Docker Config')} 
              className="h-9 bg-white dark:bg-slate-900" // 显式白色背景，增加对比度
              autoFocus 
            />
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-0.5">
                {t('snippet.fields.language', 'Language')}
            </label>
            <LanguageSelector 
                value={formData.language}
                onChange={(val) => setFormData({...formData, language: val})}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-0.5">
                <label className="text-xs font-semibold text-slate-500">
                    {t('snippet.fields.tags', 'Tags')}
                </label>
                <span className={cn("text-[10px]", formData.tags.length >= 2 ? "text-amber-500" : "text-slate-400")}>
                    {formData.tags.length}/2
                </span>
            </div>
            <TagSelector 
              selectedTags={formData.tags}
              onChange={(newTags) => setFormData({...formData, tags: newTags})}
            />
          </div>

        </div>

        {/* === 右侧栏: 代码编辑区 === */}
        {/* p-5: 给予代码框舒适的边距 */}
        <div className="flex-1 flex flex-col min-h-[300px] min-w-0 p-5">
          <label className="text-xs font-semibold text-slate-500 mb-2 ml-0.5">
            {t('snippet.fields.code', 'Code Snippet')}
          </label>
          
          <Textarea 
            value={formData.code}
            onChange={e => setFormData({...formData, code: e.target.value})}
            className={cn(
               "font-mono text-xs leading-relaxed flex-1 resize-none p-3",
               "bg-white/50 dark:bg-slate-900/50", // 微透背景
               "focus:bg-white dark:focus:bg-slate-900 transition-colors"
            )}
            placeholder={t('snippet.fields.code_placeholder', '# Paste your code here...')}
          />
        </div>

      </div>
    </BaseModal>
  );
};