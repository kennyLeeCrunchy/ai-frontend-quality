/**
 * 参考代码：React + TanStack Query。业务 API、QueryClientProvider 和类型需按项目接入。
 * 展示：稳定 ID、局部保存、精确缓存更新、独立草稿。
 * 保存失败不触发全站骨架屏；没有为所有组件盲目加 memo。
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type Card = { id: string; quadrantId: string; text: string };
const cardsKey = (workspaceId: string, quadrantId: string) =>
  ['workspaces', workspaceId, 'quadrants', quadrantId, 'cards'] as const;

async function readCards(workspaceId: string, quadrantId: string): Promise<Card[]> {
  const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/quadrants/${encodeURIComponent(quadrantId)}/cards`);
  if (!res.ok) throw new Error(`加载卡片失败: ${res.status}`);
  return res.json();
}
async function updateCard(card: Card): Promise<Card> {
  const res = await fetch(`/api/cards/${encodeURIComponent(card.id)}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: card.text }),
  });
  if (!res.ok) throw new Error(`保存失败: ${res.status}`);
  return res.json();
}

export function QuadrantCards(props: { workspaceId: string; quadrantId: string }) {
  const { workspaceId, quadrantId } = props;
  const queryClient = useQueryClient();
  const key = cardsKey(workspaceId, quadrantId);
  const query = useQuery({ queryKey: key, queryFn: () => readCards(workspaceId, quadrantId) });
  const mutation = useMutation({
    mutationFn: updateCard,
    onSuccess(saved) {
      queryClient.setQueryData<Card[]>(key, old =>
        (old ?? []).map(card => card.id === saved.id ? saved : card)
      );
      // 若后端会更新其他派生数据，精确失效相关 query；不要无条件失效所有查询。
    },
  });

  if (query.isPending) return <p>正在加载本象限卡片…</p>;
  if (query.isError) return <button onClick={() => void query.refetch()}>本象限加载失败，重试</button>;

  return (
    <div className="quadrant-cards">
      {query.data.map(card => (
        <CardEditor
          key={card.id}  // 稳定业务 ID；禁止使用 Math.random() / Date.now()
          card={card}
          saving={mutation.isPending && mutation.variables?.id === card.id}
          onSave={next => mutation.mutate(next)}
        />
      ))}
      {mutation.isError && <p role="alert">保存失败：{mutation.error.message}</p>}
    </div>
  );
}
function CardEditor(props: { card: Card; saving: boolean; onSave: (card: Card) => void }) {
  const { card, saving, onSave } = props;
  const [draft, setDraft] = useState(card.text);
  // 注意：远端 card.text 更新与未保存 draft 冲突时需要单独的冲突策略；
  // 此示例故意不每次 props 更新就重置草稿，否则会造成输入丢失。
  return <article className="quadrant-card">
    <textarea aria-label="卡片内容" value={draft} onChange={e => setDraft(e.target.value)} />
    <button disabled={saving || draft === card.text}
      onClick={() => onSave({ ...card, text: draft })}>
      {saving ? '正在保存这张卡片…' : '保存'}
    </button>
  </article>;
}

// 如果需要真正的乐观写入：先 cancelQueries 指定 key，保存快照、setQueryData，
// onError 精确回滚，onSettled 精确 invalidate；并发编辑同一列表时要处理 rollback 竞态。
// 简单场景不一定需要乐观更新：先显示局部 Saving、成功后更新缓存同样可用。
