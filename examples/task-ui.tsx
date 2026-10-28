/**
 * 参考：App Shell 持久存在，页面只订阅 TaskManager。
 * 切换 conversationId 不会关闭运行中 EventSource。
 * 草稿和创建请求也按 conversationId 隔离，不随路由卸载而消失。
 * 依赖 examples/task-manager.ts；API 按项目调整。
 */
import { useSyncExternalStore } from 'react';
import { taskManager, type Task } from './task-manager';

type PendingSend = { message: string; idempotencyKey: string };
type ChatUiState = { draft: string; creating: boolean; error: string | null; pendingSend: PendingSend | null };
const DEFAULT_UI: ChatUiState = { draft: '', creating: false, error: null, pendingSend: null };
const TASK_LABEL: Record<Task['status'], string> = {
  queued: '排队中', running: '处理中', streaming: '正在生成',
  cancel_requested: '正在停止', succeeded: '已完成', failed: '处理失败', cancelled: '已停止',
};

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
  const active = tasks.some(t => !['succeeded', 'failed', 'cancelled'].includes(t.status));

  async function sendMessage() {
    // 读取最新 store，而不是依赖可能过期的闭包。
    const state = chatUiStore.getSnapshot()[conversationId] ?? DEFAULT_UI;
    if (!state.draft.trim() || state.creating || active) return;
    const message = state.draft.trim();
    // 响应丢失后的同内容重试必须沿用原键；修改草稿则是新请求。
    const idempotencyKey = state.pendingSend?.message === message
      ? state.pendingSend.idempotencyKey : crypto.randomUUID();
    chatUiStore.set(conversationId, {
      creating: true, error: null, pendingSend: { message, idempotencyKey },
    });
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ conversationId, prompt: message }),
      });
      if (!res.ok) throw new Error('task creation failed');
      const json: { taskId: string; status: Task['status'] } = await res.json();
      taskManager.track({ taskId: json.taskId, conversationId, status: json.status,
        text: '', lastSeq: 0, connection: 'connecting' });
      chatUiStore.set(conversationId, { pendingSend: null });
      // 用户在等待期间可能编辑了原草稿：不能把这些新文字清掉。
      const latest = chatUiStore.getSnapshot()[conversationId];
      if (latest?.draft === state.draft) chatUiStore.set(conversationId, { draft: '' });
    } catch {
      chatUiStore.set(conversationId, {
        error: '暂时无法确认发送结果，请重试；草稿已保留。',
      });
      // 生产系统应在受控日志中记录错误类别；界面只展示安全的用户文案。
    } finally {
      chatUiStore.set(conversationId, { creating: false });
    }
  }

  return <section aria-label={`对话 ${conversationId}`}>
    <h2>{conversationId}</h2>
    <div>
      {tasks.map(t => <article key={t.taskId}>
        <p>{t.text}</p>
        <small role="status" aria-live="polite">
          {TASK_LABEL[t.status]}{t.connection === 'reconnecting' ? ' · 正在重连' : ''}
        </small>
        {!['cancel_requested', 'succeeded', 'failed', 'cancelled'].includes(t.status) &&
          <button onClick={() => {
            void taskManager.cancel(t.taskId).catch(() =>
              chatUiStore.set(conversationId, { error: '暂时无法停止生成，请稍后重试。' })
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
