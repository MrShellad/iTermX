export type AuthType = 'password' | 'key';
export type ConnectionType = 'direct' | 'http' | 'socks5';
export type ServerStatus = 'connected' | 'disconnected' | 'connecting';

export interface Server {
  id: string;
  name: string;
  provider?: string;
  
  ip: string;
  port: number;
  os: string;
  icon: string;
  username: string;
  
  authType: AuthType;

  connectionType: ConnectionType;
  proxyId?: string;
  // 修正拼写
  privateKey?: string; 
  passphrase?: string;
  password?: string; 

  passwordSource?: 'manual' | 'store';
  keySource?: 'manual' | 'store';

  passwordId?: string; 
  keyId?: string;
  
  tags: string[];
  sort: number;
  
  // [修改] 统一改为 CamelCase 以匹配后端 JSON 和前端习惯
  isPinned: boolean; 
  
  enableExpiration: boolean;
  expireDate?: string;
  
  createdAt: number;
  updatedAt: number;
  lastConnectedAt?: number;
  // 🟢 [新增] 必须补全这 4 个字段
  connectTimeout?: number;
  keepAliveInterval?: number;
  autoReconnect?: boolean;
  maxReconnects?: number;
}

export interface ProxyItem {
  id: string;
  name: string;             // 代理名称 (例如: "Office VPN", "Local Clash")
  type: 'http' | 'socks5';  // 代理自身的类型 (用于列表筛选)
  host: string;
  port: number;
  username?: string;        // 可选: 代理认证用户名
  password?: string;        // 可选: 代理认证密码 (加密存储)
}