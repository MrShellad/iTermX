// src/features/keys/types.ts

// [新增] 导出缺失的类型
export type VaultStatus = 'uninitialized' | 'locked' | 'unlocked';
export type ViewMode = 'grid' | 'list';

export type KeyType = 'password' | 'private_key';

export interface KeyEntry {
    id: string;
    name: string;
    type: KeyType;
    content: string; 
    username?: string;
    salt: string;
    // 🟢 [新增] 字段
    algorithm?: string; // 可选，因为旧数据可能没有，或者密码类型没有算法
    createdAt: number;
    updatedAt: number;
    lastUsed?: {
        serverName: string;
        serverIp: string;
        timestamp: number;
    };
}

// [必须存在]
export interface DecryptedData {
    val: string;   // 对应 Key Content
    pass?: string; // 对应 Passphrase
}

// 🟢 [新增] 关联检查返回的类型
export interface KeyAssociation {
    serverId: string;
    serverName: string;
    lastUsedAt: number | null;
}

export interface KeyUsageStats {
    keyId: string;
    totalCount: number;
    associatedServers: KeyAssociation[];
}