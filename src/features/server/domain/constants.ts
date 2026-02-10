import { 
  Server, Database, Cloud, Terminal, Globe, Cpu, HardDrive, Network, Box, Laptop 
} from "lucide-react";

// 图标映射表
export const ICON_MAP: Record<string, React.ElementType> = {
  server: Server,
  database: Database,
  cloud: Cloud,
  terminal: Terminal,
  globe: Globe,
  cpu: Cpu,
  harddrive: HardDrive,
  network: Network,
  box: Box,
  laptop: Laptop
};

export const DEFAULT_SSH_PORT = 22;