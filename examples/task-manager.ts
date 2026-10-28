/**
 * 参考实现：单 Tab 内路由切换不取消 SSE；每个任务的事件流独立。
 * 只要求 TypeScript + 浏览器 EventSource；并非生产完整持久化方案。
 *
 * 服务器需遵守 references/backend-sse-contract.md：统一 JSON data 事件、id/seq、GET /tasks/:id/events。
 * 必须保证事件已持久化、任务状态可查询、客户端有权访问。
 */

export type TaskStatus = 'queued' | 'running' | 'streaming' | 'cancel_requested' | 'succeeded' | 'failed' | 'cancelled';
export type Task = {
  taskId: string;
  conversationId: string;
  status: TaskStatus;
  text: string;
  lastSeq: number;
  connection: 'connecting' | 'connected' | 'reconnecting' | 'closed';
  error?: string;
};
export type TaskEvent = {
  taskId: string;
  seq: number;
  type: 'running' | 'delta' | 'cancel_requested' | 'succeeded' | 'failed' | 'cancelled';
  text?: string;
  snapshot?: string;
  error?: string;
};

type Snapshot = Readonly<Record<string, Task>>;
const terminal = new Set<TaskStatus>(['succeeded', 'failed', 'cancelled']);

class TaskManager {
  private snapshot: Snapshot = {};
  private listeners = new Set<() => void>();
  private streams = new Map<string, EventSource>();
  private cancelRequests = new Set<string>();

  // getSnapshot 返回稳定引用；只有数据改变时才分配新对象。
  getSnapshot = (): Snapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener); // 只取消 UI 订阅，不关闭 SSE
  };

  private set(taskId: string, mutate: (before: Task) => Task) {
    const old = this.snapshot[taskId];
    if (!old) return;
    this.snapshot = { ...this.snapshot, [taskId]: mutate(old) };
    this.listeners.forEach(fn => fn());
  }

  track(task: Task) {
    this.snapshot = { ...this.snapshot, [task.taskId]: task };
    this.listeners.forEach(fn => fn());
    if (!terminal.has(task.status)) this.connect(task.taskId);
  }

  connect(taskId: string) {
    if (this.streams.has(taskId)) return;
    const task = this.snapshot[taskId];
    if (!task || terminal.has(task.status)) return;
    // EventSource 当前连接断开时自动重连；重新打开页面需先恢复任务快照。
    const url = `/api/tasks/${encodeURIComponent(taskId)}/events?after=${task.lastSeq}`;
    const es = new EventSource(url, { withCredentials: true });
    this.streams.set(taskId, es);
    this.set(taskId, old => ({ ...old, connection: 'connecting' }));
    es.onopen = () => this.set(taskId, old => ({ ...old, connection: 'connected' }));
    es.onerror = () => {
      // onerror 不能直接标记 task 为 failed；EventSource 可能正在重连。
      this.set(taskId, old => ({ ...old, connection: 'reconnecting' }));
    };
    es.onmessage = msg => {
      let event: TaskEvent;
      try { event = JSON.parse(msg.data) as TaskEvent; }
      catch { return; } // 生产系统应记录/报告解析错误
      if (event.taskId !== taskId || !Number.isSafeInteger(event.seq)) return;
      const current = this.snapshot[taskId];
      if (!current || event.seq <= current.lastSeq) return; // 重放去重
      this.set(taskId, old => {
        const nextStatus: TaskStatus = event.type === 'delta' ? 'streaming' : event.type;
        return {
          ...old,
          lastSeq: event.seq,
          status: old.status === 'cancel_requested' && !terminal.has(nextStatus)
            ? 'cancel_requested' : nextStatus,
          // 终态优先用权威快照，避免掉事件或重复追加导致文字损坏
          text: event.snapshot ?? (event.type === 'delta' ? old.text + (event.text ?? '') : old.text),
          error: event.error ?? old.error,
        };
      });
      const updated = this.snapshot[taskId];
      if (updated && terminal.has(updated.status)) this.disconnect(taskId);
    };
  }

  // disconnect ≠ cancel；仅断开浏览器订阅，worker 任务依然执行。
  disconnect(taskId: string) {
    const es = this.streams.get(taskId);
    if (es) { es.close(); this.streams.delete(taskId); }
    this.set(taskId, old => ({ ...old, connection: 'closed' }));
  }

  async cancel(taskId: string) {
    const task = this.snapshot[taskId];
    if (!task || terminal.has(task.status) || task.status === 'cancel_requested' || this.cancelRequests.has(taskId)) return;
    this.cancelRequests.add(taskId);
    try {
      const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/cancel`, {
        method: 'POST', credentials: 'same-origin',
        // 实际项目还需按现有鉴权方式处理 CSRF / token。
      });
      if (!res.ok) throw new Error(`取消请求失败: ${res.status}`);
      const result = await res.json() as { status: TaskStatus };
      if (result.status === 'cancel_requested') {
        this.set(taskId, old => terminal.has(old.status) ? old : { ...old, status: 'cancel_requested' });
      }
      // cancel_requested 是服务端已接受请求；最终 cancelled 或 succeeded 仍由任务事件确认。
    } finally {
      this.cancelRequests.delete(taskId);
    }
  }
}

/** 应用级单例：路由子组件卸载不会销毁该管理器。 */
export const taskManager = new TaskManager();

/** 示例使用：
 * const task = await createOnServer(conversationId, prompt);
 * taskManager.track({taskId:task.taskId, conversationId, status:'queued',
 *                    text:'', lastSeq:0, connection:'connecting'});
 * 若要刷新后恢复：GET /api/tasks?conversationId=... 恢复快照，再 track。
 */
