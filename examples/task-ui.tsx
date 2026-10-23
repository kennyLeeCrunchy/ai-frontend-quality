/**
 * 参考：App Shell 持久存在，页面只订阅 TaskManager。
 * 切换 conversationId 不会关闭运行中 EventSource。
 * 草稿和创建请求也按 conversationId 隔离，不随路由卸载而消失。
 * 依赖 examples/task-manager.ts；API 按项目调整。
 */
import { useSyncExternalStore } from 'react';
import { taskManager, type Task } from './task-manager';

type ChatUiState = { draft: string; creating: boolean; error: string | null };
const DEFAULT_UI: ChatUiState = { draft: '', creating: false, error: null };

class ChatUiStore {
  private snapshot: Readonly<Record<string, ChatUiState>> = {};
  private listeners = new Set<() => void>();
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = () => this.snapshot;
  set(conversationId: string, patch: Partial<ChatUiState>) {
    this.snapshot = {
      ...this.snapshot,
      [conversationId]: { ...(this.snapshot[conversationId] ?? DEFAULT_UI), ...patch },
    };
    this.listeners.forEach(fn => fn());
  }
}
const chatUiStore = new ChatUiStore(); // 模块级 Store；刷新后草稿持久化要另做 sessionStorage/DB

function useTaskSnapshot() {
  // 纯客户端 SPA；如果项目采用 SSR，需要稳定且一致的 hydration/server snapshot。
  return useSyncExternalStore(taskManager.subscribe, taskManager.getSnapshot);
}
function useChatUiSnapshot() {
  return useSyncExternalStore(chatUiStore.subscribe, chatUiStore.getSnapshot);
}

export function ChatWorkspace({ conversationId }: { conversationId: string }) {
  const tasksById = useTaskSnapshot();
  const uiByConversation = useChatUiSnapshot();
  const ui = uiByConversation[conversationId] ?? DEFAULT_UI;
  const tasks = Object.values(tasksById).filter(t => t.conversationId === conversationId);
  const current = tasks.at(-1);
  const active = current && !['succeeded', 'failed', 'cancelled'].includes(current.status);

  async function sendMessage() {
    // 读取最新 store，而不是依赖可能过期的闭包。
    const state = chatUiStore.getSnapshot()[conversationId] ?? DEFAULT_UI;
    if (!state.draft.trim() || state.creating || active) return;
    const message = state.draft.trim();
    chatUiStore.set(conversationId, { creating: true, error: null });
    const idempotencyKey = crypto.randomUUID();
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ conversationId, prompt: message }),
      });
      if (!res.ok) throw new Error(`创建任务失败: ${res.status}`);
      const json: { taskId: string; status: Task['status'] } = await res.json();
      taskManager.track({ taskId: json.taskId, conversationId, status: json.status,
        text: '', lastSeq: 0, connection: 'connecting' });
      // 用户在等待期间可能编辑了原草稿：不能把这些新文字清掉。
      const latest = chatUiStore.getSnapshot()[conversationId];
      if (latest?.draft === state.draft) chatUiStore.set(conversationId, { draft: '' });
    } catch (err) {
      chatUiStore.set(conversationId, {
        error: err instanceof Error ? err.message : '发送失败',
      });
      // 真正重试应复用上面的 idempotencyKey，防止请求成功但响应丢失时重复建任务。
    } finally {
      chatUiStore.set(conversationId, { creating: false });
    }
  }

  return <section aria-label={`对话 ${conversationId}`}>
    <h2>{conversationId}</h2>
    <div>
      {tasks.map(t => <article key={t.taskId}>
        <p>{t.text}</p>
        <small role="status" aria-live="polite">{t.status} · {t.connection}</small>
        {!['succeeded', 'failed', 'cancelled'].includes(t.status) &&
          <button onClick={() => {
            void taskManager.cancel(t.taskId).catch(err =>
              chatUiStore.set(conversationId, { error: String(err) })
            );
          }}>停止生成</button>}
      </article>)}
    </div>
    <textarea aria-label="输入消息" value={ui.draft}
      onChange={e => chatUiStore.set(conversationId, { draft: e.target.value })}/>
    {ui.error && <p role="alert">{ui.error}</p>}
    {/* 仅禁止当前会话的冲突发送；全局路由、另一会话、工作区仍可使用 */}
    <button disabled={!!active || ui.creating || !ui.draft.trim()} onClick={() => void sendMessage()}>
      {ui.creating ? '正在创建任务…' : '发送'}
    </button>
  </section>;
}

// 生产补充：长流式输出应批量更新或局部订阅，避免每个 token 重绘全部会话。
// 后端任务快照/断线恢复、authn/authz、无障碍流式通知节流、并发会话策略均需补足。
