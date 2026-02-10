use super::MonitorCache;
use crate::commands::ssh::SshState;
use std::io::Read;
use tauri::State;

#[derive(Clone, Copy, Debug)]
pub struct CpuTicks {
    pub user: u64,
    pub nice: u64,
    pub system: u64,
    pub idle: u64,
    pub iowait: u64,
    pub irq: u64,
    pub softirq: u64,
    pub steal: u64,
}

impl CpuTicks {
    fn total(&self) -> u64 {
        self.user + self.nice + self.system + self.idle + self.iowait + self.irq + self.softirq + self.steal
    }
    // 桌面端常用的 active 计算逻辑 (包含 iowait 可能导致虚高，这里采用非空闲统计)
    fn active(&self) -> u64 {
        self.user + self.nice + self.system + self.irq + self.softirq + self.steal
    }

    fn from_line(line: &str) -> Option<Self> {
        let f: Vec<&str> = line.split_whitespace().collect();
        if f.len() < 9 { return None; }
        Some(CpuTicks {
            user: f[1].parse().unwrap_or(0),
            nice: f[2].parse().unwrap_or(0),
            system: f[3].parse().unwrap_or(0),
            idle: f[4].parse().unwrap_or(0),
            iowait: f[5].parse().unwrap_or(0),
            irq: f[6].parse().unwrap_or(0),
            softirq: f[7].parse().unwrap_or(0),
            steal: f[8].parse().unwrap_or(0),
        })
    }
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuBreakdown {
    pub user: f64, pub system: f64, pub iowait: f64, pub idle: f64,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteCpuInfo {
    pub model: String,
    pub physical_cores: usize,
    pub logical_threads: usize,
    pub usage: f64,
    pub load_avg: [f64; 3],
    pub breakdown: CpuBreakdown,
    pub per_core_usage: Vec<f64>,
}

#[tauri::command]
pub async fn get_ssh_cpu_info(
    ssh_state: State<'_, SshState>,
    monitor_cache: State<'_, MonitorCache>,
    id: String,
) -> Result<RemoteCpuInfo, String> {
    let session_arc = {
        let map = ssh_state.sessions.lock().unwrap();
        map.get(&id).map(|c| c.monitor_session.clone()).ok_or("SSH not active")?
    };

    let output = tauri::async_runtime::spawn_blocking(move || {
        let sess_guard = session_arc.lock().unwrap();
        let sess = sess_guard.as_ref().ok_or("Monitor session unavailable")?;
        let mut channel = sess.channel_session().map_err(|e| e.to_string())?;
        
        // 🟢 组合指令：模型、逻辑数、物理数、负载、CPU 统计
        let cmd = "grep 'model name' /proc/cpuinfo | head -1 | cut -d: -f2 && \
                   echo '---SPLIT---' && grep -c '^processor' /proc/cpuinfo && \
                   echo '---SPLIT---' && grep '^core id' /proc/cpuinfo | sort -u | wc -l && \
                   echo '---SPLIT---' && cat /proc/loadavg && \
                   echo '---SPLIT---' && cat /proc/stat | grep '^cpu'";
        
        channel.exec(cmd).map_err(|e| e.to_string())?;
        let mut s = String::new();
        channel.read_to_string(&mut s).ok();
        channel.wait_close().ok();
        Ok::<String, String>(s)
    }).await.map_err(|e| e.to_string())??;

    let parts: Vec<&str> = output.split("---SPLIT---").collect();
    if parts.len() < 5 { return Err("Invalid data format".into()); }

    let model = parts[0].trim().to_string();
    let logical_threads = parts[1].trim().parse().unwrap_or(1);
    let physical_cores = parts[2].trim().parse().unwrap_or(1);
    
    // 解析 Load Avg
    let load_parts: Vec<&str> = parts[3].split_whitespace().collect();
    let load_avg = [
        load_parts.get(0).and_then(|v| v.parse().ok()).unwrap_or(0.0),
        load_parts.get(1).and_then(|v| v.parse().ok()).unwrap_or(0.0),
        load_parts.get(2).and_then(|v| v.parse().ok()).unwrap_or(0.0),
    ];

    let mut usage = 0.0;
    let mut breakdown = CpuBreakdown { user: 0.0, system: 0.0, iowait: 0.0, idle: 0.0 };
    let mut per_core_usage = Vec::new();

    {
        let mut history = monitor_cache.history.lock().unwrap();
        let stat_lines: Vec<&str> = parts[4].trim().lines().collect();

        for line in stat_lines {
            let label = line.split_whitespace().next().unwrap_or("");
            let current = match CpuTicks::from_line(line) {
                Some(t) => t,
                None => continue,
            };

            // 使用复合键（session_id + 核心名）存储历史
            let cache_key = format!("{}_{}", id, label);
            if let Some(prev) = history.get(&cache_key) {
                let total_delta = current.total().saturating_sub(prev.total());
                if total_delta > 0 {
                    let calc_usage = (current.active().saturating_sub(prev.active()) as f64 / total_delta as f64) * 100.0;
                    
                    if label == "cpu" {
                        usage = calc_usage;
                        // 计算细分占比
                        breakdown.user = (current.user.saturating_sub(prev.user) as f64 / total_delta as f64) * 100.0;
                        breakdown.system = ((current.system + current.irq + current.softirq).saturating_sub(prev.system + prev.irq + prev.softirq) as f64 / total_delta as f64) * 100.0;
                        breakdown.iowait = (current.iowait.saturating_sub(prev.iowait) as f64 / total_delta as f64) * 100.0;
                        breakdown.idle = (current.idle.saturating_sub(prev.idle) as f64 / total_delta as f64) * 100.0;
                    } else {
                        per_core_usage.push(calc_usage.min(100.0));
                    }
                }
            }
            history.insert(cache_key, current);
        }
    }

    Ok(RemoteCpuInfo {
        model,
        physical_cores,
        logical_threads,
        usage,
        load_avg,
        breakdown,
        per_core_usage,
    })
}