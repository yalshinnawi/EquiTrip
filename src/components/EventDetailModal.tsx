import React from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  Calendar, 
  DollarSign, 
  Lock, 
  Vote, 
  ExternalLink, 
  Edit3, 
  Users, 
  Utensils, 
  Landmark, 
  Sparkles, 
  Moon, 
  Bed, 
  Train,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { ItineraryEvent, Trip, User, EventCategory } from '../types';
import { formatMoney } from '../utils/currency';
import { getEventAttendees, getUserEventShare } from '../utils/debtSimplification';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ItineraryEvent | null;
  trip: Trip;
  currentUser: User;
  onVoteEvent: (eventId: string, vote: 'in' | 'skip') => void;
  onLockEvent: (eventId: string) => void;
  onEditEvent: (event: ItineraryEvent) => void;
  onOpenVenueMap: (event: ItineraryEvent) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  trip,
  currentUser,
  onVoteEvent,
  onLockEvent,
  onEditEvent,
  onOpenVenueMap,
}) => {
  if (!isOpen || !event) return null;

  const attendees = getEventAttendees(event, trip.members);
  const userShare = getUserEventShare(event, currentUser.id, attendees);
  const userVote = event.votes[currentUser.id];
  const isUserIn = userVote === 'in';
  const payer = trip.members.find((m) => m.userId === event.paidByUserId);
  const isPayer = event.paidByUserId === currentUser.id;

  const inVotesCount = Object.values(event.votes).filter((v) => v === 'in').length;
  const isConsensusReached = inVotesCount >= Math.ceil(trip.members.length * (event.approvalThresholdPercent / 100));

  const getCategoryIcon = (category: EventCategory) => {
    switch (category) {
      case 'dining': return <Utensils className="w-4 h-4 text-amber-500" />;
      case 'culture': return <Landmark className="w-4 h-4 text-indigo-500" />;
      case 'activity': return <Sparkles className="w-4 h-4 text-emerald-500" />;
      case 'nightlife': return <Moon className="w-4 h-4 text-purple-500" />;
      case 'lodging': return <Bed className="w-4 h-4 text-blue-500" />;
      case 'transit':
      default: return <Train className="w-4 h-4 text-cyan-500" />;
    }
  };

  const formatDateString = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between bg-neutral-50/70 dark:bg-neutral-800/40">
          <div className="flex items-start gap-3 min-w-0 pr-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              {getCategoryIcon(event.category)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="capitalize text-[11px] font-bold text-neutral-500">
                  {event.category}
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">·</span>
                {event.status === 'locked' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Lock className="w-2.5 h-2.5" /> Locked in Itinerary
                  </span>
                ) : event.status === 'confirmed' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Confirmed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Vote className="w-2.5 h-2.5" /> Proposed ({inVotesCount}/{trip.members.length} In)
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                {event.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Time & Date */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
            <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block truncate">
                {formatDateString(event.date)}
              </span>
              <span className="text-[11px] font-mono text-neutral-500 block">
                {event.startTime} - {event.endTime}
              </span>
            </div>
          </div>

          {/* Venue & Google Maps Address */}
          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block">
                    {event.location}
                  </span>
                  <span className="text-[11px] text-neutral-500 block truncate">
                    {event.address || event.location}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenVenueMap(event);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Maps</span>
              </button>
            </div>
          </div>

          {/* Cost & Split Overview */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
              <div>
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block">
                  Total Bill
                </span>
                <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
                  {formatMoney(event.totalCost, event.currency)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block">
                  Fronted By
                </span>
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {payer?.name} {isPayer ? '(You)' : ''}
                </span>
              </div>
            </div>

            {/* Your Share Callout */}
            <div className="pt-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Your Calculated Share:
                </span>
                <span className="text-[11px] text-neutral-400 block">
                  {isUserIn ? `Split among ${attendees.length} attendees` : 'You skipped this activity'}
                </span>
              </div>

              <span className={`text-base font-bold font-mono ${
                isUserIn ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400'
              }`}>
                {isUserIn ? formatMoney(userShare, event.currency) : '$0.00'}
              </span>
            </div>
          </div>

          {/* Members RSVP Status */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-neutral-400" />
                <span>Travelers RSVP ({attendees.length}/{trip.members.length} In)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {trip.members.map((m) => {
                const vote = event.votes[m.userId];
                const isIn = vote === 'in';
                return (
                  <div
                    key={m.userId}
                    className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                      isIn
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-neutral-900 dark:text-neutral-100'
                        : 'bg-neutral-100/70 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={m.avatar}
                        alt={m.name}
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                      <span className="truncate">{m.name}</span>
                    </div>
                    <span className="font-bold text-[10px] shrink-0 font-mono">
                      {isIn ? 'In ✓' : 'Skip ✕'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1-Tap Quick RSVP Toggle for Current User */}
          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block">
                Are you attending?
              </span>
              <span className="text-[11px] text-neutral-500">
                Toggling automatically updates your financial split.
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs">
              <button
                type="button"
                onClick={() => onVoteEvent(event.id, 'in')}
                className={`min-h-[38px] min-w-[54px] px-3.5 py-1.5 rounded-lg font-bold transition-all active:scale-95 flex items-center justify-center ${
                  userVote === 'in'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                In ✓
              </button>
              <button
                type="button"
                onClick={() => onVoteEvent(event.id, 'skip')}
                className={`min-h-[38px] min-w-[54px] px-3.5 py-1.5 rounded-lg font-bold transition-all active:scale-95 flex items-center justify-center ${
                  userVote === 'skip'
                    ? 'bg-neutral-700 text-white shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Skip ✕
              </button>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2.5 bg-neutral-50/50 dark:bg-neutral-800/40 shrink-0">
          <button
            onClick={() => {
              onClose();
              onEditEvent(event);
            }}
            className="min-h-[42px] px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <div className="flex items-center gap-2">
            {event.status === 'proposed' && (
              <button
                onClick={() => {
                  onLockEvent(event.id);
                  onClose();
                }}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock to Calendar</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold transition-all active:scale-95"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
