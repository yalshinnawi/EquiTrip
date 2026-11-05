import React, { useState } from 'react';
import { X, Compass, Plus, Users, Calendar, MapPin, Check, Copy } from 'lucide-react';
import { Trip, User } from '../types';

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'join';
  currentUser: User;
  allTrips: Trip[];
  onCreateTrip: (tripData: Omit<Trip, 'id' | 'code' | 'members' | 'createdBy'>) => void;
  onJoinTrip: (code: string) => boolean;
}

export const TripModal: React.FC<TripModalProps> = ({
  isOpen,
  onClose,
  mode,
  currentUser,
  allTrips,
  onCreateTrip,
  onJoinTrip,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'create' | 'join'>(mode);
  
  // Create Form State
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState('USD');
  const [coverImage, setCoverImage] = useState('/src/assets/images/trip_kyoto_japan_1793851651773.jpg');

  // Join Form State
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const sampleCovers = [
    { label: 'Kyoto Pavilion', url: '/src/assets/images/trip_kyoto_japan_1793851651773.jpg' },
    { label: 'Amalfi Coast', url: '/src/assets/images/trip_amalfi_italy_1793851653689.jpg' },
    { label: 'Patagonia Mountains', url: '/src/assets/images/trip_patagonia_trek_1793851652652.jpg' },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim()) return;

    onCreateTrip({
      title: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      currency,
      coverImage,
    });
    onClose();
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase();
    if (!clean) return;

    const success = onJoinTrip(clean);
    if (success) {
      onClose();
    } else {
      setJoinError(`No active trip found with code "${clean}". Try KYOTO4, AMALFI, or PATAGO.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Tabs */}
        <div className="px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/40">
          <div className="flex items-center gap-1 p-1 bg-neutral-200/80 dark:bg-neutral-800 rounded-xl text-xs">
            <button
              onClick={() => { setActiveTab('create'); setJoinError(null); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Initiate New Trip
            </button>
            <button
              onClick={() => { setActiveTab('join'); setJoinError(null); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'join'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Join with 6-Digit Code
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab 1: Create Trip */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Trip Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kyoto Autumn Expedition or Swiss Alps Roadtrip"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Destination *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kyoto, Japan"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Base Trip Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 font-bold"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (CA$)</option>
                  <option value="AUD">AUD (A$)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 font-mono"
                />
              </div>
            </div>

            {/* Cover photo selection */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Cover Photo Backdrop
              </label>
              <div className="grid grid-cols-3 gap-2">
                {sampleCovers.map((cover) => (
                  <button
                    type="button"
                    key={cover.url}
                    onClick={() => setCoverImage(cover.url)}
                    className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                      coverImage === cover.url
                        ? 'border-indigo-600 scale-[1.02] shadow-sm'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={cover.url}
                      alt={cover.label}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                      {cover.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Trip & Generate Join Code</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Join with Code */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinSubmit} className="p-6 space-y-4">
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Join a Travel Group
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto mt-1">
                Enter the 6-character trip join code distributed by the organizer (e.g. <strong>KYOTO4</strong>).
              </p>
            </div>

            <div>
              <input
                type="text"
                maxLength={8}
                required
                placeholder="e.g. KYOTO4"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError(null);
                }}
                className="w-full text-center text-2xl font-mono font-extrabold tracking-widest px-4 py-3 rounded-2xl border-2 border-indigo-500/50 focus:border-indigo-600 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 uppercase"
              />
            </div>

            {joinError && (
              <p className="text-xs text-rose-600 text-center font-medium">
                {joinError}
              </p>
            )}

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 text-xs">
              <span className="font-semibold text-neutral-500 uppercase tracking-wider text-[10px] block mb-1">
                Quick Test Codes:
              </span>
              <div className="flex flex-wrap gap-2">
                {allTrips.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setJoinCode(t.code)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:border-indigo-400"
                  >
                    {t.code} ({t.destination.split(',')[0]})
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Join Trip Group
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
