export type Span = { start: number; end: number };

// Pixel span covering cells first..last (inclusive) along one axis.
export function cellSpan(first: number, last: number, cellSize: number, gap: number): Span {
  return { start: first * (cellSize + gap), end: last * (cellSize + gap) + cellSize };
}

// Smallest scroll that brings the word into view, or just the cursor when the word is longer than the viewport.
export function revealOffset(offset: number, viewport: number, content: number, word: Span, cursor: Span): number {
  const target = word.end - word.start <= viewport ? word : cursor;
  let next = offset;
  if (target.start < next) next = target.start;
  else if (target.end > next + viewport) next = target.end - viewport;
  return Math.min(Math.max(next, 0), Math.max(content - viewport, 0));
}
