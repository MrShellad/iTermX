import { invoke } from "@tauri-apps/api/core";
import { Snippet } from "../domain/types";

// 这里的接口对应 Rust 里的 SnippetDto
// 确保 domain/types.ts 里的 Snippet 接口和 Rust 的 SnippetDto 字段名一致 (createdAt vs created_at)
// 根据 Rust 代码，我们返回的是驼峰命名 (createdAt)，所以前端不用改类型定义

export const SnippetService = {
  async getAll(): Promise<Snippet[]> {
    // 调用 Rust 指令
    return await invoke<Snippet[]>("get_all_snippets");
  },

  async add(snippet: Snippet): Promise<void> {
    await invoke("add_snippet", { snippet });
  },

  async fullUpdate(snippet: Snippet): Promise<void> {
    await invoke("update_snippet", { snippet });
  },

  async delete(id: string): Promise<void> {
    await invoke("delete_snippet", { id });
  },

  // 如果你需要 init，现在可以在 Rust setup 阶段自动完成，前端通常不需要手动 initTable
  // 但为了保持 Store 代码兼容，可以留个空函数
  async initTable(): Promise<void> {
    // Rust 启动时已经做完了
    return Promise.resolve();
  }
};

// 导出这个为了兼容之前的 Store 调用，但实际上它是空的
export const initSnippetTable = SnippetService.initTable;