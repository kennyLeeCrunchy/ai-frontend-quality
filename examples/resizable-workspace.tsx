/**
 * Demonstration only. For production, prefer a mature resizable panel component
 * already in the project. Verify keyboard a11y, pointer capture and mobile fallback.
 */
import { useRef, useState } from 'react';

type Fold = 'left' | 'right' | null;
const SNAP_LOW = 18;      // example; confirm UX choice before imposing
const SNAP_HIGH = 82;
const MIN_LEFT_PX = 280;
const MIN_RIGHT_PX = 320;

function boundedRatio(raw: number, available: number): number {
  if (available <= MIN_LEFT_PX + MIN_RIGHT_PX) return 50;
  const low = (MIN_LEFT_PX / available) * 100;
  const high = 100 - (MIN_RIGHT_PX / available) * 100;
  return Math.min(high, Math.max(low, raw));
}

export function ResizableWorkspace({ left, right }: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(50);
  const [fold, setFold] = useState<Fold>(null);
  const drag = useRef<{ startRatio: number; startFold: Fold; pointerId: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  function ratioAt(clientX: number) {
    const r = frame.current?.getBoundingClientRect();
    if (!r || r.width === 0) return ratio;
    return ((clientX - r.left) / r.width) * 100;
  }
  function cancelDrag(e?: React.PointerEvent<HTMLDivElement>) {
    const prev = drag.current;
    if (!prev) return;
    setRatio(prev.startRatio);
    setFold(prev.startFold);
    if (e?.currentTarget.hasPointerCapture(prev.pointerId)) {
      e.currentTarget.releasePointerCapture(prev.pointerId);
    }
    drag.current = null;
    setDragging(false);
  }
  function commitAt(clientX: number) {
    const proposed = ratioAt(clientX);
    const available = frame.current?.getBoundingClientRect().width ?? 1000;
    if (proposed <= SNAP_LOW) setFold('left');
    else if (proposed >= SNAP_HIGH) setFold('right');
    else { setFold(null); setRatio(boundedRatio(proposed, available)); }
    drag.current = null;
    setDragging(false);
  }
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    drag.current = { startRatio: ratio, startFold: fold, pointerId: e.pointerId };
    e.currentTarget.focus(); // ensure Escape reaches the handle while pointer-captured
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.pointerId !== e.pointerId) return;
    // Live preview: retains handle even while approaching snap thresholds.
    const proposed = ratioAt(e.clientX);
    const available = frame.current?.getBoundingClientRect().width ?? 1000;
    setFold(null);
    setRatio(boundedRatio(proposed, available));
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    commitAt(e.clientX);
  }
  function onKeyboard(e: React.KeyboardEvent<HTMLDivElement>) {
    if (drag.current && e.key === 'Escape') {
      e.preventDefault();
      cancelDrag();
      return;
    }
    const available = frame.current?.getBoundingClientRect().width ?? 1000;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      setFold(null);
      setRatio((v) => boundedRatio((fold ? 50 : v) + (e.key === 'ArrowLeft' ? -5 : 5), available));
    }
    if (e.key === 'Home') { e.preventDefault(); setFold('left'); }
    if (e.key === 'End') { e.preventDefault(); setFold('right'); }
  }

  // Collapsed panel leaves room for a focusable persistent handle. Responsive
  // parent should switch to a single column/drawer if it cannot provide 600px.
  const tracks = fold === 'left' ? '0px 10px minmax(0, 1fr)'
    : fold === 'right' ? 'minmax(0, 1fr) 10px 0px'
    : `minmax(0, ${ratio}fr) 10px minmax(0, ${100 - ratio}fr)`;

  return (
    <div ref={frame} className="resizable-workspace" style={{
      position: 'relative', display: 'grid', gridTemplateColumns: tracks, width: '100%', height: '100%',
      minWidth: 0, minHeight: 0, overflow: 'hidden'
    }}>
      <section aria-label="左面板" style={{ minWidth: 0, minHeight: 0, overflow: fold === 'left' ? 'hidden' : 'auto' }}>
        {fold !== 'left' && left}
      </section>
      <div role="separator" tabIndex={0} aria-orientation="vertical"
        aria-label="调整左右面板宽度" aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={fold === 'left' ? 0 : fold === 'right' ? 100 : Math.round(ratio)}
        title="左右拖动调整宽度，方向键微调；Home/End 折叠；Esc 取消拖动"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={cancelDrag}
        onKeyDown={onKeyboard}
        style={{ cursor: 'col-resize', touchAction: 'none', background: dragging ? '#91b5a6' : '#d8e1dc', outlineOffset: 1 }}
      />
      <section aria-label="右面板" style={{ minWidth: 0, minHeight: 0, overflow: fold === 'right' ? 'hidden' : 'auto' }}>
        {fold !== 'right' && right}
      </section>
      {fold !== null && <button type="button" onClick={() => { setFold(null); setRatio(50); }}
        style={{ position: 'absolute', right: 12, bottom: 12 }}>
        恢复分屏
      </button>}
    </div>
  );
}
