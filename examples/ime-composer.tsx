/** Independent reference implementation; adapt send constraints and IME behavior to project. */
import { useCallback, useRef, useState } from 'react';

type Props = {
  onSend: (text: string) => void | Promise<void>;
  sendShortcut?: 'enter' | 'mod-enter';
  /** 仅在目标输入法确有 compositionend 后额外 Enter 时启用；默认关闭。 */
  postCompositionGuardMs?: number;
};

/**
 * Post-composition guard is opt-in, only for a verified extra Enter after compositionend.
 * Its duration is not a standard; measure with target browser and IME.
 */
export function IMESafeComposer({ onSend, sendShortcut = 'enter', postCompositionGuardMs = 0 }: Props) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const composing = useRef(false);
  const compositionEndedAt = useRef<number | null>(null);

  const submit = useCallback(async () => {
    if (composing.current || sending) return;
    const value = draft.trim();
    if (!value) return;
    setSending(true);
    setError(null);
    try {
      await onSend(value);
      // Do not erase edits made while the request was in flight.
      setDraft((current) => current === draft ? '' : current);
    } catch {
      setError('发送失败，请重试；草稿已保留');
    } finally {
      setSending(false);
    }
  }, [draft, onSend, sending]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter') return;
    const native = e.nativeEvent;
    if (composing.current || native.isComposing || native.keyCode === 229) return;

    const mod = e.metaKey || e.ctrlKey;
    const shouldSend = sendShortcut === 'enter' ? !e.shiftKey && !mod : mod;
    // 只有已验证需要短时防护时才拦截；显式 Ctrl/Cmd+Enter 不受影响。
    if (compositionEndedAt.current !== null) {
      const delta = performance.now() - compositionEndedAt.current;
      compositionEndedAt.current = null;
      if (postCompositionGuardMs > 0 && shouldSend && !mod &&
          delta >= 0 && delta < postCompositionGuardMs) {
        e.preventDefault();
        return;
      }
    }

    if (shouldSend) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="composer">
      <textarea
        aria-label="输入消息"
        value={draft}
        rows={2}
        onChange={(e) => setDraft(e.target.value)}
        onCompositionStart={() => {
          composing.current = true;
          compositionEndedAt.current = null;
        }}
        onCompositionEnd={() => {
          composing.current = false;
          compositionEndedAt.current = performance.now();
        }}
        onKeyDown={onKeyDown}
        style={{ minHeight: 44, maxHeight: 240, overflowY: 'auto', resize: 'vertical', width: '100%' }}
      />
      <button type="button" onClick={submit} disabled={!draft.trim() || sending}>
        发送
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
