// src-tauri/src/commands/monitor/mod.rs

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

// 声明子模块
pub mod cpu;
pub mod disk;
pub mod info;
pub mod memory;
pub mod network;

// 重新导出命令，方便 lib.rs 调用
pub use cpu::get_ssh_cpu_info;
pub use disk::get_ssh_disk_info;
pub use info::get_ssh_os_info;
pub use memory::get_ssh_mem_info;
pub use network::get_ssh_network_info;
// === 共享状态定义 ===

// CpuTicks 属于 CPU 逻辑，但 MonitorCache 需要用到它
// 这里引用 cpu 模块中的定义
use cpu::CpuTicks;
use disk::DiskIoStats;
use network::NetIoStats;

pub struct MonitorCache {
    // Key: SSH Session ID
    pub history: Arc<Mutex<HashMap<String, CpuTicks>>>,
    // [新增] 磁盘 I/O 缓存: Key 是 SessionID
    pub disk_io: Arc<Mutex<HashMap<String, DiskIoStats>>>,
    // [新增] 网络缓存
    pub network_io: Arc<Mutex<HashMap<String, NetIoStats>>>,
}

impl MonitorCache {
    pub fn new() -> Self {
        Self {
            history: Arc::new(Mutex::new(HashMap::new())),
            disk_io: Arc::new(Mutex::new(HashMap::new())),
            network_io: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}
