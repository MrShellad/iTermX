// src-tauri/src/commands/monitor/network.rs
use super::MonitorCache;
use crate::commands::ssh::SshState;
use std::io::Read;
use std::time::Instant;
use std::collections::HashMap;
use tauri::State;

#[derive(Clone, Debug)]
pub struct NetIoStats {
    // 🟢 修改：存储每个网卡的流量快照，用于计算单网卡速率
    pub ifaces: HashMap<String, (u64, u64)>, 
    pub timestamp: Instant,
}

#[derive(serde::Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct InterfaceInfo {
    pub name: String,
    pub ipv4: Vec<String>,
    pub ipv6: Vec<String>,
    pub mac: String,
    pub status: String,    // 🟢 新增：UP / DOWN 状态
    pub rx_speed: u64,     // 🟢 新增：单网卡下行速率
    pub tx_speed: u64,     // 🟢 新增：单网卡上行速率
    pub total_rx: u64,     // 🟢 新增：单网卡总下行流量
    pub total_tx: u64,     // 🟢 新增：单网卡总上行流量
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteNetworkInfo {
    pub total_rx: u64,
    pub total_tx: u64,
    pub rx_speed: u64,
    pub tx_speed: u64,
    pub tcp_connections: u64, // 🟢 新增：TCP 总连接数
    pub interfaces: Vec<InterfaceInfo>,
}

#[tauri::command]
pub async fn get_ssh_network_info(
    ssh_state: State<'_, SshState>,
    monitor_cache: State<'_, MonitorCache>,
    id: String,
) -> Result<RemoteNetworkInfo, String> {
    let session_arc = {
        let map = ssh_state.sessions.lock().unwrap();
        match map.get(&id) {
            Some(conn) => conn.monitor_session.clone(),
            None => return Err("SSH connection not active".to_string()),
        }
    };

    let output = tauri::async_runtime::spawn_blocking(move || {
        let sess_guard = session_arc.lock().unwrap();
        let sess = match &*sess_guard {
            Some(s) => s,
            None => return Err("Monitor session unavailable".to_string()),
        };

        let mut channel = sess
            .channel_session()
            .map_err(|e: ssh2::Error| e.to_string())?;

        // 🟢 指令组合：流量 + 地址/状态 + TCP 连接数
        let cmd = "cat /proc/net/dev && echo '---SPLIT---' && ip addr && echo '---SPLIT---' && cat /proc/net/sockstat 2>/dev/null";

        channel.exec(cmd).map_err(|e: ssh2::Error| e.to_string())?;

        let mut s = String::new();
        channel.read_to_string(&mut s).ok();
        channel.wait_close().ok();
        Ok::<String, String>(s)
    })
    .await
    .map_err(|e| e.to_string())??;

    let parts: Vec<&str> = output.split("---SPLIT---").collect();
    if parts.len() < 3 {
        return Err("Invalid network data format".to_string());
    }

    // --- Part 1: TCP 连接数解析 ---
    let mut tcp_conn = 0;
    for line in parts[2].lines() {
        if line.starts_with("TCP: inuse") {
            tcp_conn = line.split_whitespace().nth(2).and_then(|v| v.parse().ok()).unwrap_or(0);
            break;
        }
    }

    // --- Part 2: 流量与单网卡速率计算 ---
    let now = Instant::now();
    let mut cache = monitor_cache.network_io.lock().unwrap();
    let prev_stats = cache.get(&id).cloned();
    let duration = prev_stats.as_ref().map(|p| now.duration_since(p.timestamp).as_secs_f64()).unwrap_or(0.0);

    let mut iface_traffic_map = HashMap::new();
    let (mut global_rx, mut global_tx, mut global_rx_speed, mut global_tx_speed) = (0, 0, 0, 0);

    for line in parts[0].lines().skip(2) {
        let clean_line = line.replace(':', " ");
        let fields: Vec<&str> = clean_line.split_whitespace().collect();
        if fields.len() < 10 { continue; }

        let name = fields[0].to_string();
        // 🟢 剔除 lo 和 br- 开头的网卡
        if name == "lo" || name.starts_with("br-") { continue; }

        let rx = fields[1].parse::<u64>().unwrap_or(0);
        let tx = fields[9].parse::<u64>().unwrap_or(0);

        let (mut rs, mut ts) = (0, 0);
        if let Some(prev) = &prev_stats {
            if let Some(&(p_rx, p_tx)) = prev.ifaces.get(&name) {
                if duration > 0.0 {
                    rs = ((rx.saturating_sub(p_rx)) as f64 / duration) as u64;
                    ts = ((tx.saturating_sub(p_tx)) as f64 / duration) as u64;
                }
            }
        }

        iface_traffic_map.insert(name.clone(), (rx, tx, rs, ts));
        global_rx += rx;
        global_tx += tx;
        global_rx_speed += rs;
        global_tx_speed += ts;
    }

    // 更新缓存
    let mut next_iface_cache = HashMap::new();
    for (name, (rx, tx, _, _)) in &iface_traffic_map {
        next_iface_cache.insert(name.clone(), (*rx, *tx));
    }
    cache.insert(id, NetIoStats { ifaces: next_iface_cache, timestamp: now });

    // --- Part 3: 地址与状态解析 ---
    let mut interfaces = Vec::new();
    let mut current_iface = InterfaceInfo::default();

    for line in parts[1].lines() {
        let trim_line = line.trim();
        // 识别新网卡块
        if !line.starts_with(' ') && line.contains(':') && line.chars().next().map_or(false, |c| c.is_numeric()) {
            if !current_iface.name.is_empty() {
                interfaces.push(current_iface);
            }
            current_iface = InterfaceInfo::default();
            
            let name_part = line.split(':').nth(1).unwrap_or("").trim();
            let name = name_part.split('@').next().unwrap_or(name_part).to_string();
            
            // 🟢 同样剔除 lo 和 br-
            if name == "lo" || name.starts_with("br-") {
                current_iface.name = String::new();
                continue;
            }

            current_iface.name = name.clone();
            // 🟢 提取状态 UP / DOWN
            current_iface.status = if line.contains("state UP") { "UP".into() } else { "DOWN".into() };

            // 填充流量与速率
            if let Some(&(rx, tx, rs, ts)) = iface_traffic_map.get(&name) {
                current_iface.total_rx = rx;
                current_iface.total_tx = tx;
                current_iface.rx_speed = rs;
                current_iface.tx_speed = ts;
            }
        } else if !current_iface.name.is_empty() {
            if trim_line.starts_with("link/ether") {
                current_iface.mac = trim_line.split_whitespace().nth(1).unwrap_or("").to_string();
            } else if trim_line.starts_with("inet ") {
                let ip = trim_line.split_whitespace().nth(1).and_then(|s| s.split('/').next()).unwrap_or("");
                current_iface.ipv4.push(ip.to_string());
            } else if trim_line.starts_with("inet6 ") {
                let ip = trim_line.split_whitespace().nth(1).and_then(|s| s.split('/').next()).unwrap_or("");
                current_iface.ipv6.push(ip.to_string());
            }
        }
    }
    if !current_iface.name.is_empty() {
        interfaces.push(current_iface);
    }

    Ok(RemoteNetworkInfo {
        total_rx: global_rx,
        total_tx: global_tx,
        rx_speed: global_rx_speed,
        tx_speed: global_tx_speed,
        tcp_connections: tcp_conn,
        interfaces,
    })
}