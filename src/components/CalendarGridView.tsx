import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  Vote, 
  Lock, 
  Utensils, 
  Landmark, 
  Sparkles, 
  Moon, 
  Bed, 
  Train,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Trip, User, ItineraryEvent, EventCategory } from '../types';
import { formatMoney } from '../utils/currency';
import { getEventAttendees, getUserEventShare } from '../utils/debtSimplification';

interface CalendarGridViewProps {
  trip: Trip;
  currentUser: User;
  events: ItineraryEvent[];
  onSelectEvent: (event: ItineraryEvent) => void;
  onOpenProposeEventModal: (initialDate?: string) => void;
  onVoteEvent?: (eventId: string, vote: 'in' | 'skip') => void;
  onLockEvent?: (eventId: string) => void;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}

// Hourly parameters: 8 AM to 10 PM (14 hours)
const START_HOUR = 8;
const END_HOUR = 22;
const HOUR_HEIGHT = 64; // px per hour
const TOTAL_HOURS = END_HOUR - START_HOUR + 1;
const GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export interface PositionedEvent {
  event: ItineraryEvent;
  top: number;
  height: number;
  colIndex: number;
  totalCols: number;
  isConcurrent: boolean;
}

/**
 * Calculates side-by-side positions for concurrent/overlapping events on a single day.
 */
