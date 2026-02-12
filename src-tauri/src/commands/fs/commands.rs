use crate::commands::ssh::SshState;
use tauri::State;
use super::filesystem::{FileEntry, FileSystem};
use super::session::get_sftp_session_arc;
use super::sftp_impl::SftpFileSystem;

// Macro to reduce boilerplate
macro_rules! run_sftp {
    ($ssh_state:expr, $id:expr, |$fs:ident| $block:expr) => {{
        let session_arc = get_sftp_session_arc($ssh_state, &$id)?;
        tauri::async_runtime::spawn_blocking(move || {
            let sess_guard = session_arc.lock().unwrap();
            let sess = sess_guard.as_ref().ok_or("SFTP session unavailable")?;
            let $fs = SftpFileSystem::new(sess);
            $block
        })
        .await
        .map_err(|e| e.to_string())??
    }};
}

#[tauri::command]
pub async fn list_ssh_files(ssh_state: State<'_, SshState>, id: String, path: String) -> Result<Vec<FileEntry>, String> {
    let res = run_sftp!(&ssh_state, id, |fs| {
        fs.read_dir(&path)
    });
    Ok(res)
}

#[tauri::command]
pub async fn sftp_mkdir(ssh_state: State<'_, SshState>, id: String, path: String) -> Result<(), String> {
    let res = run_sftp!(&ssh_state, id, |fs| {
        fs.mkdir(&path)
    });
    Ok(res)
}

#[tauri::command]
pub async fn sftp_create_file(ssh_state: State<'_, SshState>, id: String, path: String) -> Result<(), String> {
    let res = run_sftp!(&ssh_state, id, |fs| {
        fs.create_file(&path)
    });
    Ok(res)
}

#[tauri::command]
pub async fn sftp_rename(ssh_state: State<'_, SshState>, id: String, old_path: String, new_path: String) -> Result<(), String> {
    let res = run_sftp!(&ssh_state, id, |fs| {
        fs.rename(&old_path, &new_path)
    });
    Ok(res)
}

#[tauri::command]
pub async fn sftp_delete(ssh_state: State<'_, SshState>, id: String, path: String, is_dir: bool) -> Result<(), String> {
    let res = run_sftp!(&ssh_state, id, |fs| {
        fs.delete(&path, is_dir)
    });
    Ok(res)
}

#[tauri::command]
pub async fn sftp_copy(ssh_state: State<'_, SshState>, id: String, from_path: String, to_path: String) -> Result<(), String> {
    let res = run_sftp!(&ssh_state, id, |fs| {
        fs.copy(&from_path, &to_path)
    });
    Ok(res)
}

#[tauri::command]
pub async fn sftp_download_file(ssh_state: State<'_, SshState>, id: String, remote_path: String, local_path: String) -> Result<(), String> {
    let res = run_sftp!(&ssh_state, id, |fs| {
        fs.download(&remote_path, &local_path)
    });
    Ok(res)
}

#[tauri::command]
pub async fn sftp_upload_file(ssh_state: State<'_, SshState>, id: String, local_path: String, remote_path: String) -> Result<(), String> {
    let res = run_sftp!(&ssh_state, id, |fs| {
        fs.upload(&local_path, &remote_path)
    });
    Ok(res)
}

#[tauri::command]
pub async fn sftp_chmod(ssh_state: State<'_, SshState>, id: String, path: String, mode: String, recursive: bool) -> Result<(), String> {
    let res = run_sftp!(&ssh_state, id, |fs| {
        fs.chmod(&path, &mode, recursive)
    });
    Ok(res)
}

#[tauri::command]
pub async fn sftp_read_file(ssh_state: State<'_, SshState>, id: String, path: String) -> Result<String, String> {
    let res = run_sftp!(&ssh_state, id, |fs| {
        fs.read_text(&path)
    });
    Ok(res)
}

#[tauri::command]
pub async fn sftp_write_file(ssh_state: State<'_, SshState>, id: String, path: String, content: String) -> Result<(), String> {
    let res = run_sftp!(&ssh_state, id, |fs| {
        fs.write_text(&path, &content)
    });
    Ok(res)
}

// 🟢 [核心修复] 显式指定 Ok 的泛型参数 Ok::<bool, String>(...)
// 这样编译器就知道闭包的错误类型是 String，从而允许宏内部的 ? 操作符正常工作
#[tauri::command]
pub async fn sftp_check_is_dir(ssh_state: State<'_, SshState>, id: String, path: String) -> Result<bool, String> {
    let res = run_sftp!(&ssh_state, id, |fs| {
        match fs.read_dir(&path) {
            Ok(_) => Ok::<bool, String>(true),   // 🟢 修复点：指定 <bool, String>
            Err(_) => Ok::<bool, String>(false), // 🟢 修复点：指定 <bool, String>
        }
    });
    
    Ok(res)
}

// 🟢 [新增] 获取home目录命令
#[tauri::command]
pub async fn sftp_get_home_dir(ssh_state: State<'_, SshState>, id: String) -> Result<String, String> {
    let res = run_sftp!(&ssh_state, id, |fs| {
        fs.get_home_dir()
    });
    Ok(res)
}