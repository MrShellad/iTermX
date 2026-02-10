use crate::commands::ssh::SshState;
use ssh2::Session;
use std::path::Path;
use std::sync::{Arc, Mutex};
use tauri::State;

// === 数据结构 ===
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub last_modified: u64,  // 毫秒时间戳
    pub permissions: String, // rwxr-xr-x
    pub owner: String,
    pub group: String,
    pub extension: String,
}

// === 辅助函数：Unix 权限位转字符串 ===
fn format_permissions(mode: u32) -> String {
    let mut s = String::with_capacity(10);
    s.push(if mode & 0o400 != 0 { 'r' } else { '-' });
    s.push(if mode & 0o200 != 0 { 'w' } else { '-' });
    s.push(if mode & 0o100 != 0 { 'x' } else { '-' });
    s.push(if mode & 0o040 != 0 { 'r' } else { '-' });
    s.push(if mode & 0o020 != 0 { 'w' } else { '-' });
    s.push(if mode & 0o010 != 0 { 'x' } else { '-' });
    s.push(if mode & 0o004 != 0 { 'r' } else { '-' });
    s.push(if mode & 0o002 != 0 { 'w' } else { '-' });
    s.push(if mode & 0o001 != 0 { 'x' } else { '-' });
    s
}

// === 辅助函数：获取 SFTP 专用 Session ===
// 这确保了我们操作的是独立的 SFTP 连接，而不是 Monitor 连接
fn get_sftp_session_arc(
    ssh_state: &State<'_, SshState>,
    id: &str,
) -> Result<Arc<Mutex<Option<Session>>>, String> {
    let map = ssh_state.sessions.lock().unwrap();
    let conn = map.get(id).ok_or("SSH connection not active")?;
    // [关键] 返回 sftp_session
    Ok(conn.sftp_session.clone())
}

// ==========================================
// 1. 获取文件列表 (含 OpenWrt 兼容性检查)
// ==========================================
#[tauri::command]
pub async fn list_ssh_files(
    ssh_state: State<'_, SshState>,
    id: String,
    path: String,
) -> Result<Vec<FileEntry>, String> {
    let session_arc = get_sftp_session_arc(&ssh_state, &id)?;

    let files = tauri::async_runtime::spawn_blocking(move || {
        let sess_guard = session_arc.lock().unwrap();
        let sess = sess_guard.as_ref().ok_or("SFTP session unavailable")?;

        // [优化] 1. 设置握手超时 (3s)
        // 很多 OpenWrt 没装 sftp-server，默认会卡很久
        sess.set_timeout(3000);

        // [优化] 2. 尝试初始化 SFTP
        let sftp_result = sess.sftp();

        // 无论成功失败，先尝试重置超时，避免影响 session 后续状态
        sess.set_timeout(0);

        let sftp = match sftp_result {
            Ok(s) => s,
            Err(e) => {
                // 打印日志方便调试
                eprintln!("[SFTP Init Error] Code: {:?}, Msg: {}", e.code(), e);

                // 判断错误类型
                let msg = e.to_string().to_lowercase();
                if msg.contains("wait for response") || msg.contains("timeout") {
                    return Err("SFTP Connection Timed Out. (Server response slow)".to_string());
                }
                // 通常是 subsystem request failed
                return Err(
                    "SFTP not enabled on this server. (Please install openssh-sftp-server)"
                        .to_string(),
                );
            }
        };

        // 3. 读取目录
        let dir_path = Path::new(&path);

        // 读取大目录可能需要更久，给 5s
        sess.set_timeout(5000);
        let paths_result = sftp.readdir(dir_path);
        sess.set_timeout(0); // 恢复

        let paths = paths_result.map_err(|e| format!("Read Dir Error: {}", e))?;

        let mut entries = Vec::new();

        for (path_buf, stat) in paths {
            let file_name = path_buf
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            if file_name == "." || file_name == ".." {
                continue;
            }

            let is_dir = stat.is_dir();

            // 路径拼接：简单的字符串拼接，适配 Linux 路径
            let full_path = if path.ends_with('/') {
                format!("{}{}", path, file_name)
            } else {
                format!("{}/{}", path, file_name)
            };

            let extension = path_buf
                .extension()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            let perms_str = if is_dir {
                format!("d{}", format_permissions(stat.perm.unwrap_or(0)))
            } else {
                format!("-{}", format_permissions(stat.perm.unwrap_or(0)))
            };

            entries.push(FileEntry {
                name: file_name,
                path: full_path,
                is_dir,
                size: stat.size.unwrap_or(0),
                last_modified: stat.mtime.unwrap_or(0) * 1000,
                permissions: perms_str,
                owner: stat.uid.unwrap_or(0).to_string(),
                group: stat.gid.unwrap_or(0).to_string(),
                extension,
            });
        }

        // 排序：文件夹在前，文件在后；同类按名称排序
        entries.sort_by(|a, b| {
            if a.is_dir == b.is_dir {
                a.name.cmp(&b.name)
            } else {
                b.is_dir.cmp(&a.is_dir)
            }
        });

        Ok(entries)
    })
    .await
    .map_err(|e| e.to_string())??;

    Ok(files)
}

