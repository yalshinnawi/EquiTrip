import React, { useState } from 'react';
import { X, ShoppingBag, DollarSign, Users, Fuel, Coffee, Car, Utensils } from 'lucide-react';
import { Trip, User, AdHocExpense, EventCategory } from '../types';
import { formatMoney } from '../utils/currency';

interface AdHocExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  currentUser: User;
  onSaveExpense: (expense: Omit<AdHocExpense, 'id'>) => void;
}

export const AdHocExpenseModal: React.FC<AdHocExpenseModalProps> = ({
  isOpen,
  onClose,
  trip,
  currentUser,
  onSaveExpense,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('groceries');
  const [totalCost, setTotalCost] = useState<number>(35);
  const [paidByUserId, setPaidByUserId] = useState(currentUser.id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Which members split this
  const [splitMembers, setSplitMembers] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    trip.members.forEach((m) => {
      init[m.userId] = true;
    });
    return init;
  });

  const toggleMember = (userId: string) => {
    setSplitMembers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const selectedCount = Object.values(splitMembers).filter(Boolean).length;
  const perPerson = selectedCount > 0 ? totalCost / selectedCount : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || totalCost <= 0) return;

    const splitAmongUserIds = Object.entries(splitMembers)
      .filter(([_, inc]) => inc)
      .map(([userId]) => userId);

    onSaveExpense({
      tripId: trip.id,
      title: title.trim(),
      category,
      date,
      totalCost: Number(totalCost),
      currency: trip.currency,
      paidByUserId,
      splitAmongUserIds,
      notes: notes.trim() || undefined,
      isPaid: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/40">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Log Non-Calendar Ad-Hoc Expense</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              For snacks, fuel, groceries, or rideshares without cluttering the itinerary.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Expense Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Convenience store run, highway tolls, rental fuel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100"
              >
                <option value="groceries">Groceries & Snacks</option>
                <option value="transit">Fuel & Transportation</option>
                <option value="activity">Supplies & Rental</option>
                <option value="dining">Quick Bites & Coffee</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Total Amount ({trip.currency}) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={totalCost}
                  onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Who Paid?
              </label>
              <select
                value={paidByUserId}
                onChange={(e) => setPaidByUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 font-semibold"
              >
                {trip.members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} {m.userId === currentUser.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100"
              >
              </input>
            </div>
          </div>

          {/* Members Split Grid */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Split Among Travelers ({selectedCount}/{trip.members.length})
            </label>
            <div className="grid grid-cols-2 gap-2">
              {trip.members.map((m) => {
                const isIncluded = splitMembers[m.userId];
                return (
                  <button
                    type="button"
                    key={m.userId}
                    onClick={() => toggleMember(m.userId)}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between text-xs transition-colors ${
                      isIncluded
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100 font-bold'
                        : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400 opacity-60'
                    }`}
                  >
                    <span>{m.name.split(' ')[0]}</span>
                    <span className="font-mono text-[11px]">{isIncluded ? 'Split ✓' : 'Excluded'}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Each traveler owes: <strong>{formatMoney(perPerson, trip.currency)}</strong>
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
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
              <DollarSign className="w-3.5 h-3.5" />
              <span>Record Expense to Ledger</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
