import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  List, 
  MapPin, 
  Footprints, 
  Train, 
  Car, 
  Bus, 
  Bike, 
  Ship, 
  Utensils, 
  Landmark, 
  Sparkles, 
  Moon, 
  Bed, 
  Lock, 
  Plus,
  Vote,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  CheckCircle2,
  Trash2,
  Edit3
} from 'lucide-react';
import { ItineraryEvent, Trip, User, TransitMode, EventCategory } from '../types';
import { formatMoney } from '../utils/currency';
import { getEventAttendees, getUserEventShare } from '../utils/debtSimplification';
import { EventDetailModal } from './EventDetailModal';
import { CalendarGridView, layoutDayEvents } from './CalendarGridView';
import { SwipeableItem } from './SwipeableItem';
import { PullToRefresh } from './PullToRefresh';

interface TimelineViewProps {
  trip: Trip;
  currentUser: User;
  events: ItineraryEvent[];
  onVoteEvent: (eventId: string, vote: 'in' | 'skip') => void;
  onLockEvent: (eventId: string) => void;
  onOpenProposeEventModal: (initialDate?: string) => void;
  onSelectEventForEdit?: (event: ItineraryEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  onOpenVenueMap: (event: ItineraryEvent, dayEvents: ItineraryEvent[]) => void;
  onRefresh?: () => Promise<void> | void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  trip,
  currentUser,
  events,
  onVoteEvent,
  onLockEvent,
  onOpenProposeEventModal,
  onSelectEventForEdit,
  onDeleteEvent,
  onOpenVenueMap,
  onRefresh,
}) => {
  // View mode: Week-at-a-glance Grid vs Single-Day Schedule vs Agenda Feed
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'list'>('week');
  
  // Status filter: All items vs Confirmed vs Proposals
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'proposed'>('all');

  // Dates
  const allDates = Array.from(new Set(events.map((e) => e.date))).sort();
  const [selectedDate, setSelectedDate] = useState<string>(allDates[0] || trip.startDate);

  // Detail Modal state
  const [detailEvent, setDetailEvent] = useState<ItineraryEvent | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const pendingProposalsCount = events.filter((e) => e.status === 'proposed').length;

  // Filter events based on active filters
  const filteredEvents = events
    .filter((e) => !e.isAdHocExpense)
    .filter((e) => {
      // Date filter
      if (selectedDate !== 'all' && e.date !== selectedDate) return false;
      // Status filter
      if (statusFilter === 'confirmed' && e.status === 'proposed') return false;
      if (statusFilter === 'proposed' && e.status !== 'proposed') return false;
      return true;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

  const dayEventsForMap = events.filter(
    (e) => !e.isAdHocExpense && (selectedDate === 'all' || e.date === selectedDate)
  );

  // Group filtered events by date for sticky-header day sections in chronological feed
  const eventsByDate = React.useMemo(() => {
    const map: Record<string, ItineraryEvent[]> = {};
    filteredEvents.forEach((evt) => {
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    });
    return map;
  }, [filteredEvents]);

  const groupedDates = React.useMemo(() => {
    return Object.keys(eventsByDate).sort();
  }, [eventsByDate]);

  const dayLayoutEvents = React.useMemo(() => {
    return layoutDayEvents(filteredEvents, 68);
  }, [filteredEvents]);

  const getCategoryIcon = (category: EventCategory) => {
    switch (category) {
      case 'dining': return <Utensils className="w-3.5 h-3.5 text-amber-500" />;
      case 'culture': return <Landmark className="w-3.5 h-3.5 text-indigo-500" />;
      case 'activity': return <Sparkles className="w-3.5 h-3.5 text-emerald-500" />;
      case 'nightlife': return <Moon className="w-3.5 h-3.5 text-purple-500" />;
      case 'lodging': return <Bed className="w-3.5 h-3.5 text-blue-500" />;
      case 'transit':
      default: return <Train className="w-3.5 h-3.5 text-cyan-500" />;
    }
  };

  const getCategoryTheme = (category: EventCategory, isProposed: boolean) => {
    if (isProposed) {
      return {
        bg: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 border-dashed text-amber-950 dark:text-amber-100',
        bar: 'bg-amber-500',
        badge: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
      };
    }
    switch (category) {
      case 'dining':
        return {
          bg: 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60 text-orange-950 dark:text-orange-100',
          bar: 'bg-orange-500',
          badge: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
        };
      case 'culture':
        return {
          bg: 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-100',
          bar: 'bg-indigo-600',
          badge: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
        };
      case 'activity':
        return {
          bg: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100',
          bar: 'bg-emerald-600',
          badge: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
        };
      case 'nightlife':
        return {
          bg: 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 text-purple-950 dark:text-purple-100',
          bar: 'bg-purple-600',
          badge: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
        };
      case 'lodging':
        return {
          bg: 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-950 dark:text-blue-100',
          bar: 'bg-blue-600',
          badge: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
        };
      case 'transit':
      default:
        return {
          bg: 'bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60 text-cyan-950 dark:text-cyan-100',
          bar: 'bg-cyan-600',
          badge: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200'
        };
    }
  };

  const getTransitIcon = (mode: TransitMode) => {
    switch (mode) {
      case 'walk': return <Footprints className="w-3 h-3" />;
      case 'train': return <Train className="w-3 h-3" />;
      case 'drive': return <Car className="w-3 h-3" />;
      case 'bike': return <Bike className="w-3 h-3" />;
      case 'boat': return <Ship className="w-3 h-3" />;
      case 'transit':
      default: return <Bus className="w-3 h-3" />;
    }
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleOpenDetail = (event: ItineraryEvent) => {
    setDetailEvent(event);
    setIsDetailModalOpen(true);
  };

  // Google Calendar Hourly Grid Configurations (8:00 AM to 10:00 PM)
  const START_HOUR = 8;
  const END_HOUR = 22;
  const HOUR_HEIGHT = 68; // px per hour
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const calculateEventPosition = (event: ItineraryEvent) => {
    const startMins = timeToMinutes(event.startTime);
    const endMins = timeToMinutes(event.endTime) || startMins + 60;
    const baseMins = START_HOUR * 60;

    const clampedStart = Math.max(startMins, baseMins);
    const top = ((clampedStart - baseMins) / 60) * HOUR_HEIGHT;
    const durationMins = Math.max(endMins - clampedStart, 30);
    const height = (durationMins / 60) * HOUR_HEIGHT;

    return { top: Math.max(0, top), height: Math.max(42, height) };
  };

  const activeDateIndex = allDates.indexOf(selectedDate);
  const handlePrevDay = () => {
    if (activeDateIndex > 0) setSelectedDate(allDates[activeDateIndex - 1]);
  };
  const handleNextDay = () => {
    if (activeDateIndex < allDates.length - 1) setSelectedDate(allDates[activeDateIndex + 1]);
  };

  return (
    <PullToRefresh onRefresh={onRefresh || (() => {})}>
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        
        {/* View Switcher & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        
        {/* Left: View Mode Toggle (Calendar vs List) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Week Grid</span>
            </button>

            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Day View</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <List className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Feed</span>
            </button>
          </div>

          {/* Quick status filter pills */}
          <div className="hidden sm:flex items-center gap-1 text-[11px]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              All ({events.filter(e => !e.isAdHocExpense).length})
            </button>

            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                statusFilter === 'confirmed'
                  ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Confirmed
            </button>

            {pendingProposalsCount > 0 && (
              <button
                onClick={() => setStatusFilter('proposed')}
                className={`min-h-[34px] px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  statusFilter === 'proposed'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-bold'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                <span>Proposals</span>
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {pendingProposalsCount}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Day Map (Google Maps) + Add Activity */}
        <div className="flex items-center gap-2 shrink-0">
          {dayEventsForMap.length > 0 && (
            <button
              onClick={() => onOpenVenueMap(dayEventsForMap[0], dayEventsForMap)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5"
              title="View all venue stops on Google Maps"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              <span>Day Map</span>
            </button>
          )}

          <button
            onClick={() => onOpenProposeEventModal(selectedDate === 'all' ? trip.startDate : selectedDate)}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Activity</span>
          </button>
        </div>

      </div>

      {/* VIEW MODE 1: WEEK-AT-A-GLANCE GRID (Standard multi-day view for visualizing concurrent events) */}
      {viewMode === 'week' && (
        <CalendarGridView
          trip={trip}
          currentUser={currentUser}
          events={events}
          onSelectEvent={handleOpenDetail}
          onOpenProposeEventModal={onOpenProposeEventModal}
          onVoteEvent={onVoteEvent}
          onLockEvent={onLockEvent}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}

      {/* Date Navigation Strip (Shown for Day View & Agenda Feed) */}
      {viewMode !== 'week' && (
        <div className="flex items-center justify-between gap-2 mb-4 bg-white dark:bg-neutral-900 p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-x-auto scrollbar-none">
          
          <div className="flex items-center gap-1">
            {viewMode === 'day' && (
              <div className="flex items-center mr-1">
                <button
                  onClick={handlePrevDay}
                  disabled={activeDateIndex <= 0}
                  className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 active:scale-95"
                  aria-label="Previous day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextDay}
                  disabled={activeDateIndex >= allDates.length - 1}
                  className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 active:scale-95"
                  aria-label="Next day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {viewMode === 'list' && (
              <button
                onClick={() => setSelectedDate('all')}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  selectedDate === 'all'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                All Days
              </button>
            )}

            {allDates.map((dateStr, idx) => {
              const count = events.filter((e) => !e.isAdHocExpense && e.date === dateStr).length;
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs font-bold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>Day {idx + 1}</span>
                  <span className="text-[10px] opacity-70">({formatDateLabel(dateStr).split(',')[0]})</span>
                  {count > 0 && (
                    <span className={`text-[10px] font-mono px-1 rounded-full ${isSelected ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-bold text-neutral-500 font-mono px-2 shrink-0 hidden sm:block">
            {selectedDate !== 'all' ? formatDateLabel(selectedDate) : 'Full Itinerary'}
          </div>

        </div>
      )}

      {/* VIEW MODE 2: SINGLE-DAY HOURLY SCHEDULE */}
      {viewMode === 'day' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          
          {/* Day Header Banner */}
          <div className="px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                {formatDateLabel(selectedDate === 'all' ? allDates[0] || trip.startDate : selectedDate)}
              </span>
              <span className="text-neutral-400">·</span>
              <span className="text-[11px] text-neutral-500">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'activity' : 'activities'} scheduled
              </span>
            </div>

            <span className="text-[10px] text-neutral-400">
              Tap any event for full details & map
            </span>
          </div>

          {/* Hourly Time Grid Container */}
          <div className="relative min-h-[600px] overflow-x-hidden p-2 sm:p-4">
            
            {/* Hourly Lines */}
            <div className="relative">
              {hours.map((hour) => {
                const displayTime = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
                return (
                  <div
                    key={hour}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="border-t border-neutral-100 dark:border-neutral-800/80 flex items-start"
                  >
                    <span className="w-12 sm:w-16 text-[10px] font-mono text-neutral-400 -mt-2 shrink-0 select-none">
                      {displayTime}
                    </span>
                    <div className="flex-1 h-full" />
                  </div>
                );
              })}
            </div>

            {/* Event Blocks Overlaid onto the Grid */}
            <div className="absolute top-2 sm:top-4 left-14 sm:left-18 right-2 sm:right-4 bottom-2 pointer-events-none">
              {dayLayoutEvents.map(({ event, top, height, colIndex, totalCols, isConcurrent }) => {
                const isProposed = event.status === 'proposed';
                const theme = getCategoryTheme(event.category, isProposed);
                const userVote = event.votes[currentUser.id];
                const attendees = getEventAttendees(event, trip.members);
                const userShare = getUserEventShare(event, currentUser.id, attendees);

                // Side-by-side column calculation for overlapping/concurrent events
                const colWidthPct = 100 / totalCols;
                const leftPct = colIndex * colWidthPct;

                return (
                  <div
                    key={event.id}
                    onClick={() => handleOpenDetail(event)}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      left: totalCols > 1 ? `calc(${leftPct}% + ${colIndex > 0 ? 3 : 0}px)` : '0%',
                      width: totalCols > 1 ? `calc(${colWidthPct}% - 4px)` : '100%',
                    }}
                    className={`absolute rounded-xl border p-2 sm:p-2.5 transition-all cursor-pointer pointer-events-auto hover:shadow-md group overflow-hidden ${
                      isConcurrent 
                        ? 'ring-2 ring-amber-400 dark:ring-amber-500/80 shadow-xs z-10' 
                        : ''
                    } ${theme.bg}`}
                  >
                    {/* Left Accent Color Strip */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1 ${isConcurrent ? 'bg-amber-500' : theme.bar}`} />

                    <div className="flex items-start justify-between gap-1 pl-1.5 h-full">
                      
                      <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
                        <div>
                          {/* Top Row: Time, Category & Overlap Tag */}
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold mb-0.5 flex-wrap">
                            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                              {event.startTime} - {event.endTime}
                            </span>
                            <span>·</span>
                            <span className="capitalize opacity-80">{event.category}</span>

                            {isConcurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white font-bold text-[9px] flex items-center gap-0.5 shadow-2xs">
                                ⚡ Overlap
                              </span>
                            )}

                            {isProposed && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[9px]">
                                Proposed ({attendees.length}/{trip.members.length} In)
                              </span>
                            )}
                          </div>

                          {/* Event Title */}
                          <h4 className="text-xs sm:text-sm font-bold truncate leading-tight group-hover:underline">
                            {event.title}
                          </h4>

                          {/* Location / Address */}
                          <p className="text-[10px] opacity-75 truncate mt-0.5 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span>{event.location}</span>
                          </p>
                        </div>

                        {/* Bottom Row: Cost and Quick Vote Pill */}
                        <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-black/5 dark:border-white/5">
                          <span className="font-mono font-bold">
                            {formatMoney(event.totalCost, event.currency)}
                            <span className="opacity-60 font-normal"> · You: {userVote === 'in' ? formatMoney(userShare, event.currency) : '$0'}</span>
                          </span>

                          <span className="text-[10px] font-semibold opacity-90 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            <span>Details</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}

              {/* Empty Schedule Notice */}
              {filteredEvents.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <Clock className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2" />
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    No activities scheduled for this day
                  </p>
                  <button
                    onClick={() => onOpenProposeEventModal(selectedDate === 'all' ? trip.startDate : selectedDate)}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                  >
                    + Add First Activity
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* Toast feedback for gestures */}
      {toastMsg && (
        <div className="mb-3 p-3 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-between text-xs font-semibold shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="opacity-70 hover:opacity-100 text-xs">✕</button>
        </div>
      )}

      {/* VIEW MODE 3: AGENDA LIST VIEW (Sticky Date Headers & Responsive Flex Cards) */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {filteredEvents.length > 0 && (
            <div className="flex items-center justify-between px-1 text-[10px] text-neutral-400 font-medium">
              <span>Swipe card left to delete · Swipe right to edit</span>
              <span className="font-mono">{filteredEvents.length} items across {groupedDates.length} day{groupedDates.length === 1 ? '' : 's'}</span>
            </div>
          )}

          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">
              <CalendarIcon className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">No events found for this filter</p>
              <button
                onClick={() => onOpenProposeEventModal(selectedDate === 'all' ? trip.startDate : selectedDate)}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-2xs"
              >
                Add Activity
              </button>
            </div>
          ) : (
            groupedDates.map((dateStr) => {
              const dayEvents = eventsByDate[dateStr] || [];
              const dayIndex = allDates.indexOf(dateStr) !== -1 ? allDates.indexOf(dateStr) : 0;
              const dayTotalCost = dayEvents.reduce((sum, e) => sum + e.totalCost, 0);

              return (
                <section key={dateStr} className="space-y-2.5">
                  {/* Sticky Date Header: Anchors events as user scrolls */}
                  <div className="sticky top-0 z-20 py-2 px-3 sm:px-3.5 rounded-xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/90 dark:border-neutral-800/90 shadow-xs flex items-center justify-between gap-2 transition-all">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-600 text-white shadow-2xs">
                        Day {dayIndex + 1}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate">
                        {formatDateLabel(dateStr)}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-neutral-400 font-medium whitespace-nowrap">
                        · {dayEvents.length} {dayEvents.length === 1 ? 'activity' : 'activities'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
                        {formatMoney(dayTotalCost, trip.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenProposeEventModal(dateStr)}
                        className="min-h-[28px] px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
                        title={`Add activity on Day ${dayIndex + 1}`}
                      >
                        <Plus className="w-3 h-3" />
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Day Events Feed */}
                  <div className="space-y-2 sm:space-y-2.5">
                    {dayEvents.map((event, index) => {
                      const attendees = getEventAttendees(event, trip.members);
                      const userShare = getUserEventShare(event, currentUser.id, attendees);
                      const userVote = event.votes[currentUser.id];
                      const isUserIn = userVote === 'in';
                      const isProposed = event.status === 'proposed';
                      const inVotesCount = Object.values(event.votes).filter((v) => v === 'in').length;
                      const isConsensusReached = inVotesCount >= Math.ceil(trip.members.length * (event.approvalThresholdPercent / 100));

                      // Look up payer for paid badge
                      const payer = trip.members.find((m) => m.userId === event.paidByUserId);
                      const payerName = payer ? (payer.userId === currentUser.id ? 'You' : payer.name.split(' ')[0]) : null;

                      const nextEvent = dayEvents[index + 1];
                      const hasTransitToNext = event.transitToNext && nextEvent;

                      return (
                        <React.Fragment key={event.id}>
                          {/* Native Swipe-To-Edit (Right) and Swipe-To-Delete (Left) Card */}
                          <SwipeableItem
                            onSwipeRight={onSelectEventForEdit ? () => onSelectEventForEdit(event) : undefined}
                            rightActionLabel="Edit"
                            rightActionIcon={<Edit3 className="w-4 h-4" />}
                            rightActionColor="bg-indigo-600 text-white"
                            onSwipeLeft={onDeleteEvent ? () => {
                              onDeleteEvent(event.id);
                              setToastMsg(`Activity "${event.title}" removed`);
                              setTimeout(() => setToastMsg(null), 3000);
                            } : undefined}
                            leftActionLabel="Delete"
                            leftActionIcon={<Trash2 className="w-4 h-4" />}
                            leftActionColor="bg-rose-600 text-white"
                            threshold={75}
                          >
                            {/* High-Density Flex Card */}
                            <div
                              onClick={() => handleOpenDetail(event)}
                              className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-xs group flex flex-col justify-between ${
                                isProposed
                                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 border-dashed'
                                  : isUserIn
                                  ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-2xs'
                                  : 'bg-neutral-50/80 dark:bg-neutral-900/40 border-neutral-200/60 dark:border-neutral-800/60 opacity-85'
                              }`}
                            >
                              {/* Header Strip: Strictly Flex-Based Badge Wrapping & Currency */}
                              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                  {/* Time Badge */}
                                  <span className="shrink-0 whitespace-nowrap font-mono font-semibold text-[11px] text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                                    <span>{event.startTime} - {event.endTime}</span>
                                  </span>

                                  {/* Category Badge */}
                                  <span className="shrink-0 whitespace-nowrap flex items-center gap-1 text-neutral-600 dark:text-neutral-400 capitalize text-[11px] font-medium px-1.5 py-0.5 rounded bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
                                    {getCategoryIcon(event.category)}
                                    <span>{event.category}</span>
                                  </span>

                                  {/* Paid Status Badge */}
                                  {event.isPaid && payerName && (
                                    <span className="shrink-0 whitespace-nowrap text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-0.5">
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                      <span>Paid ({payerName})</span>
                                    </span>
                                  )}

                                  {/* Status Badges */}
                                  {isProposed ? (
                                    <span className="shrink-0 whitespace-nowrap text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
                                      <Vote className="w-2.5 h-2.5" />
                                      <span>Proposed ({inVotesCount}/{trip.members.length} In)</span>
                                    </span>
                                  ) : event.status === 'locked' ? (
                                    <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                      <Lock className="w-2.5 h-3.5" /> Locked
                                    </span>
                                  ) : null}
                                </div>

                                {/* Total Cost: shrink-0 so currency never collides */}
                                <div className="shrink-0 whitespace-nowrap font-mono text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-neutral-100 ml-auto">
                                  {formatMoney(event.totalCost, event.currency)}
                                </div>
                              </div>

                              {/* Event Title: Strictly Truncated to Eliminate Overlaps */}
                              <div className="mt-1.5 min-w-0">
                                <h4
                                  className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate min-w-0 block"
                                  title={event.title}
                                >
                                  {event.title}
                                </h4>
                              </div>

                              {/* Venue & Location Row with Truncation */}
                              <div className="flex items-center justify-between gap-1.5 mt-1 text-[11px] min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenVenueMap(event, filteredEvents);
                                  }}
                                  className="inline-flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all min-h-[30px] px-1.5 py-0.5 -ml-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] min-w-0 max-w-[85%] active:scale-98"
                                  title={event.address || event.location}
                                >
                                  <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                                  <span className="truncate min-w-0">{event.address || event.location}</span>
                                  <span className="shrink-0 whitespace-nowrap text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-1 py-0.2 rounded">
                                    Maps
                                  </span>
                                </button>

                                <span className="shrink-0 whitespace-nowrap text-[11px] text-neutral-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 min-h-[30px] px-1 py-0.5">
                                  <span>Details</span>
                                  <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>

                              {/* Bottom Action & Financial Split Bar: Tighter Density */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                              >
                                {/* Attendees Avatars & Status */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <div className="flex items-center -space-x-1.5 overflow-hidden">
                                    {trip.members.map((m) => {
                                      const vote = event.votes[m.userId];
                                      const isAttending = vote === 'in';
                                      return (
                                        <img
                                          key={m.userId}
                                          src={m.avatar}
                                          alt={m.name}
                                          referrerPolicy="no-referrer"
                                          title={`${m.name}: ${isAttending ? 'In' : 'Skipped'}`}
                                          className={`w-5 h-5 rounded-full object-cover ring-1 ring-white dark:ring-neutral-900 ${
                                            isAttending ? '' : 'opacity-25 grayscale'
                                          }`}
                                        />
                                      );
                                    })}
                                  </div>

                                  <span className="text-[10px] sm:text-[11px] text-neutral-500 font-medium whitespace-nowrap">
                                    {attendees.length}/{trip.members.length} going
                                  </span>
                                </div>

                                {/* Right: 1-Tap Vote & Share */}
                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                  {/* Vote Pills */}
                                  <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                    <button
                                      type="button"
                                      onClick={() => onVoteEvent(event.id, 'in')}
                                      aria-label={`Vote in for ${event.title}`}
                                      className={`min-h-[32px] px-2.5 py-1 rounded text-[11px] font-bold transition-all active:scale-95 ${
                                        userVote === 'in' 
                                          ? 'bg-emerald-600 text-white shadow-xs' 
                                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                                      }`}
                                    >
                                      In ✓
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onVoteEvent(event.id, 'skip')}
                                      aria-label={`Vote skip for ${event.title}`}
                                      className={`min-h-[32px] px-2.5 py-1 rounded text-[11px] font-bold transition-all active:scale-95 ${
                                        userVote === 'skip' 
                                          ? 'bg-neutral-700 text-white shadow-xs' 
                                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                                      }`}
                                    >
                                      Skip ✕
                                    </button>
                                  </div>

                                  {/* Lock Button if Consensus Met */}
                                  {isProposed && isConsensusReached && (
                                    <button
                                      type="button"
                                      onClick={() => onLockEvent(event.id)}
                                      className="min-h-[32px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all shrink-0"
                                      title="Consensus reached! Lock this activity into confirmed itinerary"
                                    >
                                      <Lock className="w-3 h-3" />
                                      <span>Lock</span>
                                    </button>
                                  )}

                                  {/* User Cost Share Tag */}
                                  <div className="text-right shrink-0 whitespace-nowrap">
                                    <span className="text-[9px] text-neutral-400 block -mb-0.5">Share</span>
                                    <span className={`font-mono font-bold text-xs ${
                                      isUserIn ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400'
                                    }`}>
                                      {isUserIn ? formatMoney(userShare, event.currency) : '$0'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </SwipeableItem>

                          {/* Clean Transit Buffer Connector */}
                          {hasTransitToNext && event.transitToNext && (
                            <div className="py-0.5 flex items-center justify-center">
                              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-medium border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                                {getTransitIcon(event.transitToNext.mode)}
                                <span>{event.transitToNext.durationMinutes}m {event.transitToNext.mode} transit</span>
                              </div>
                            </div>
                          )}

                        </React.Fragment>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      )}
      {/* Event Detail Modal (Opens when clicking any event in Calendar or List view) */}
      <EventDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailEvent(null);
        }}
        event={detailEvent}
        trip={trip}
        currentUser={currentUser}
        onVoteEvent={onVoteEvent}
        onLockEvent={onLockEvent}
        onEditEvent={(evt) => {
          setIsDetailModalOpen(false);
          if (onSelectEventForEdit) onSelectEventForEdit(evt);
        }}
        onOpenVenueMap={(evt) => {
          onOpenVenueMap(evt, dayEventsForMap);
        }}
      />

      </div>
    </PullToRefresh>
  );
};