// ==========================================
// 2. 新建文件夹
// ==========================================
#[tauri::command]
pub async fn sftp_mkdir(
    ssh_state: State<'_, SshState>,
    id: String,
    path: String,
) -> Result<(), String> {
    let session_arc = get_sftp_session_arc(&ssh_state, &id)?;

    tauri::async_runtime::spawn_blocking(move || {
        let sess_guard = session_arc.lock().unwrap();
        let sess = sess_guard.as_ref().ok_or("SFTP session unavailable")?;

        sess.set_timeout(5000);
        let sftp = sess.sftp().map_err(|e| e.to_string())?;

        // 0o755 = rwxr-xr-x
        let res = sftp.mkdir(Path::new(&path), 0o755);

        sess.set_timeout(0);
        res.map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

// ==========================================
// 3. 新建文件
// ==========================================
#[tauri::command]
pub async fn sftp_create_file(
    ssh_state: State<'_, SshState>,
    id: String,
    path: String,
) -> Result<(), String> {
    let session_arc = get_sftp_session_arc(&ssh_state, &id)?;

    tauri::async_runtime::spawn_blocking(move || {
        let sess_guard = session_arc.lock().unwrap();
        let sess = sess_guard.as_ref().ok_or("SFTP session unavailable")?;

        sess.set_timeout(5000);
        let sftp = sess.sftp().map_err(|e| e.to_string())?;

        // sftp.create 等同于 open with WRITE | CREATE | TRUNCATE
        let _file = sftp.create(Path::new(&path)).map_err(|e| e.to_string())?;
        // _file 离开作用域自动关闭，文件创建成功

        sess.set_timeout(0);
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

// ==========================================
// 4. 重命名
// ==========================================
#[tauri::command]
pub async fn sftp_rename(
    ssh_state: State<'_, SshState>,
    id: String,
    old_path: String,
    new_path: String,
) -> Result<(), String> {
    let session_arc = get_sftp_session_arc(&ssh_state, &id)?;

    tauri::async_runtime::spawn_blocking(move || {
        let sess_guard = session_arc.lock().unwrap();
        let sess = sess_guard.as_ref().ok_or("SFTP session unavailable")?;

        sess.set_timeout(5000);
        let sftp = sess.sftp().map_err(|e| e.to_string())?;

        // Rename flags: None (默认行为)
        let res = sftp.rename(Path::new(&old_path), Path::new(&new_path), None);

        sess.set_timeout(0);
        res.map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

// ==========================================
// 5. 删除 (文件或空文件夹)
// ==========================================
#[tauri::command]
pub async fn sftp_delete(
    ssh_state: State<'_, SshState>,
    id: String,
    path: String,
    is_dir: bool,
) -> Result<(), String> {
    let session_arc = get_sftp_session_arc(&ssh_state, &id)?;

    tauri::async_runtime::spawn_blocking(move || {
        let sess_guard = session_arc.lock().unwrap();
        let sess = sess_guard.as_ref().ok_or("SFTP session unavailable")?;

        sess.set_timeout(8000); // 删除可能稍慢
        let sftp = sess.sftp().map_err(|e| e.to_string())?;

        let p = Path::new(&path);
        let res = if is_dir {
            // rmdir 只能删除空文件夹
            sftp.rmdir(p)
        } else {
            sftp.unlink(p)
        };

        sess.set_timeout(0);
        res.map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

// ... 之前的 imports

// [新增] 真正的流式复制 (Rust 内存中转，不落本地磁盘)
#[tauri::command]
pub async fn sftp_copy(
    ssh_state: State<'_, SshState>,
    id: String,
    from_path: String,
    to_path: String,
) -> Result<(), String> {
    let session_arc = get_sftp_session_arc(&ssh_state, &id)?;

    tauri::async_runtime::spawn_blocking(move || {
        let sess_guard = session_arc.lock().unwrap();
        let sess = sess_guard.as_ref().ok_or("SFTP session unavailable")?;

        sess.set_timeout(10000); // 复制大文件可能需要较长时间，给10秒读写超时
        let sftp = sess.sftp().map_err(|e| e.to_string())?;

        // 1. 打开源文件 (Read)
        let mut src_file = sftp
            .open(Path::new(&from_path))
            .map_err(|e| format!("Failed to open source: {}", e))?;

        // 2. 创建目标文件 (Write + Create + Truncate)
        let mut dst_file = sftp
            .create(Path::new(&to_path))
            .map_err(|e| format!("Failed to create dest: {}", e))?;

        // 3. 执行流式拷贝 (std::io::copy 会自动处理 buffer)
        // 数据流向：SFTP Server -> Rust Memory Buffer -> SFTP Server
        std::io::copy(&mut src_file, &mut dst_file)
            .map_err(|e| format!("Copy stream failed: {}", e))?;

        // 4. 显式 Flush 确保写入
        use std::io::Write; // 引入 Write trait
        dst_file
            .flush()
            .map_err(|e| format!("Flush failed: {}", e))?;

        sess.set_timeout(0);
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

// ... 之前的 imports
use std::fs::File; // [新增] 用于操作本地文件

// ==========================================
// 7. 下载文件 (Remote -> Local)
// ==========================================
#[tauri::command]
pub async fn sftp_download_file(
    ssh_state: State<'_, SshState>,
    id: String,
    remote_path: String,
    local_path: String,
) -> Result<(), String> {
    let session_arc = get_sftp_session_arc(&ssh_state, &id)?;

    tauri::async_runtime::spawn_blocking(move || {
        let sess_guard = session_arc.lock().unwrap();
        let sess = sess_guard.as_ref().ok_or("SFTP session unavailable")?;
        
        // 下载可能耗时，设置较长超时或 0 (无限)
        sess.set_timeout(0); 
        let sftp = sess.sftp().map_err(|e| e.to_string())?;

        // 1. 打开远程文件 (Read)
        let mut remote_file = sftp.open(Path::new(&remote_path))
            .map_err(|e| format!("Failed to open remote file: {}", e))?;

        // 2. 创建本地文件 (Write)
        let mut local_file = File::create(&local_path)
            .map_err(|e| format!("Failed to create local file: {}", e))?;

        // 3. 流式传输
        std::io::copy(&mut remote_file, &mut local_file)
            .map_err(|e| format!("Download stream failed: {}", e))?;

        // 恢复默认超时 (视你的设定而定，比如 3000ms)
        sess.set_timeout(3000);
        Ok(())
    }).await.map_err(|e| e.to_string())?
}

// ==========================================
// 8. 上传文件 (Local -> Remote)
// ==========================================
#[tauri::command]
pub async fn sftp_upload_file(
    ssh_state: State<'_, SshState>,
    id: String,
    local_path: String,
    remote_path: String,
) -> Result<(), String> {
    let session_arc = get_sftp_session_arc(&ssh_state, &id)?;

    tauri::async_runtime::spawn_blocking(move || {
        let sess_guard = session_arc.lock().unwrap();
        let sess = sess_guard.as_ref().ok_or("SFTP session unavailable")?;
        
        sess.set_timeout(0);
        let sftp = sess.sftp().map_err(|e| e.to_string())?;

        // 1. 打开本地文件 (Read)
        let mut local_file = File::open(&local_path)
            .map_err(|e| format!("Failed to open local file: {}", e))?;

        // 2. 创建远程文件 (Write)
        // 使用 create 会覆盖同名文件
        let mut remote_file = sftp.create(Path::new(&remote_path))
            .map_err(|e| format!("Failed to create remote file: {}", e))?;

        // 3. 流式传输
        std::io::copy(&mut local_file, &mut remote_file)
            .map_err(|e| format!("Upload stream failed: {}", e))?;

        // 4. 刷新缓冲区确保写入完成
        use std::io::Write;
        remote_file.flush().map_err(|e| format!("Flush failed: {}", e))?;

        sess.set_timeout(3000);
        Ok(())
    }).await.map_err(|e| e.to_string())?
}

// ==========================================
// 9. 修改权限 (Chmod) - 修复版
// ==========================================
#[tauri::command]
pub async fn sftp_chmod(
    ssh_state: State<'_, SshState>,
    id: String,
    path: String,
    mode: String,
    recursive: bool,
) -> Result<(), String> {
    let session_arc = get_sftp_session_arc(&ssh_state, &id)?;

    tauri::async_runtime::spawn_blocking(move || {
        let sess_guard = session_arc.lock().unwrap();
        let sess = sess_guard.as_ref().ok_or("SFTP session unavailable")?;

        // 1. 解析八进制权限字符串 (例如 "755" -> 493)
        let mode_num = u32::from_str_radix(&mode, 8)
            .map_err(|e| format!("Invalid octal mode: {}", e))?;

        if recursive {
            // === 递归模式 ===
            // 使用 SSH Exec 通道执行 "chmod -R" 以获得最佳性能
            let mut channel = sess.channel_session()
                .map_err(|e| format!("Failed to open SSH channel: {}", e))?;
            
            // 安全处理：对路径中的单引号进行转义，防止 Shell 注入
            let safe_path = path.replace("'", "'\\''");
            
            // 构造命令: chmod -R 755 '/path/to/file'
            let cmd = format!("chmod -R {:03o} '{}'", mode_num, safe_path);
            
            channel.exec(&cmd)
                .map_err(|e| format!("Failed to exec chmod command: {}", e))?;
            
            // 读取输出并等待结束
            use std::io::Read;
            let mut output = String::new();
            channel.read_to_string(&mut output).ok(); 
            channel.wait_close().ok();
            
            let status = channel.exit_status().unwrap_or(-1);
            if status != 0 {
                return Err(format!("Recursive chmod failed (Exit code: {})", status));
            }

        } else {
            // === 单文件模式 ===
            sess.set_timeout(5000);
            
            let sftp = sess.sftp().map_err(|e| e.to_string())?;

            // [修复] ssh2 没有 sftp.chmod，必须使用 setstat
            // 1. 先获取当前文件属性
            let mut stat = sftp.stat(std::path::Path::new(&path))
                .map_err(|e| format!("Failed to get file stat: {}", e))?;
            
            // 2. 修改权限位 (ssh2 的 FileStat.perm 是 Option<u32>)
            stat.perm = Some(mode_num);
            
            // 3. 应用修改
            sftp.setstat(std::path::Path::new(&path), stat)
                .map_err(|e| format!("SFTP setstat failed: {}", e))?;
                
            sess.set_timeout(0); // 恢复超时
        }

        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

// ==========================================
// 10. 读取文件内容 (用于内置编辑器)
// ==========================================
#[tauri::command]
pub async fn sftp_read_file(
    ssh_state: State<'_, SshState>,
    id: String,
    path: String,
) -> Result<String, String> {
    let session_arc = get_sftp_session_arc(&ssh_state, &id)?;

    tauri::async_runtime::spawn_blocking(move || {
        let sess_guard = session_arc.lock().unwrap();
        let sess = sess_guard.as_ref().ok_or("SFTP session unavailable")?;

        // 设置较长的超时，防止网络波动
        sess.set_timeout(10000);
        let sftp = sess.sftp().map_err(|e| e.to_string())?;

        // 1. 打开文件
        let mut remote_file = sftp
            .open(Path::new(&path))
            .map_err(|e| format!("Failed to open file: {}", e))?;

        // 2. [安全检查] 限制文件大小 (例如 5MB)，防止前端编辑器崩溃
        let stat = remote_file.stat().map_err(|e| e.to_string())?;
        if stat.size.unwrap_or(0) > 5 * 1024 * 1024 {
            return Err("File is too large (>5MB) to edit in built-in editor.".to_string());
        }

        // 3. 读取为字符串
        use std::io::Read;
        let mut content = String::new();
        // 如果文件包含非 UTF-8 字符，read_to_string 会报错，这是预期行为
        remote_file
            .read_to_string(&mut content)
            .map_err(|e| format!("Failed to read text content (Binary file?): {}", e))?;

        sess.set_timeout(0);
        Ok(content)
    })
    .await
    .map_err(|e| e.to_string())?
}

// ==========================================
// 11. 写入文件内容 (用于内置编辑器保存)
// ==========================================
#[tauri::command]
pub async fn sftp_write_file(
    ssh_state: State<'_, SshState>,
    id: String,
    path: String,
    content: String,
) -> Result<(), String> {
    let session_arc = get_sftp_session_arc(&ssh_state, &id)?;

    tauri::async_runtime::spawn_blocking(move || {
        let sess_guard = session_arc.lock().unwrap();
        let sess = sess_guard.as_ref().ok_or("SFTP session unavailable")?;

        sess.set_timeout(10000);
        let sftp = sess.sftp().map_err(|e| e.to_string())?;

        // 1. 以 Create (Write + Truncate) 模式打开文件
        let mut remote_file = sftp
            .create(Path::new(&path))
            .map_err(|e| format!("Failed to open file for writing: {}", e))?;

        // 2. 写入字符串字节
        use std::io::Write;
        remote_file
            .write_all(content.as_bytes())
            .map_err(|e| format!("Write failed: {}", e))?;

        // 3. 强制刷新缓冲区
        remote_file
            .flush()
            .map_err(|e| format!("Flush failed: {}", e))?;

        sess.set_timeout(0);
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}