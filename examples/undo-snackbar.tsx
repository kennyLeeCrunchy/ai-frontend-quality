/**
 * 示例：可恢复归档 → Snackbar + 撤销。不要用于永久删除等不可逆操作。
 * 把通知状态放在卡片列表外层，不能让「被移除的卡片」组件拥有 Snackbar，
 * 否则卡片一旦被列表移除，通知会一起卸载。
 * 真实业务还需将列表 Query 缓存和撤销恢复路径接入项目。
 */
import { useEffect, useState } from 'react';

type Card = { id: string; title: string };
type Notice = { cardId: string; title: string; expiresAt: number };
async function setArchived(cardId: string, archived: boolean) {
  const res = await fetch(`/api/cards/${encodeURIComponent(cardId)}/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ archived }),
  });
  if (!res.ok) throw new Error(`操作失败: ${res.status}`);
}

export function ArchiveListWithUndo({ cards }: { cards: Card[] }) {
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(prev =>
      prev?.cardId === notice.cardId && prev.expiresAt === notice.expiresAt ? null : prev
    ), Math.max(0, notice.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function archive(card: Card) {
    if (busyId) return;
    setBusyId(card.id); setError(null);
    try {
      await setArchived(card.id, true);
      setHiddenIds(old => new Set([...old, card.id]));
      setNotice({ cardId: card.id, title: card.title, expiresAt: Date.now() + 5000 });
    } catch { setError('暂时无法归档，请重试。'); }
    finally { setBusyId(null); }
  }
  async function undo() {
    if (!notice || busyId) return;
    const target = notice;
    setBusyId(target.cardId); setError(null);
    try {
      await setArchived(target.cardId, false);
      setHiddenIds(old => { const next = new Set(old); next.delete(target.cardId); return next; });
      setNotice(null);
    } catch {
      setError('暂时无法恢复，请到回收站重试。');
      setNotice(null); // 不是唯一恢复通道；保留持久入口
    } finally { setBusyId(null); }
  }

  return <section>
    <ul>
      {cards.filter(card => !hiddenIds.has(card.id)).map(card =>
        <li key={card.id}>{card.title}{' '}
          <button disabled={busyId !== null} onClick={() => void archive(card)}>归档</button>
        </li>)}
    </ul>
    {notice && <div role="status" aria-live="polite">
      已归档「{notice.title}」
      <button disabled={busyId !== null} onClick={() => void undo()}>撤销</button>
    </div>}
    {error && <p role="alert">{error}</p>}
  </section>;
}

// 提示：该例只显示一个 Snackbar；连续归档、多操作并发须用 NotificationCenter 队列。
// 如果后端数据重拉会更新 cards 列表，必须同步 Query 缓存并提供从回收站恢复的入口。