export function layoutDayEvents(dayEvents: ItineraryEvent[], customHourHeight = HOUR_HEIGHT): PositionedEvent[] {
  if (dayEvents.length === 0) return [];

  // 1. Sort by start time, then duration descending
  const sorted = [...dayEvents].sort((a, b) => {
    const startA = timeToMinutes(a.startTime);
    const startB = timeToMinutes(b.startTime);
    if (startA !== startB) return startA - startB;
    const durA = timeToMinutes(a.endTime) - startA;
    const durB = timeToMinutes(b.endTime) - startB;
    return durB - durA;
  });

  const baseMinutes = START_HOUR * 60;

  // 2. Identify clusters of overlapping events
  const clusters: ItineraryEvent[][] = [];
  let currentCluster: ItineraryEvent[] = [];
  let clusterEnd = -1;

  for (const event of sorted) {
    const start = timeToMinutes(event.startTime);
    const end = Math.max(timeToMinutes(event.endTime), start + 30);

    if (currentCluster.length === 0) {
      currentCluster.push(event);
      clusterEnd = end;
    } else if (start < clusterEnd) {
      // Overlaps with current cluster
      currentCluster.push(event);
      clusterEnd = Math.max(clusterEnd, end);
    } else {
      // Start a new cluster
      clusters.push(currentCluster);
      currentCluster = [event];
      clusterEnd = end;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // 3. For each cluster, assign columns greedily
  const result: PositionedEvent[] = [];

  for (const cluster of clusters) {
    const isConcurrentCluster = cluster.length > 1;
    const columns: number[] = []; // tracks the end time of the event in each sub-column

    const clusterEvents: { event: ItineraryEvent; colIndex: number; top: number; height: number }[] = [];

    for (const event of cluster) {
      const start = timeToMinutes(event.startTime);
      const end = Math.max(timeToMinutes(event.endTime), start + 30);

      // Clamp start to START_HOUR
      const clampedStart = Math.max(start, baseMinutes);
      const top = Math.max(0, ((clampedStart - baseMinutes) / 60) * customHourHeight);
      const durationMins = Math.max(end - clampedStart, 30);
      const height = Math.max(34, (durationMins / 60) * customHourHeight);

      // Find first column where event fits without overlap
      let assignedCol = -1;
      for (let i = 0; i < columns.length; i++) {
        if (columns[i] <= start) {
          assignedCol = i;
          columns[i] = end;
          break;
        }
      }

      if (assignedCol === -1) {
        assignedCol = columns.length;
        columns.push(end);
      }

      clusterEvents.push({ event, colIndex: assignedCol, top, height });
    }

    const totalCols = columns.length;

    for (const item of clusterEvents) {
      result.push({
        event: item.event,
        top: item.top,
        height: item.height,
        colIndex: item.colIndex,
        totalCols,
        isConcurrent: isConcurrentCluster,
      });
    }
  }

  return result;
}

export const CalendarGridView: React.FC<CalendarGridViewProps> = ({
  trip,
  currentUser,
  events,
  onSelectEvent,
  onOpenProposeEventModal,
  selectedDate,
  onSelectDate,
}) => {
  const gridScrollRef = React.useRef<HTMLDivElement>(null);

  // Determine initial week start based on trip start date or first event
  const initialBaseDate = useMemo(() => {
    const dateStr = (selectedDate && selectedDate !== 'all' ? selectedDate : null) || trip.startDate || (events[0] ? events[0].date : '2026-11-05');
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [trip.startDate, events, selectedDate]);

  // Current anchor date for the week (e.g. Monday of the visible week)
  const [weekAnchorDate, setWeekAnchorDate] = useState<Date>(() => {
    const d = new Date(initialBaseDate);
    // Align to Monday of that week
    const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon...
    const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    d.setDate(d.getDate() + diff);
    return d;
  });

  // Track active focused day
  const [activeDayStr, setActiveDayStr] = useState<string>(() => {
    return (selectedDate && selectedDate !== 'all' ? selectedDate : null) || trip.startDate || '2026-11-05';
  });

  // Generate 7 days for the week
  const weekDays = useMemo(() => {
    const days: { dateStr: string; dateObj: Date; dayName: string; dayNum: number; isTripDay: boolean; tripDayIndex?: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekAnchorDate);
      d.setDate(d.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
      const isTripDay = dateStr >= trip.startDate && dateStr <= trip.endDate;
      
      let tripDayIndex: number | undefined = undefined;
      if (isTripDay) {
        const [sy, sm, sd] = trip.startDate.split('-').map(Number);
        const start = new Date(sy, sm - 1, sd);
        const diffDays = Math.round((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        tripDayIndex = diffDays + 1;
      }

      days.push({
        dateStr,
        dateObj: d,
        dayName,
        dayNum: d.getDate(),
        isTripDay,
        tripDayIndex,
      });
    }
    return days;
  }, [weekAnchorDate, trip.startDate, trip.endDate]);

  // Scroll to a specific day column smoothly
  const scrollToDay = (dateStr: string) => {
    setActiveDayStr(dateStr);
    if (onSelectDate) onSelectDate(dateStr);

    requestAnimationFrame(() => {
      const colEl = document.getElementById(`calendar-col-${dateStr}`);
      if (colEl && gridScrollRef.current) {
        colEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  };

  // Day step prev/next handlers
  const currentDayIndex = weekDays.findIndex(d => d.dateStr === activeDayStr);
  const handlePrevDay = () => {
    if (currentDayIndex > 0) {
      scrollToDay(weekDays[currentDayIndex - 1].dateStr);
    } else {
      // Step back a week
      handlePrevWeek();
    }
  };

  const handleNextDay = () => {
    if (currentDayIndex < weekDays.length - 1) {
      scrollToDay(weekDays[currentDayIndex + 1].dateStr);
    } else {
      // Step next week
      handleNextWeek();
    }
  };

  // Auto-scroll to active day on mount or week change
  React.useEffect(() => {
    const targetDate = weekDays.some(d => d.dateStr === activeDayStr)
      ? activeDayStr
      : weekDays.find(d => d.isTripDay)?.dateStr || weekDays[0].dateStr;
    
    const timer = setTimeout(() => {
      scrollToDay(targetDate);
    }, 150);
    return () => clearTimeout(timer);
  }, [weekAnchorDate]);

  // Navigate weeks
  const handlePrevWeek = () => {
    setWeekAnchorDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setWeekAnchorDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleJumpToTrip = () => {
    const d = new Date(initialBaseDate);
    const dayOfWeek = d.getDay();
    const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    d.setDate(d.getDate() + diff);
    setWeekAnchorDate(d);
    scrollToDay(trip.startDate);
  };

  // Week range label
  const weekRangeLabel = useMemo(() => {
    const first = weekDays[0].dateObj;
    const last = weekDays[6].dateObj;
    const firstStr = first.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const lastStr = last.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${firstStr} – ${lastStr}`;
  }, [weekDays]);

  // Pre-calculate positioned events for each day
  const eventsByDay = useMemo(() => {
    const map: Record<string, PositionedEvent[]> = {};
    for (const day of weekDays) {
      const dayEvts = events.filter((e) => !e.isAdHocExpense && e.date === day.dateStr);
      map[day.dateStr] = layoutDayEvents(dayEvts);
    }
    return map;
  }, [weekDays, events]);

  // Count total concurrent events in the visible week
  const totalConcurrentInWeek = useMemo(() => {
    let count = 0;
    Object.values(eventsByDay).forEach((dayList) => {
      count += dayList.filter((item) => item.isConcurrent).length;
    });
    return count;
  }, [eventsByDay]);

  const getCategoryTheme = (category: EventCategory, isProposed: boolean) => {
    if (isProposed) {
      return {
        bg: 'bg-amber-50/95 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700/80 border-dashed text-amber-950 dark:text-amber-100',
        bar: 'bg-amber-500',
        badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
      };
    }
    switch (category) {
      case 'dining':
        return {
          bg: 'bg-orange-50/95 dark:bg-orange-950/80 border-orange-200 dark:border-orange-800/60 text-orange-950 dark:text-orange-100',
          bar: 'bg-orange-500',
          badge: 'bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200'
        };
      case 'culture':
        return {
          bg: 'bg-indigo-50/95 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-100',
          bar: 'bg-indigo-600',
          badge: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200'
        };
      case 'activity':
        return {
          bg: 'bg-emerald-50/95 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100',
          bar: 'bg-emerald-600',
          badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
        };
      case 'nightlife':
        return {
          bg: 'bg-purple-50/95 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800/60 text-purple-950 dark:text-purple-100',
          bar: 'bg-purple-600',
          badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200'
        };
      case 'lodging':
        return {
          bg: 'bg-blue-50/95 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800/60 text-blue-950 dark:text-blue-100',
          bar: 'bg-blue-600',
          badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
        };
      case 'transit':
      default:
        return {
          bg: 'bg-cyan-50/95 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-800/60 text-cyan-950 dark:text-cyan-100',
          bar: 'bg-cyan-600',
          badge: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200'
        };
    }
  };

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
      
      {/* 1. Week Navigation Bar */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-neutral-50/70 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-0.5 shadow-2xs">
            <button
              onClick={handlePrevWeek}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all active:scale-95"
              title="Previous Week"
              aria-label="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextWeek}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all active:scale-95"
              title="Next Week"
              aria-label="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <h3 className="text-[clamp(0.75rem,2.2vw,0.875rem)] font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{weekRangeLabel}</span>
            </h3>

            <button
              onClick={handleJumpToTrip}
              className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-[clamp(0.625rem,1.8vw,0.6875rem)] font-bold transition-all active:scale-95 flex items-center"
            >
              Trip Week
            </button>
          </div>
        </div>

        {/* Day Stepper & Concurrent Indicator */}
        <div className="flex items-center gap-2">
          {totalConcurrentInWeek > 0 && (
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900 text-[10px] sm:text-[11px] font-medium">
              <Layers className="w-3 h-3 text-amber-500" />
              <span>{totalConcurrentInWeek} Concurrent</span>
            </span>
          )}

          {/* Stepper buttons to jump days easily on mobile */}
          <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-0.5">
            <button
              onClick={handlePrevDay}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-1 active:scale-95 transition-all min-h-[36px]"
              title="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="text-[11px]">Prev</span>
            </button>
            <button
              onClick={handleNextDay}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-1 active:scale-95 transition-all min-h-[36px]"
              title="Next Day"
            >
              <span className="text-[11px]">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Day Quick-Selector Bar (Tap to move calendar instantly!) */}
      <div className="px-3 py-2 bg-neutral-100/60 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 shrink-0 mr-1 hidden sm:inline">
          Tap Day:
        </span>
        {weekDays.map((day) => {
          const isActive = day.dateStr === activeDayStr;
          const isToday = new Date().toDateString() === day.dateObj.toDateString();
          const dayEventCount = (eventsByDay[day.dateStr] || []).length;

          return (
            <button
              key={day.dateStr}
              onClick={() => scrollToDay(day.dateStr)}
              className={`min-h-[38px] px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs font-bold ring-2 ring-indigo-400/40'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
            >
              <span>{day.dayName}</span>
              <span className="font-mono text-[11px] opacity-90">{day.dayNum}</span>
              {day.tripDayIndex && (
                <span className={`text-[9px] font-bold px-1 rounded ${isActive ? 'bg-white/25 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'}`}>
                  D{day.tripDayIndex}
                </span>
              )}
              {dayEventCount > 0 && (
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-indigo-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Scrollable 7-Day Grid Viewport */}
      <div
        ref={gridScrollRef}
        className="overflow-x-auto relative scroll-smooth snap-x snap-mandatory touch-pan-x"
      >
        <div className="min-w-[960px] flex flex-col">
          
          {/* Day Headers (7 Columns) */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 sticky top-0 z-20 backdrop-blur-xs">
            {/* Time label placeholder */}
            <div className="py-2.5 px-1 border-r border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-400 text-center flex items-center justify-center">
              Time
            </div>

            {weekDays.map((day) => {
              const isToday = new Date().toDateString() === day.dateObj.toDateString();
              const isActive = day.dateStr === activeDayStr;
              const dayEventCount = (eventsByDay[day.dateStr] || []).length;
              return (
                <button
                  key={day.dateStr}
                  onClick={() => scrollToDay(day.dateStr)}
                  className={`py-2 px-1 text-center border-r last:border-r-0 border-neutral-200 dark:border-neutral-800 transition-all cursor-pointer snap-start ${
                    isActive
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-inset ring-indigo-500/50'
                      : day.isTripDay 
                      ? 'bg-indigo-50/20 dark:bg-indigo-950/10 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  title={`Tap to focus ${day.dayName} ${day.dayNum}`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className={`text-[11px] font-bold uppercase ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-500'}`}>
                      {day.dayName}
                    </span>
                    {day.tripDayIndex && (
                      <span className="text-[9px] font-bold px-1 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                        D{day.tripDayIndex}
                      </span>
                    )}
                  </div>

                  <div className="mt-0.5 flex items-center justify-center gap-1">
                    <span className={`text-sm font-bold font-mono inline-block w-6 h-6 rounded-full leading-6 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : isToday 
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-2xs' 
                        : 'text-neutral-900 dark:text-neutral-100'
                    }`}>
                      {day.dayNum}
                    </span>

                    {dayEventCount > 0 && (
                      <span className="text-[9px] font-mono font-bold text-neutral-400">
                        · {dayEventCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Time Rows and Event Canvas */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] relative" style={{ height: `${GRID_HEIGHT}px` }}>
            
            {/* Left Time Axis */}
            <div className="border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/60 select-none">
              {hours.map((hour) => {
                const displayTime = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
                return (
                  <div
                    key={hour}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="border-b border-neutral-100 dark:border-neutral-800/80 pr-1.5 text-right flex items-start justify-end"
                  >
                    <span className="text-[10px] font-mono text-neutral-400 -mt-2">
                      {displayTime}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 7 Day Columns with Events */}
            {weekDays.map((day) => {
              const dayPositionedEvents = eventsByDay[day.dateStr] || [];
              const isActive = day.dateStr === activeDayStr;

              return (
                <div
                  key={day.dateStr}
                  id={`calendar-col-${day.dateStr}`}
                  className={`relative border-r last:border-r-0 border-neutral-200 dark:border-neutral-800 transition-colors snap-start ${
                    isActive
                      ? 'bg-indigo-50/[0.08] dark:bg-indigo-950/[0.15]'
                      : day.isTripDay ? 'bg-indigo-50/[0.03]' : ''
                  }`}
                >
                  {/* Horizontal Hour Grid Lines */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      onClick={() => onOpenProposeEventModal(day.dateStr)}
                      style={{ height: `${HOUR_HEIGHT}px` }}
                      className="border-b border-neutral-100 dark:border-neutral-800/60 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 cursor-pointer transition-colors"
                      title={`Click to add activity on ${day.dayName} at ${hour}:00`}
                    />
                  ))}

                  {/* Rendered Event Blocks */}
                  {dayPositionedEvents.map(({ event, top, height, colIndex, totalCols, isConcurrent }) => {
                    const isProposed = event.status === 'proposed';
                    const theme = getCategoryTheme(event.category, isProposed);
                    const userVote = event.votes[currentUser.id];
                    const attendees = getEventAttendees(event, trip.members);
                    const userShare = getUserEventShare(event, currentUser.id, attendees);

                    // Width & Left offsets for concurrent layout
                    const colWidthPct = 100 / totalCols;
                    const leftPct = colIndex * colWidthPct;

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(event);
                        }}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          left: `${leftPct}%`,
                          width: `${colWidthPct}%`,
                        }}
                        className={`absolute rounded-lg border p-1 sm:p-1.5 transition-all cursor-pointer hover:z-30 hover:shadow-md group overflow-hidden ${theme.bg}`}
                        title={`${event.title} (${event.startTime}-${event.endTime}) - Click for details`}
                      >
                        {/* Accent Bar */}
                        <div className={`absolute top-0 bottom-0 left-0 w-1 ${theme.bar}`} />

                        <div className="pl-1 h-full flex flex-col justify-between text-[10px] leading-tight select-none">
                          <div>
                            {/* Time & Concurrent Badge */}
                            <div className="flex items-center justify-between gap-0.5 text-[9px] font-mono opacity-80 mb-0.5 font-bold">
                              <span className="truncate">{event.startTime}</span>
                              {isConcurrent && (
                                <span className="w-3.5 h-3.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-[8px]" title="Concurrent / Overlapping Activity">
                                  !
                                </span>
                              )}
                            </div>

                            {/* Event Title */}
                            <h5 className="font-bold truncate text-[10px] sm:text-[11px] group-hover:underline">
                              {event.title}
                            </h5>

                            {/* Venue / Category (shown if block is tall enough) */}
                            {height >= 48 && (
                              <p className="text-[9px] opacity-75 truncate mt-0.5">
                                {event.location}
                              </p>
                            )}
                          </div>

                          {/* Footer: Share & Status */}
                          {height >= 56 && (
                            <div className="pt-0.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[9px] font-mono">
                              <span className="font-bold">
                                {formatMoney(event.totalCost, event.currency)}
                              </span>
                              {isProposed ? (
                                <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400">
                                  Vote
                                </span>
                              ) : (
                                <span className="opacity-70">
                                  {userVote === 'in' ? formatMoney(userShare, event.currency) : '$0'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              );
            })}

          </div>

        </div>
      </div>

      {/* 3. Footer Legend */}
      <div className="px-4 py-2 bg-neutral-50/80 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">Legend:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
            <span>Dining</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
            <span>Culture</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
            <span>Outdoor</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-600" />
            <span>Nightlife</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-amber-500 bg-amber-100 dark:bg-amber-950" />
            <span>Proposed</span>
          </span>
        </div>

        <button
          onClick={() => onOpenProposeEventModal(trip.startDate)}
          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold flex items-center gap-1.5 transition-all active:scale-95 text-[clamp(0.6875rem,2vw,0.75rem)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Activity</span>
        </button>
      </div>

    </div>
  );
};
