/**
 * @module components/optimized/VirtualList
 *
 * Virtual scrolling list component for rendering large datasets efficiently.
 * Only renders visible items, dramatically improving performance for long lists.
 */

import React, { useRef, useEffect, useState, useCallback, CSSProperties } from "react";
import { useDebounce } from "@/hooks/usePerformance";

interface VirtualListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the container in pixels */
  containerHeight: number;
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Number of items to render outside visible area (buffer) */
  overscan?: number;
  /** Additional container class name */
  className?: string;
  /** Callback when scroll reaches end */
  onEndReached?: () => void;
  /** Threshold for onEndReached (px from bottom) */
  endReachedThreshold?: number;
}

/**
 * Virtual list component that only renders visible items.
 * 
 * @example
 * <VirtualList
 *   items={transactions}
 *   itemHeight={80}
 *   containerHeight={600}
 *   renderItem={(tx, index) => <TransactionRow key={tx.id} transaction={tx} />}
 *   overscan={5}
 * />
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = "",
  onEndReached,
  endReachedThreshold = 100,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Offset for visible items
  const offsetY = startIndex * itemHeight;

  // Handle scroll with debounce
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);

    // Check if reached end
    if (onEndReached) {
      const distanceFromBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;

      if (distanceFromBottom < endReachedThreshold) {
        onEndReached();
      }
    }
  }, [onEndReached, endReachedThreshold]);

  const debouncedScroll = useDebounce(handleScroll, 16); // ~60fps

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={debouncedScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for virtual scrolling logic (can be used independently).
 */
export function useVirtualScroll(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
): {
  scrollTop: number;
  setScrollTop: (scrollTop: number) => void;
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
  visibleCount: number;
} {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const totalHeight = itemCount * itemHeight;
  const offsetY = startIndex * itemHeight;
  const visibleCount = endIndex - startIndex + 1;

  return {
    scrollTop,
    setScrollTop,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    visibleCount,
  };
}
