# FastAPI + SSE + Worker：后端任务边界参考

**目标**：当 React 路由切换、SSE 断线、浏览器刷新后，AI 的业务任务仍有可查询的状态与结果。本文是建议 API 合约与伪代码，不是已接入数据库的生产服务。

## 端点合同

```http
POST /api/tasks
Idempotency-Key: 4da...
Content-Type: application/json

{"conversationId":"c-1", "prompt":"..."}

202 Accepted
{"taskId":"t-1", "status":"queued"}

GET /api/tasks/t-1
200 {"taskId":"t-1", "conversationId":"c-1", "status":"streaming",
     "lastSeq":15, "snapshot":"已经生成的完整文字..."}

GET /api/tasks/t-1/events?after=15
Accept: text/event-stream

id: 16
data: {"taskId":"t-1","seq":16,"type":"delta","text":"后续内容"}

id: 17
data: {"taskId":"t-1","seq":17,"type":"succeeded","snapshot":"完整结果"}

POST /api/tasks/t-1/cancel
202 {"status":"cancel_requested"}
```

`after` 与 SSE 内 `id` 同步维护；新订阅者由服务端按 cursor 补播。断线后内置 EventSource 会携带 `Last-Event-ID`；实现者应定义 header 与 URL cursor 的优先级（不要双重补播）。同时要有 GET snapshot 的兜底，不能因事件保留期到期使用户永远无法恢复结果。

## 建议的表（概念 SQL）

```sql
CREATE TABLE ai_tasks (
  task_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL,
  snapshot TEXT NOT NULL DEFAULT '',
  last_seq BIGINT NOT NULL DEFAULT 0,
  version BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX idx_ai_tasks_conversation ON ai_tasks(user_id, conversation_id, created_at);
CREATE TABLE ai_task_events (
  task_id UUID NOT NULL REFERENCES ai_tasks(task_id),
  seq BIGINT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, seq)
);
```

**完整性约束**：事务中更新 snapshot / status / last_seq 与 append event，保证游标和消息一致；鉴权时校验 user_id。生产系统中消息全文可能单独存 message 表，snapshot 不一定和每个 token 同步写 DB，可按批次 checkpoint + 最终落库。

## FastAPI 示例（接口结构伪代码）

```python
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

router = APIRouter()

@router.post('/api/tasks', status_code=202)
async def create_task(body: CreateTaskBody, request: Request, user=Depends(current_user)):
    # 1. 校验 conversation 所属和权限
    # 2. 按 user + idempotency_key 幂等创建 task row
    # 3. 同事务写 outbox 或发布到可靠队列
    # 4. 返回 stable taskId；不能 await 完整 LLM 生成
    task = await task_service.create_and_enqueue(user, body, request.headers.get('Idempotency-Key'))
    return {'taskId': str(task.id), 'status': task.status}

@router.get('/api/tasks/{task_id}/events')
async def task_events(task_id: str, request: Request, after: int = 0,
                      user=Depends(current_user)):
    await task_service.assert_owner(task_id, user.id)
    last_header = request.headers.get('last-event-id')
    cursor = max(after, int(last_header or 0))  # 仅示意，需校验非法/未来游标

    async def stream():
        async for event in task_service.events_after(task_id, cursor):
            if await request.is_disconnected():
                break  # 关闭该订阅；**不要取消 worker 任务**
            yield f'id: {event.seq}\ndata: {event.payload_json}\n\n'
        # 真实实现需要心跳、背压、订阅等待、超时及终态管理

    return StreamingResponse(stream(), media_type='text/event-stream', headers={
        'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'
    })
```

`CreateTaskBody`, `current_user`, `task_service` 为项目需提供的抽象，**不能直接复制当作可运行服务器**。注意代理/负载均衡 SSE 缓冲与连接数限制。生产方案应采用 Celery、ARQ、RQ 或已有可靠任务系统/持久消息队列；`asyncio.create_task` 在 Web 进程中的简易实现**不保证重启后继续执行**，不应被包装成 L 档。

## 异步竞争与一致性

- 创建：IDempotency-Key 防网络重试重复创建任务。
- 修改同一会话：业务定义排队/合并/并发分支；必要时乐观版本号 `version`、`If-Match`。
- 取消：标记 `cancel_requested` 并通知 worker，最终 `cancelled` 由 worker 确认；取消与完成竞速需幂等且按状态机处理。
- 下线/断线：任务执行权不与 SSE 客户端 TCP 连接绑定；结果持久化与重放依需求有保留期。
- 多租户：查询、订阅、取消都要 authz，不允许猜 taskId 读取他人内容。
- 旧请求覆盖：所有前端事件/HTTP 结果要按 taskId/conversationId 和 sequence / version 匹配。
