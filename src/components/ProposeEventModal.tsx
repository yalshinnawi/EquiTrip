import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  DollarSign, 
  Utensils, 
  Landmark, 
  Sparkles, 
  Moon, 
  Bed, 
  Train, 
  Vote,
  ExternalLink,
  Plus,
  ChevronDown,
  ChevronUp,
  Sliders,
  Calculator,
  Percent,
  Users,
  Check,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Trip, User, ItineraryEvent, EventCategory, SplitType, TransitMode } from '../types';
import { formatMoney } from '../utils/currency';

interface ProposeEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  currentUser: User;
  onSaveEvent: (eventData: Omit<ItineraryEvent, 'id'>) => void;
  initialDate?: string;
  editingEvent?: ItineraryEvent | null;
}

const CATEGORIES: { id: EventCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'dining', label: 'Food & Dining', icon: Utensils },
  { id: 'culture', label: 'Sightseeing', icon: Landmark },
  { id: 'activity', label: 'Outdoor', icon: Sparkles },
  { id: 'nightlife', label: 'Drinks & Night', icon: Moon },
  { id: 'lodging', label: 'Stay', icon: Bed },
  { id: 'transit', label: 'Transit', icon: Train },
];

const VENUE_SUGGESTIONS = [
  { name: 'Gion Hanami-koji', address: 'Gion, Higashiyama Ward, Kyoto', lat: 35.0037, lng: 135.7758 },
  { name: 'Fushimi Inari Shrine', address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto', lat: 34.9671, lng: 135.7727 },
  { name: 'Arashiyama Bamboo Grove', address: 'Sagatenryuji, Ukyo Ward, Kyoto', lat: 35.0169, lng: 135.6713 },
  { name: 'Nishiki Market', address: 'Nakagyo Ward, Kyoto', lat: 35.0050, lng: 135.7649 },
];

export const ProposeEventModal: React.FC<ProposeEventModalProps> = ({
  isOpen,
  onClose,
  trip,
  currentUser,
  onSaveEvent,
  initialDate,
  editingEvent,
}) => {
  if (!isOpen) return null;

  // ==========================================
  // ESSENTIAL FIELDS (Visible by default)
  // ==========================================
  const [title, setTitle] = useState(editingEvent?.title || '');
  const [category, setCategory] = useState<EventCategory>(editingEvent?.category || 'dining');
  const [date, setDate] = useState(editingEvent?.date || initialDate || trip.startDate);
  const [startTime, setStartTime] = useState(editingEvent?.startTime || '12:30');
  const [endTime, setEndTime] = useState(editingEvent?.endTime || '14:00');
  
  // Location & Google Maps
  const [location, setLocation] = useState(editingEvent?.location || '');
  const [address, setAddress] = useState(editingEvent?.address || '');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>(
    editingEvent?.coordinates
  );

  // Financial Basics
  const [totalCost, setTotalCost] = useState<number>(editingEvent?.totalCost ?? 80);
  const [currency] = useState(editingEvent?.currency || trip.currency);
  const [paidByUserId, setPaidByUserId] = useState(editingEvent?.paidByUserId || currentUser.id);
  const [isPaid, setIsPaid] = useState(editingEvent?.isPaid ?? false);

  // ==========================================
  // PROGRESSIVE DISCLOSURE STATE
  // ==========================================
  // Open accordion by default if editing an event that already has custom overrides
  const hasAdvancedOverrides = Boolean(
    editingEvent?.splitType !== 'equal' ||
    editingEvent?.notes ||
    editingEvent?.transitToNext ||
    (editingEvent && !trip.members.every((m) => editingEvent.votes[m.userId] === 'in'))
  );
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedOverrides);

  // ==========================================
  // ADVANCED: Split Overrides & Custom Allocation
  // ==========================================
  const [splitType, setSplitType] = useState<SplitType>(editingEvent?.splitType || 'equal');
  
  // Member inclusion (In vs Skip)
  const [participatingMemberIds, setParticipatingMemberIds] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    trip.members.forEach((m) => {
      if (editingEvent) {
        map[m.userId] = editingEvent.votes[m.userId] === 'in';
      } else {
        map[m.userId] = true;
      }
    });
    return map;
  });

  // Custom amounts or percentages per user
  const [customSplits, setCustomSplits] = useState<Record<string, number>>(() => {
    if (editingEvent?.customSplits) return { ...editingEvent.customSplits };
    
    // Default evenly distributed
    const initial: Record<string, number> = {};
    const count = trip.members.length || 1;
    trip.members.forEach((m) => {
      initial[m.userId] = Math.round(((editingEvent?.totalCost || 80) / count) * 100) / 100;
    });
    return initial;
  });

  // Custom percentages per user
  const [customPercentages, setCustomPercentages] = useState<Record<string, number>>(() => {
    if (editingEvent?.splitType === 'percentages' && editingEvent?.customSplits) {
      return { ...editingEvent.customSplits };
    }
    const initial: Record<string, number> = {};
    const count = trip.members.length || 1;
    const basePct = Math.floor(100 / count);
    trip.members.forEach((m, idx) => {
      initial[m.userId] = idx === 0 ? 100 - basePct * (count - 1) : basePct;
    });
    return initial;
  });

  // ==========================================
  // ADVANCED: Tax & Tip Calculator
  // ==========================================
  const [subtotal, setSubtotal] = useState<number>(() => Math.round(((editingEvent?.totalCost || 80) * 0.8) * 100) / 100);
  const [taxPercent, setTaxPercent] = useState<number>(10);
  const [tipPercent, setTipPercent] = useState<number>(18);
  const [tipTaxApplied, setTipTaxApplied] = useState<boolean>(false);

  // ==========================================
  // ADVANCED: Consensus & Transit Notes
  // ==========================================
  const [requiresConsensus, setRequiresConsensus] = useState(editingEvent?.requiresConsensus ?? false);
  const [approvalThresholdPercent, setApprovalThresholdPercent] = useState(editingEvent?.approvalThresholdPercent || 50);
  const [notes, setNotes] = useState(editingEvent?.notes || '');
  const [includeTransit, setIncludeTransit] = useState(Boolean(editingEvent?.transitToNext));
  const [transitMode, setTransitMode] = useState<TransitMode>(editingEvent?.transitToNext?.mode || 'transit');
  const [transitMinutes, setTransitMinutes] = useState(editingEvent?.transitToNext?.durationMinutes || 15);

  // Recalculate default custom splits when totalCost or member inclusion changes
  const activeMembers = trip.members.filter((m) => participatingMemberIds[m.userId]);
  const activeCount = activeMembers.length;
  const equalPerPerson = activeCount > 0 ? totalCost / activeCount : 0;

  const handleSelectSuggestion = (s: typeof VENUE_SUGGESTIONS[0]) => {
    setLocation(s.name);
    setAddress(s.address);
    setCoordinates({ lat: s.lat, lng: s.lng });
  };

  const handleToggleMember = (userId: string) => {
    setParticipatingMemberIds((prev) => {
      const next = { ...prev, [userId]: !prev[userId] };
      return next;
    });
  };

  const handleToggleAllMembers = (include: boolean) => {
    const updated: Record<string, boolean> = {};
    trip.members.forEach((m) => {
      updated[m.userId] = include;
    });
    setParticipatingMemberIds(updated);
  };

  // Tax/Tip apply handler
  const handleApplyTaxAndTip = () => {
    const taxAmount = (subtotal * taxPercent) / 100;
    const tipAmount = (subtotal * tipPercent) / 100;
    const computedTotal = Math.round((subtotal + taxAmount + tipAmount) * 100) / 100;
    setTotalCost(computedTotal);
    setTipTaxApplied(true);
  };

  // Check custom split totals
  const customAmountsTotal = Object.entries(customSplits)
    .filter(([userId]) => participatingMemberIds[userId])
    .reduce((sum, [_, amt]) => sum + (Number(amt) || 0), 0);
  const customAmountsDelta = Math.round((totalCost - customAmountsTotal) * 100) / 100;

  const customPctTotal = Object.entries(customPercentages)
    .filter(([userId]) => participatingMemberIds[userId])
    .reduce((sum, [_, pct]) => sum + (Number(pct) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Build votes map
    const votes: Record<string, 'in' | 'skip'> = {};
    trip.members.forEach((m) => {
      if (participatingMemberIds[m.userId]) {
        votes[m.userId] = 'in';
      } else {
        votes[m.userId] = 'skip';
      }
    });

    const venueAddress = address.trim() || location.trim() || trip.destination;
    const googleMapsUri = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      venueAddress
    )}`;

    // Prepare custom splits object based on splitType
    let resolvedCustomSplits: Record<string, number> | undefined = undefined;
    if (splitType === 'custom_amounts') {
      resolvedCustomSplits = customSplits;
    } else if (splitType === 'percentages') {
      resolvedCustomSplits = customPercentages;
    }

    const eventData: Omit<ItineraryEvent, 'id'> = {
      tripId: trip.id,
      title: title.trim(),
      category,
      date,
      startTime,
      endTime,
      location: location.trim() || trip.destination,
      address: venueAddress,
      coordinates: coordinates || { lat: 35.0116, lng: 135.7681 },
      googleMapsUri,
      notes: notes.trim() || undefined,
      isAdHocExpense: false,
      status: requiresConsensus ? 'proposed' : 'confirmed',
      requiresConsensus,
      approvalThresholdPercent,
      votes,
      totalCost: Number(totalCost) || 0,
      currency,
      isPaid,
      paidByUserId,
      splitType,
      customSplits: resolvedCustomSplits,
      transitToNext: includeTransit
        ? {
            mode: transitMode,
            durationMinutes: Number(transitMinutes) || 15,
          }
        : undefined,
    };

    onSaveEvent(eventData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-800/40 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{editingEvent ? 'Edit Activity' : 'Add Activity'}</span>
            </h3>
            <p className="text-[11px] text-neutral-500">
              Schedule an event and split expenses with your group.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* ==================================================== */}
          {/* 1. ESSENTIAL: Title */}
          {/* ==================================================== */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Activity Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Dinner at Gion Duck Noodles or Fushimi Inari Hike"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* ==================================================== */}
          {/* 2. ESSENTIAL: Category Chips */}
          {/* ==================================================== */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`py-2 px-1 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                        : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-[10px] leading-tight truncate w-full">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ==================================================== */}
          {/* 3. ESSENTIAL: Date & Time */}
          {/* ==================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 font-mono"
              />
            </div>
          </div>

          {/* ==================================================== */}
          {/* 4. ESSENTIAL: Venue Location & Address */}
          {/* ==================================================== */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                <span>Venue & Address</span>
              </label>
              {address && (
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5">
                  ✓ Maps Linked
                </span>
              )}
            </div>

            <input
              type="text"
              placeholder="e.g. Gion Hanami-koji, Kyoto, Japan"
              value={address || location}
              onChange={(e) => {
                setAddress(e.target.value);
                setLocation(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100"
            />

            {/* Quick suggestions */}
            <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-0.5">
              <span className="text-[10px] text-neutral-400 shrink-0">Popular:</span>
              {VENUE_SUGGESTIONS.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[10px] text-neutral-600 dark:text-neutral-300 whitespace-nowrap shrink-0 transition-colors"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* ==================================================== */}
          {/* 5. ESSENTIAL: Cost & Payer */}
          {/* ==================================================== */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-2.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Total Cost ({currency}) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-neutral-400 font-bold text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={totalCost}
                    onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}
                    className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Paid By
                </label>
                <select
                  value={paidByUserId}
                  onChange={(e) => setPaidByUserId(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 font-semibold"
                >
                  {trip.members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name} {m.userId === currentUser.id ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Default Split Summary Strip */}
            <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-700 flex items-center justify-between text-xs">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {splitType === 'equal' ? (
                  <>
                    Split equally among <strong>{activeCount}</strong> member{activeCount !== 1 ? 's' : ''}:
                  </>
                ) : (
                  <>
                    Custom split ({splitType.replace('_', ' ')}):
                  </>
                )}
              </span>

              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                {splitType === 'equal' 
                  ? `${formatMoney(equalPerPerson, currency)} / person`
                  : 'Custom breakdown active'}
              </span>
            </div>
          </div>

          {/* ==================================================== */}
          {/* PROGRESSIVE DISCLOSURE ACCORDION: ADVANCED OPTIONS */}
          {/* ==================================================== */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden transition-all bg-white dark:bg-neutral-900/40">
            
            {/* Accordion Trigger Button */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-3 flex items-center justify-between bg-neutral-50/80 hover:bg-neutral-100/80 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/80 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-neutral-500" />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Advanced Options
                </span>
                
                {/* Active indicator badges */}
                {(splitType !== 'equal' || !trip.members.every(m => participatingMemberIds[m.userId]) || requiresConsensus || tipTaxApplied) && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    Customized
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
                <span className="text-[11px] hidden sm:inline">
                  {showAdvanced ? 'Hide advanced settings' : 'Splits, tax/tip, voting'}
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {/* Accordion Body */}
            {showAdvanced && (
              <div className="p-4 space-y-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/60 animate-in fade-in duration-150">
                
                {/* ---------------------------------------------------- */}
                {/* ADVANCED 1: Split Allocation & Specific Overrides */}
                {/* ---------------------------------------------------- */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Split Allocation & Overrides</span>
                    </label>

                    {/* Split Type Selector Pills */}
                    <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-[10px]">
                      <button
                        type="button"
                        onClick={() => setSplitType('equal')}
                        className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                          splitType === 'equal'
                            ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                            : 'text-neutral-500'
                        }`}
                      >
                        Equal
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitType('custom_amounts')}
                        className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                          splitType === 'custom_amounts'
                            ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                            : 'text-neutral-500'
                        }`}
                      >
                        Exact ($)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitType('percentages')}
                        className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                          splitType === 'percentages'
                            ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                            : 'text-neutral-500'
                        }`}
                      >
                        Percent (%)
                      </button>
                    </div>
                  </div>

                  {/* Mode A: Equal Split with selective member opt-in/out */}
                  {splitType === 'equal' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <span>Select which members share this cost:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleAllMembers(true)}
                            className="underline hover:text-indigo-600"
                          >
                            All In
                          </button>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() => handleToggleAllMembers(false)}
                            className="underline hover:text-indigo-600"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {trip.members.map((m) => {
                          const isIn = participatingMemberIds[m.userId];
                          return (
                            <button
                              key={m.userId}
                              type="button"
                              onClick={() => handleToggleMember(m.userId)}
                              className={`p-2 rounded-xl border text-left flex items-center justify-between text-xs transition-colors ${
                                isIn
                                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100 font-semibold'
                                  : 'bg-neutral-100/60 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-400 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <img
                                  src={m.avatar}
                                  alt={m.name}
                                  referrerPolicy="no-referrer"
                                  className="w-4 h-4 rounded-full object-cover shrink-0"
                                />
                                <span className="truncate">{m.name.split(' ')[0]}</span>
                              </div>
                              <span className="font-mono text-[10px] shrink-0">
                                {isIn ? `${formatMoney(equalPerPerson, currency)}` : 'Opted out'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mode B: Custom Exact Dollar Amounts */}
                  {splitType === 'custom_amounts' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-neutral-500">Enter custom sums for each person:</span>
                        <span className={`font-mono font-bold ${
                          customAmountsDelta === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {customAmountsDelta === 0 
                            ? 'Matches total ($0.00 left)' 
                            : `${customAmountsDelta > 0 ? 'Unassigned' : 'Exceeds by'}: ${formatMoney(Math.abs(customAmountsDelta), currency)}`}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {trip.members.map((m) => {
                          const isIncluded = participatingMemberIds[m.userId];
                          return (
                            <div
                              key={m.userId}
                              className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isIncluded}
                                  onChange={() => handleToggleMember(m.userId)}
                                  className="w-3.5 h-3.5 rounded text-indigo-600 cursor-pointer"
                                />
                                <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                                  {m.name}
                                </span>
                              </div>

                              <div className="relative w-28 shrink-0">
                                <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-neutral-400 text-xs font-bold">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  disabled={!isIncluded}
                                  value={customSplits[m.userId] ?? ''}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setCustomSplits(prev => ({ ...prev, [m.userId]: val }));
                                  }}
                                  className="w-full pl-5 pr-2 py-1 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-mono font-bold text-right"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mode C: Custom Uneven Percentages */}
                  {splitType === 'percentages' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-neutral-500">Assign split percentages:</span>
                        <span className={`font-mono font-bold ${
                          customPctTotal === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          Total: {customPctTotal}% {customPctTotal === 100 ? '✓' : `(${100 - customPctTotal}% remaining)`}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {trip.members.map((m) => {
                          const isIncluded = participatingMemberIds[m.userId];
                          const pct = customPercentages[m.userId] ?? 0;
                          const calculatedAmt = (pct / 100) * totalCost;
                          return (
                            <div
                              key={m.userId}
                              className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isIncluded}
                                  onChange={() => handleToggleMember(m.userId)}
                                  className="w-3.5 h-3.5 rounded text-indigo-600 cursor-pointer"
                                />
                                <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                                  {m.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-mono text-neutral-400">
                                  {formatMoney(calculatedAmt, currency)}
                                </span>
                                <div className="relative w-20">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    disabled={!isIncluded}
                                    value={pct}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setCustomPercentages(prev => ({ ...prev, [m.userId]: val }));
                                    }}
                                    className="w-full pr-5 pl-2 py-1 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-mono font-bold text-right"
                                  />
                                  <span className="absolute inset-y-0 right-0 pr-1.5 flex items-center text-neutral-400 text-xs">%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* ---------------------------------------------------- */}
                {/* ADVANCED 2: Tax & Tip Calculator */}
                {/* ---------------------------------------------------- */}
                <div className="p-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                      <Calculator className="w-3.5 h-3.5 text-amber-600" />
                      <span>Tax & Tip / Gratuity Calculator</span>
                    </div>

                    {tipTaxApplied && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Applied to Total Cost
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-0.5">
                        Food Subtotal ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={subtotal}
                        onChange={(e) => {
                          setSubtotal(parseFloat(e.target.value) || 0);
                          setTipTaxApplied(false);
                        }}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-0.5">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={taxPercent}
                        onChange={(e) => {
                          setTaxPercent(parseFloat(e.target.value) || 0);
                          setTipTaxApplied(false);
                        }}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-0.5">
                        Tip / Gratuity (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={tipPercent}
                        onChange={(e) => {
                          setTipPercent(parseFloat(e.target.value) || 0);
                          setTipTaxApplied(false);
                        }}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-neutral-500">
                      Est. Total: <strong>${Math.round((subtotal + (subtotal * (taxPercent + tipPercent)) / 100) * 100) / 100}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyTaxAndTip}
                      className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors shadow-2xs"
                    >
                      Update Total Cost
                    </button>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* ADVANCED 3: Group Consensus & Voting Rules */}
                {/* ---------------------------------------------------- */}
                <div className="p-3 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                        Require Group Approval First
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Keeps card as a proposal until group members vote "In".
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRequiresConsensus(!requiresConsensus)}
                      className={`w-10 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                        requiresConsensus ? 'bg-indigo-600' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                          requiresConsensus ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {requiresConsensus && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-neutral-500">Approval threshold:</span>
                      <select
                        value={approvalThresholdPercent}
                        onChange={(e) => setApprovalThresholdPercent(Number(e.target.value))}
                        className="px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs font-semibold"
                      >
                        <option value={50}>Majority (&gt; 50%)</option>
                        <option value={66}>Two-thirds (66%)</option>
                        <option value={100}>Unanimous (100%)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* ---------------------------------------------------- */}
                {/* ADVANCED 4: Transit Buffer & Logistics Notes */}
                {/* ---------------------------------------------------- */}
                <div className="p-3 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Transit Buffer to Next Stop
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeTransit}
                        onChange={(e) => setIncludeTransit(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-indigo-600"
                      />
                      <span className="text-[11px]">Attach transit badge</span>
                    </label>
                  </div>

                  {includeTransit && (
                    <div className="grid grid-cols-2 gap-2 pt-1.5">
                      <div>
                        <label className="text-[10px] text-neutral-400 block mb-0.5">Mode</label>
                        <select
                          value={transitMode}
                          onChange={(e) => setTransitMode(e.target.value as TransitMode)}
                          className="w-full px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 text-xs bg-neutral-50 dark:bg-neutral-900"
                        >
                          <option value="transit">Subway / Bus</option>
                          <option value="walk">Walking</option>
                          <option value="drive">Taxi / Ride</option>
                          <option value="train">Train</option>
                          <option value="bike">Bicycle</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-400 block mb-0.5">Duration (mins)</label>
                        <input
                          type="number"
                          min="1"
                          value={transitMinutes}
                          onChange={(e) => setTransitMinutes(parseInt(e.target.value) || 15)}
                          className="w-full px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 text-xs bg-neutral-50 dark:bg-neutral-900 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Notes / Booking reference */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700/60">
                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                      Notes / Reservation Ref (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Reservation confirmed under Elena #8821"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs bg-neutral-50 dark:bg-neutral-900"
                    />
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>{editingEvent ? 'Save Changes' : requiresConsensus ? 'Propose Activity' : 'Add to Calendar'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
