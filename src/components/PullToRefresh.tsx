import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowDown, RefreshCw, CheckCircle2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  threshold?: number;
  maxPull?: number;
  className?: string;
  pullLabel?: string;
  releaseLabel?: string;
  refreshingLabel?: string;
  successLabel?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 64,
  maxPull = 96,
  className = '',
  pullLabel = 'Pull down to sync trip data',
  releaseLabel = 'Release to sync now',
  refreshingLabel = 'Syncing latest trip updates...',
  successLabel = 'Trip synced!',
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Just now');

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isPullingRef = useRef(false);
  const canPullRef = useRef(false);

  // Helper to find whether the current scroll position is at the very top
  const isAtTopOfScroll = useCallback(() => {
    if (!containerRef.current) return true;
    
    // Check if the window is scrolled
    if (window.scrollY > 2) return false;

    // Check ancestors for scroll positions
    let current: HTMLElement | null = containerRef.current;
    while (current && current !== document.body) {
      if (current.scrollTop > 2) return false;
      current = current.parentElement;
    }

    return true;
  }, []);

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setIsSuccess(false);
    setPullDistance(52); // Keep indicator visible while syncing

    try {
      await Promise.resolve(onRefresh());
      setIsSuccess(true);
      const now = new Date();
      setLastSyncedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      // Hold success indicator briefly before collapsing
      await new Promise((resolve) => setTimeout(resolve, 600));
    } catch (err) {
      console.error('Failed to sync trip data:', err);
    } finally {
      setIsRefreshing(false);
      setIsSuccess(false);
      setPullDistance(0);
      isPullingRef.current = false;
    }
  }, [onRefresh]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    if (isAtTopOfScroll()) {
      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      canPullRef.current = true;
      isPullingRef.current = false;
    } else {
      canPullRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canPullRef.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = currentY - startYRef.current;
    const diffX = currentX - startXRef.current;

    // If scrolling upwards or moving horizontally more than vertically, ignore
    if (diffY <= 0 || Math.abs(diffX) > diffY) {
      if (!isPullingRef.current) {
        canPullRef.current = false;
        setPullDistance(0);
      }
      return;
    }

    // Must be at the very top of the scrollable container
    if (!isAtTopOfScroll()) {
      canPullRef.current = false;
      setPullDistance(0);
      return;
    }

    isPullingRef.current = true;
    // Logarithmic / exponential resistance formula for smooth native pull feel
    const distance = Math.min(maxPull, Math.pow(diffY, 0.84) * 1.1);
    setPullDistance(distance);
  };

  const handleTouchEnd = () => {
    if (!isPullingRef.current || isRefreshing) {
      canPullRef.current = false;
      isPullingRef.current = false;
      setPullDistance(0);
      return;
    }

    canPullRef.current = false;
    if (pullDistance >= threshold) {
      triggerRefresh();
    } else {
      setPullDistance(0);
      isPullingRef.current = false;
    }
  };

  // Pointer/Mouse handlers (enables desktop testing & trackpad pulls)
  const isPointerDownRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (isRefreshing) return;

    if (isAtTopOfScroll()) {
      startYRef.current = e.clientY;
      startXRef.current = e.clientX;
      isPointerDownRef.current = true;
      canPullRef.current = true;
      isPullingRef.current = false;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current || !canPullRef.current || isRefreshing) return;

    const diffY = e.clientY - startYRef.current;
    const diffX = e.clientX - startXRef.current;

    if (diffY <= 0 || Math.abs(diffX) > diffY) {
      return;
    }

    if (!isAtTopOfScroll()) {
      canPullRef.current = false;
      isPointerDownRef.current = false;
      setPullDistance(0);
      return;
    }

    isPullingRef.current = true;
    const distance = Math.min(maxPull, Math.pow(diffY, 0.84) * 1.1);
    setPullDistance(distance);
  };

  const handlePointerUp = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    if (!isPullingRef.current || isRefreshing) {
      canPullRef.current = false;
      isPullingRef.current = false;
      setPullDistance(0);
      return;
    }

    canPullRef.current = false;
    if (pullDistance >= threshold) {
      triggerRefresh();
    } else {
      setPullDistance(0);
      isPullingRef.current = false;
    }
  };

  const progress = Math.min(1, pullDistance / threshold);
  const isReadyToRelease = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative select-none ${className}`}
    >
      {/* Pull Indicator Banner */}
      <div
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 8 ? 1 : 0,
          transition: isPullingRef.current ? 'none' : 'height 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s',
        }}
        className="overflow-hidden flex items-center justify-center pointer-events-none relative"
      >
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm text-xs font-semibold">
          {isRefreshing ? (
            isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">{successLabel}</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
                <span className="text-indigo-600 dark:text-indigo-400">{refreshingLabel}</span>
              </>
            )
          ) : (
            <>
              <ArrowDown
                style={{
                  transform: `rotate(${progress * 180}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className={`w-4 h-4 transition-colors shrink-0 ${
                  isReadyToRelease 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              />
              <span
                className={`transition-colors ${
                  isReadyToRelease 
                    ? 'text-emerald-700 dark:text-emerald-300 font-bold' 
                    : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {isReadyToRelease ? releaseLabel : pullLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Manual Sync Bar for Immediate Desktop / Click Accessibility */}
      <div className="px-4 py-1.5 flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800/80 mb-2">
        <span className="flex items-center gap-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>Synced {lastSyncedTime}</span>
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerRefresh();
          }}
          disabled={isRefreshing}
          className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium active:scale-95 transition-transform px-2 py-0.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/60"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div
        style={
          pullDistance > 0
            ? {
                transform: `translateY(${pullDistance * 0.25}px)`,
                transition: isPullingRef.current ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
};
