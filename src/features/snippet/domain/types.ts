export type SnippetLanguage = 'typescript' | 'javascript' | 'python' | 'bash' | 'json' | 'sql' | 'html' | 'css' | 'text';

export interface Snippet {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: SnippetLanguage;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}