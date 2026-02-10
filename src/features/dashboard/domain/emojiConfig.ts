// 🟢 1. 定义支持的规则类型
export type EmojiRuleType = 'date' | 'time' | 'default';

// 🟢 2. 定义规则接口，将 tooltip 改为 tooltipKey 方便本地化
export interface EmojiRule {
  type: EmojiRuleType;
  value: string;
  emoji: string;
  tooltipKey: string; // 存储 i18n 的 key
}

/**
 * 每日 Emoji 规则配置
 * 优先级说明：日期匹配 > 时间段匹配 > 默认值
 */
export const EMOJI_CONFIG: EmojiRule[] = [
  // 日期匹配 (MM-dd)
  { type: 'date', value: '01-01', emoji: '🎆', tooltipKey: 'dashboard.emoji.rules.newYear' },
  { type: 'date', value: '12-25', emoji: '🎄', tooltipKey: 'dashboard.emoji.rules.christmas' },
  
  // 时间匹配 (HH:mm)
  { type: 'time', value: '06:00-11:59', emoji: '☕', tooltipKey: 'dashboard.emoji.rules.morning' },
  { type: 'time', value: '12:00-13:00', emoji: '🍱', tooltipKey: 'dashboard.emoji.rules.lunch' },
  { type: 'time', value: '13:01-18:00', emoji: '👨‍💻', tooltipKey: 'dashboard.emoji.rules.afternoon' },
  { type: 'time', value: '18:01-23:59', emoji: '🌙', tooltipKey: 'dashboard.emoji.rules.evening' },
  { type: 'time', value: '00:00-05:59', emoji: '🦉', tooltipKey: 'dashboard.emoji.rules.lateNight' },
  
  // 兜底默认值
  { type: 'default', value: 'default', emoji: '🚀', tooltipKey: 'dashboard.emoji.rules.default' },
];

/**
 * 🟢 3. 统一配置彩蛋爆发时弹跳的 Emoji 池
 * 你可以在这里随意增加或删除彩蛋 Emoji
 */
export const BOUNCE_EMOJI_POOL = [
    '🦄', '🤖', '⚡️', '🐻🐼🐻‍❄️', '✨', '🔥', '🌸', '🚀', 
    '😎', '🤪', '💻', '🎨', '🍕', '💎', '🐱'
];