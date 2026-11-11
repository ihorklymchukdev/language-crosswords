import { cellSpan, revealOffset } from './grid-scroll';

// 10 cells of 36px with 1px gaps: content is 369px, viewport shows 200px.
const span = (a: number, b: number) => cellSpan(a, b, 36, 1);
const CONTENT = span(0, 9).end;
const VIEW = 200;

describe('revealOffset', () => {
  it('leaves the scroll alone when the word is already visible', () => {
    expect(revealOffset(37, VIEW, CONTENT, span(1, 3), span(2, 2))).toBe(37);
  });

  it('scrolls back so a word starting above the viewport begins at its edge', () => {
    expect(revealOffset(150, VIEW, CONTENT, span(2, 4), span(2, 2))).toBe(span(2, 2).start);
  });

  it('scrolls forward just far enough to show the end of the word', () => {
    expect(revealOffset(0, VIEW, CONTENT, span(4, 6), span(4, 4))).toBe(span(6, 6).end - VIEW);
  });

  it('follows the cursor when the word is longer than the viewport', () => {
    expect(revealOffset(0, VIEW, CONTENT, span(0, 9), span(8, 8))).toBe(span(8, 8).end - VIEW);
  });

  it('never scrolls past the end of the content', () => {
    expect(revealOffset(500, VIEW, CONTENT, span(9, 9), span(9, 9))).toBe(CONTENT - VIEW);
  });

  it('stays at zero when the content fits the viewport', () => {
    expect(revealOffset(0, 400, CONTENT, span(9, 9), span(9, 9))).toBe(0);
  });
});
