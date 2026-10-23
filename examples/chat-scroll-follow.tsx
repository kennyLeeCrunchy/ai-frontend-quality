/** Chat scroll-follow demonstration: user's intent wins over streaming output. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const THRESHOLD = 40;
export function StreamingMessageViewport({ children, changeToken }: {
  children: React.ReactNode;
  /** Increment when rendered messages or streaming content changes. */
  changeToken: number | string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  const [following, setFollowing] = useState(true);

  function setFollow(value: boolean) {
    followRef.current = value;
    setFollowing(value);
  }
  function isNearBottom(el: HTMLElement) {
    return el.scrollHeight - el.scrollTop - el.clientHeight <= THRESHOLD;
  }
  function goToBottom() {
    const el = scrollRef.current;
    if (!el) return;
    setFollow(true);
    el.scrollTop = el.scrollHeight;
  }

  // When messages append, do not animate each token with smooth scrolling.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && followRef.current) el.scrollTop = el.scrollHeight;
  }, [changeToken]);

  // Handles late-loading images, code highlighting and expandable tool cards.
  useEffect(() => {
    const inner = contentRef.current;
    if (!inner || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const el = scrollRef.current;
      if (el && followRef.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  return (
    <section style={{ position: 'relative', height: '100%', minHeight: 0 }} aria-label="消息记录">
      <div
        ref={scrollRef}
        onWheel={(e) => { if (e.deltaY < 0) setFollow(false); }}
        onTouchMove={() => {
          // Touch direction can be inferred from scroll position on scroll event.
        }}
        onScroll={(e) => {
          // A programmatic scroll while following stays near bottom.
          // Once user is away from bottom, keep follow paused until they return.
          if (isNearBottom(e.currentTarget)) setFollow(true);
          else if (followRef.current) setFollow(false);
        }}
        style={{ overflowY: 'auto', minHeight: 0, height: '100%', scrollbarGutter: 'stable' }}
      >
        <div ref={contentRef}>{children}</div>
      </div>
      {!following && (
        <button type="button" onClick={goToBottom}
          style={{ position: 'absolute', right: 20, bottom: 18 }}>
          有新内容 · 回到底部 ↓
        </button>
      )}
    </section>
  );
}
