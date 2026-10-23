/** Keep file extension visible, with full filename available to assistive tech. */
import type { CSSProperties } from 'react';

function splitFilename(name: string) {
  const pos = name.lastIndexOf('.');
  // Hidden dot-files and filenames without a normal extension stay as-is.
  if (pos <= 0 || pos === name.length - 1) return { stem: name, ext: '' };
  return { stem: name.slice(0, pos), ext: name.slice(pos) };
}

const base: CSSProperties = {
  display: 'inline-flex', alignItems: 'baseline', maxWidth: '100%', minWidth: 0,
};

export function FileNameChip({ filename }: { filename: string }) {
  const { stem, ext } = splitFilename(filename);
  return <span style={base} title={filename} aria-label={filename}>
    <span aria-hidden="true" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stem}</span>
    <span aria-hidden="true" style={{ flex: 'none', whiteSpace: 'nowrap' }}>{ext}</span>
  </span>;
}
