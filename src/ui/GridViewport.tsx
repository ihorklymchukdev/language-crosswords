import { useEffect, useRef, type ReactNode } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import { cellSpan, revealOffset, type Span } from './grid-scroll';
import { GRID_GAP } from './Grid';

type Props = {
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
  cols: number;
  cellSize: number;
  // -1 when nothing is selected (puzzle complete).
  cursor: number;
  activeCells: readonly number[];
  children: ReactNode;
};

type Focus = { x: Span; y: Span; cx: Span; cy: Span };

function focusOf(cursor: number, cells: readonly number[], cols: number, size: number): Focus {
  const rows = cells.map((c) => Math.floor(c / cols));
  const colsOf = cells.map((c) => c % cols);
  const r = Math.floor(cursor / cols);
  const c = cursor % cols;
  return {
    x: cellSpan(Math.min(c, ...colsOf), Math.max(c, ...colsOf), size, GRID_GAP),
    y: cellSpan(Math.min(r, ...rows), Math.max(r, ...rows), size, GRID_GAP),
    cx: cellSpan(c, c, size, GRID_GAP),
    cy: cellSpan(r, r, size, GRID_GAP),
  };
}

// Vertical scroll wrapping horizontal: the one nesting that pans both ways on iOS, Android and web.
export function GridViewport({
  width,
  height,
  contentWidth,
  contentHeight,
  cols,
  cellSize,
  cursor,
  activeCells,
  children,
}: Props) {
  const outer = useRef<ScrollViewInstance>(null);
  const inner = useRef<ScrollViewInstance>(null);
  const offset = useRef({ x: 0, y: 0 });
  const scrollX = contentWidth > width;
  const scrollY = contentHeight > height;
  // Web scrollbars take layout space and would cover the last column.
  const indicators = Platform.OS !== 'web';

  useEffect(() => {
    if (cursor < 0 || (!scrollX && !scrollY)) return;
    const f = focusOf(cursor, activeCells, cols, cellSize);
    const x = revealOffset(offset.current.x, width, contentWidth, f.x, f.cx);
    const y = revealOffset(offset.current.y, height, contentHeight, f.y, f.cy);
    // Always issued: a scroll dropped before the first layout would otherwise never be retried.
    if (scrollX) inner.current?.scrollTo({ x, animated: true });
    if (scrollY) outer.current?.scrollTo({ y, animated: true });
    // Store the target now so a quick second move measures from where we are heading.
    offset.current = { x, y };
  }, [cursor, activeCells, cols, cellSize, width, height, contentWidth, contentHeight, scrollX, scrollY]);

  const onScrollX = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current.x = e.nativeEvent.contentOffset.x;
  };
  const onScrollY = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current.y = e.nativeEvent.contentOffset.y;
  };

  return (
    <ScrollView
      ref={outer}
      style={[styles.viewport, { width, height }]}
      scrollEnabled={scrollY}
      onScroll={onScrollY}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={indicators && scrollY}
      bounces={false}
      nestedScrollEnabled
    >
      <ScrollView
        ref={inner}
        horizontal
        style={{ width }}
        scrollEnabled={scrollX}
        onScroll={onScrollX}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={indicators && scrollX}
        bounces={false}
        nestedScrollEnabled
      >
        {children}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  viewport: { flexGrow: 0, flexShrink: 0, alignSelf: 'center' },
});
