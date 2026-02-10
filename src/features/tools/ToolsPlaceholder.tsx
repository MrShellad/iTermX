import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Container, 
  Network, 
  Zap 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolPreview {
  id: string;
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  color: string;
}

const UPCOMING_TOOLS: ToolPreview[] = [
  {
    id: 'docker',
    icon: Container,
    titleKey: 'tools.upcoming.docker.title',
    descKey: 'tools.upcoming.docker.desc',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    id: 'network',
    icon: Network,
    titleKey: 'tools.upcoming.network.title',
    descKey: 'tools.upcoming.network.desc',
    color: 'from-indigo-500 to-purple-400',
  }
];

export const ToolsPlaceholder = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-700">
      {/* 头部标题 */}
      <div className="flex items-center gap-3 px-1">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Plus className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
            {t('tools.placeholder.title', 'Toolbox')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('tools.placeholder.subtitle', 'Extend your workflow with powerful utilities')}
          </p>
        </div>
      </div>

      {/* 功能预告网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {UPCOMING_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <div 
              key={tool.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300",
                "bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-white/40 dark:border-white/5",
                "hover:shadow-xl hover:-translate-y-1 hover:border-blue-500/30"
              )}
            >
              {/* 背景装饰渐变 */}
              <div className={cn(
                "absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20 bg-gradient-to-br",
                tool.color
              )} />

              <div className="relative z-10 space-y-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br",
                  tool.color
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {t(tool.titleKey)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {t(tool.descKey)}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  <Zap className="w-3 h-3 fill-current" />
                  {t('common.comingSoon', 'Coming Soon')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部引导 */}
{/* 底部引导 */}
<div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col items-center text-center space-y-2">
  <p className="text-sm text-slate-600 dark:text-slate-400">
    {t('tools.placeholder.footer', 'Have a specific tool in mind?')}
  </p>
  
  {/* 🟢 修改点：添加 mailto 链接 */}
  <a 
    href="mailto:chris@cabeu.edu.kg?subject=Feature%20Request%20-%20Toolbox"
    className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center gap-2"
  >
    {t('tools.placeholder.request', 'Request a Feature')}
    {/* 可选：增加一个小箭头的视觉引导 */}
    <span className="text-[10px]">→</span>
  </a>
</div>
    </div>
  );
};