use ssh2::{Channel, Session};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// 管理 SSH 连接状态
pub struct SshConnection {
    /// Shell 专用 (非阻塞，有读取线程在跑)
    pub shell_channel: Arc<Mutex<Channel>>,

    /// Monitor 专用 (阻塞，空闲状态，随时可用)
    /// Option 用于容错，允许监控连接建立失败
    pub monitor_session: Arc<Mutex<Option<Session>>>,
    // 2. [新增] SFTP 专用 Session (文件管理)
    pub sftp_session: Arc<Mutex<Option<Session>>>,
}

#[derive(Default)]
pub struct SshState {
    pub sessions: Arc<Mutex<HashMap<String, SshConnection>>>,
}
