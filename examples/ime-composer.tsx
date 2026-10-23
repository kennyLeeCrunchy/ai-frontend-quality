/** Independent reference implementation; adapt send constraints and IME behavior to project. */
import { useCallback, useRef, useState } from 'react';

type Props = {
  onSend: (text: string) => void | Promise<void>;
  sendShortcut?: 'enter' | 'mod-enter';
};

/**
 * 500ms is NOT a standard: sample here uses 120ms as a one-shot fallback,
 * only for anomalous keydown following compositionend.
 * Validate with target browser + Chinese/Japanese IMEs, adjust or disable.
 */
const POST_COMPOSITION_GUARD_MS = 120;

export function IMESafeComposer({ onSend, sendShortcut = 'enter' }: Props) {
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

    // Some IMEs fire an extra Enter immediately after compositionend.
    if (compositionEndedAt.current !== null) {
      const delta = performance.now() - compositionEndedAt.current;
      compositionEndedAt.current = null;
      if (delta >= 0 && delta < POST_COMPOSITION_GUARD_MS && !e.shiftKey) {
        e.preventDefault();
        return;
      }
    }

    const mod = e.metaKey || e.ctrlKey;
    const shouldSend = sendShortcut === 'enter' ? !e.shiftKey && !mod : mod;
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
