export interface DashboardSettings {
  backgroundImage: string | null; // null 使用默认
  blur: number; // 0-20px
  brightness: number; // 0.1 - 1.0
  showEmoji: boolean;
}

export interface SponsorCardData {
  id: string;
  title: string;
  desc: string;
  link?: string;
  isDonation?: boolean; // 第一个是捐赠
  bgGradient?: string;
  iconName?: string;
}

// Emoji 配置结构
export interface EmojiRule {
  type: 'date' | 'time' | 'default';
  value: string; // "12-25" or "08:00-12:00" or "default"
  emoji: string;
  tooltip: string;
}
// [新增] API 响应结构
export interface SponsorResponse {
  donors: Donor[];
  sponsors: SponsorCardData[];
}
// [新增] 捐赠者结构
export interface Donor {
  name: string;
  score?: number; // 贡献值/金额，用于排序
  url?: string;   // 可选：点击跳转到个人主页
}