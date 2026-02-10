import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 引入拆分出来的语言包
import { zh } from './lang/zh';
import { en } from './lang/en';
import { ja } from './lang/ja';
import { zhTW } from './lang/zhTW';
import { vi } from './lang/vi';
i18n
  .use(initReactI18next)
  .init({
    // 组装资源
    resources: {
      zh,
      en,
      ja,
      zhTW,
      vi
    },
    lng: "zh", // 默认语言
    fallbackLng: "zh", 
    
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;