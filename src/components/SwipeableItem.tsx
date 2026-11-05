import React, { useState, useRef } from 'react';

interface SwipeableItemProps {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  rightActionLabel?: string;
  rightActionIcon?: React.ReactNode;
  rightActionColor?: string; // background color for right swipe (revealed on left)
  onSwipeLeft?: () => void;
  leftActionLabel?: string;
  leftActionIcon?: React.ReactNode;
  leftActionColor?: string; // background color for left swipe (revealed on right)
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  onSwipeRight,
  rightActionLabel = 'Action',
  rightActionIcon,
  rightActionColor = 'bg-emerald-600 text-white',
  onSwipeLeft,
  leftActionLabel = 'Delete',
  leftActionIcon,
  leftActionColor = 'bg-rose-600 text-white',
  threshold = 72,
  disabled = false,
  className = '',
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const isHorizontalScrollRef = useRef<boolean | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.PointerEvent) => {
    if (disabled) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startXRef.current = clientX;
    startYRef.current = clientY;
    isHorizontalScrollRef.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.PointerEvent) => {
    if (disabled || startXRef.current === null || startYRef.current === null) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const diffX = clientX - startXRef.current;
    const diffY = clientY - startYRef.current;

    // Detect direction on first movement
    if (isHorizontalScrollRef.current === null) {
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        isHorizontalScrollRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (!isHorizontalScrollRef.current) {
      return; // allow vertical page scrolling
    }

    // Only allow swipe in allowed directions
    let targetOffset = diffX;
    if (!onSwipeRight && targetOffset > 0) {
      targetOffset = 0;
    }
    if (!onSwipeLeft && targetOffset < 0) {
      targetOffset = 0;
    }

    // Resistance beyond threshold
    const maxDrag = threshold * 1.5;
    if (Math.abs(targetOffset) > threshold) {
      const excess = Math.abs(targetOffset) - threshold;
      const damped = threshold + excess * 0.35;
      targetOffset = targetOffset > 0 ? damped : -damped;
    }

    // Prevent extreme dragging
    targetOffset = Math.max(-maxDrag, Math.min(maxDrag, targetOffset));

    setOffsetX(targetOffset);
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsDragging(false);

    if (offsetX >= threshold && onSwipeRight) {
      // Trigger right swipe action
      onSwipeRight();
    } else if (offsetX <= -threshold && onSwipeLeft) {
      // Trigger left swipe action
      onSwipeLeft();
    }

    // Spring back
    setOffsetX(0);
    startXRef.current = null;
    startYRef.current = null;
    isHorizontalScrollRef.current = null;
  };

  const isTriggeredRight = offsetX >= threshold;
  const isTriggeredLeft = offsetX <= -threshold;

  return (
    <div className={`relative overflow-hidden rounded-xl select-none touch-pan-y ${className}`}>
      {/* Background Actions Revealed on Swipe */}
      <div className="absolute inset-0 flex items-center justify-between pointer-events-none rounded-xl overflow-hidden">
        {/* Left Side (Revealed when swiping Right) */}
        {onSwipeRight ? (
          <div
            className={`h-full flex items-center px-4 gap-2 transition-all duration-150 ${rightActionColor} ${
              offsetX > 0 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ width: `${Math.max(0, offsetX)}px` }}
          >
            <div
              className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-bold transition-transform duration-150 ${
                isTriggeredRight ? 'scale-110 font-extrabold' : 'scale-95 opacity-80'
              }`}
            >
              {rightActionIcon}
              <span>{isTriggeredRight ? `Release: ${rightActionLabel}` : rightActionLabel}</span>
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* Right Side (Revealed when swiping Left) */}
        {onSwipeLeft ? (
          <div
            className={`h-full ml-auto flex items-center justify-end px-4 gap-2 transition-all duration-150 ${leftActionColor} ${
              offsetX < 0 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ width: `${Math.max(0, -offsetX)}px` }}
          >
            <div
              className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-bold transition-transform duration-150 ${
                isTriggeredLeft ? 'scale-110 font-extrabold' : 'scale-95 opacity-80'
              }`}
            >
              <span>{isTriggeredLeft ? `Release: ${leftActionLabel}` : leftActionLabel}</span>
              {leftActionIcon}
            </div>
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* Foreground Draggable Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onPointerDown={handleTouchStart}
        onPointerMove={handleTouchMove}
        onPointerUp={handleTouchEnd}
        onPointerCancel={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className="relative z-10 w-full bg-inherit"
      >
        {children}
      </div>
    </div>
  );
};
