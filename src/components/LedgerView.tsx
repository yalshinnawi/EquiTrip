import React, { useState } from 'react';
import { 
  Receipt, 
  ArrowRight, 
  Check, 
  ExternalLink, 
  Plus, 
  CheckCircle2, 
  RotateCcw,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Users,
  Sparkles
} from 'lucide-react';
import { Trip, User, ItineraryEvent, AdHocExpense, SettlementPayment, SimplifiedDebt, PaymentApp } from '../types';
import { formatMoney, formatSignedMoney, getPaymentDeepLink } from '../utils/currency';
import { calculateMemberFinancials, simplifyDebts } from '../utils/debtSimplification';
import { SwipeableItem } from './SwipeableItem';
import { PullToRefresh } from './PullToRefresh';

interface LedgerViewProps {
  trip: Trip;
  currentUser: User;
  events: ItineraryEvent[];
  adHocExpenses: AdHocExpense[];
  settlements: SettlementPayment[];
  onOpenAdHocModal: () => void;
  onRecordSettlement: (fromUserId: string, toUserId: string, amount: number, method: PaymentApp) => void;
  onUndoSettlement: (settlementId: string) => void;
  onRefresh?: () => Promise<void> | void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  trip,
  currentUser,
  events,
  adHocExpenses,
  settlements,
  onOpenAdHocModal,
  onRecordSettlement,
  onUndoSettlement,
  onRefresh,
}) => {
  const [selectedDebtToSettle, setSelectedDebtToSettle] = useState<SimplifiedDebt | null>(null);
  const [settlementSuccessMsg, setSettlementSuccessMsg] = useState<string | null>(null);

  const financials = calculateMemberFinancials(trip.members, events, adHocExpenses, settlements);
  const { simplifiedDebts } = simplifyDebts(financials, trip.currency);

  const confirmedEvents = events.filter((e) => e.status === 'confirmed' || e.status === 'locked');
  const eventSpend = confirmedEvents.reduce((sum, e) => sum + e.totalCost, 0);
  const adHocSpend = adHocExpenses.reduce((sum, e) => sum + e.totalCost, 0);
  const totalTripSpend = eventSpend + adHocSpend;
  const totalSettledAmount = settlements.reduce((s, p) => s + p.amount, 0);

  // Current user's personal financial snapshot
  const userFinancial = financials[currentUser.id] || {
    userId: currentUser.id,
    name: currentUser.name,
    avatar: currentUser.avatar,
    payoutHandle: currentUser.payoutHandle,
    paymentApp: currentUser.paymentApp,
    totalPaid: 0,
    totalShare: 0,
    settlementsPaid: 0,
    settlementsReceived: 0,
    netBalance: 0,
  };

  const userNet = userFinancial.netBalance;
  const isUserOwed = userNet > 0.005;
  const isUserOwing = userNet < -0.005;
  const isUserSettled = !isUserOwed && !isUserOwing;

  // Sort simplified debts so user's actions appear prominently first
  const sortedDebts = [...simplifiedDebts].sort((a, b) => {
    const aIsUserOut = a.fromUserId === currentUser.id;
    const bIsUserOut = b.fromUserId === currentUser.id;
    if (aIsUserOut && !bIsUserOut) return -1;
    if (!aIsUserOut && bIsUserOut) return 1;

    const aIsUserIn = a.toUserId === currentUser.id;
    const bIsUserIn = b.toUserId === currentUser.id;
    if (aIsUserIn && !bIsUserIn) return -1;
    if (!aIsUserIn && bIsUserIn) return 1;

    return b.amount - a.amount;
  });

  const handleConfirmSettlement = (debt: SimplifiedDebt) => {
    onRecordSettlement(debt.fromUserId, debt.toUserId, debt.amount, debt.toPaymentApp);
    setSelectedDebtToSettle(null);
    setSettlementSuccessMsg(`Payment recorded: ${formatMoney(debt.amount, trip.currency)} from ${debt.fromName} to ${debt.toName}`);
    setTimeout(() => setSettlementSuccessMsg(null), 3500);
  };

  return (
    <PullToRefresh onRefresh={onRefresh || (() => {})}>
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-5 space-y-5">
        
        {/* Toast Banner */}
      {settlementSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{settlementSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setSettlementSuccessMsg(null)} 
            className="text-neutral-400 hover:text-neutral-600 px-1 py-0.5"
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </div>
      )}

      {/* PRIMARY VISUAL ANCHOR: Total Net Balance Hero Card */}
      <div 
        className={`rounded-2xl p-4 sm:p-5 border transition-all shadow-sm ${
          isUserOwed
            ? 'bg-gradient-to-br from-emerald-500/[0.08] via-white to-emerald-500/[0.03] dark:from-emerald-950/40 dark:via-neutral-900 dark:to-emerald-950/20 border-emerald-200/90 dark:border-emerald-800/80'
            : isUserOwing
            ? 'bg-gradient-to-br from-rose-500/[0.08] via-white to-rose-500/[0.03] dark:from-rose-950/40 dark:via-neutral-900 dark:to-rose-950/20 border-rose-200/90 dark:border-rose-800/80'
            : 'bg-gradient-to-br from-neutral-500/[0.05] via-white to-neutral-500/[0.02] dark:from-neutral-800/40 dark:via-neutral-900 dark:to-neutral-900 border-neutral-200 dark:border-neutral-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Your Net Balance
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isUserOwed
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                    : isUserOwing
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {isUserOwed && <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                {isUserOwing && <ArrowUpRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                {isUserSettled && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                {isUserOwed ? 'You are owed' : isUserOwing ? 'You owe' : 'All Settled'}
              </span>
            </div>

            {/* Primary Visual Anchor Amount */}
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl sm:text-4xl font-black font-mono tracking-tight tabular-nums ${
                  isUserOwed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isUserOwing
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-neutral-900 dark:text-neutral-100'
                }`}
              >
                {isUserOwed ? `+${formatMoney(userNet, trip.currency)}` : isUserOwing ? `-${formatMoney(Math.abs(userNet), trip.currency)}` : formatMoney(0, trip.currency)}
              </span>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed">
              {isUserOwed && 'You fronted extra costs for the crew. You will receive payments below.'}
              {isUserOwing && 'Your share exceeds what you paid directly. Send payments below to balance.'}
              {isUserSettled && 'Your contributions match your exact share. No pending transfers required.'}
            </p>
          </div>

          {/* Quick Action Button & Currency Indicator */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              onClick={onOpenAdHocModal}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>
          </div>
        </div>

        {/* Compact 4-part KPI row anchored to the net balance */}
        <div className="mt-4 pt-3.5 border-t border-neutral-200/70 dark:border-neutral-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">You Paid</span>
            <span className="text-sm font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
              {formatMoney(userFinancial.totalPaid, trip.currency)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Your Share</span>
            <span className="text-sm font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
              {formatMoney(userFinancial.totalShare, trip.currency)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Trip Total</span>
            <span className="text-sm font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
              {formatMoney(totalTripSpend, trip.currency)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Settled</span>
            <span className="text-sm font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatMoney(totalSettledAmount, trip.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* STREAMLINED DEBT SETTLEMENTS (List-Item Style) */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Individual Debt Settlements
            </h3>
            {sortedDebts.length > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                {sortedDebts.length}
              </span>
            )}
          </div>

          {sortedDebts.length > 0 ? (
            <span className="text-[11px] text-neutral-400 hidden sm:inline-block">
              Swipe card right to quickly settle
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" /> Fully Reconciled
            </span>
          )}
        </div>

        {/* Empty state when all accounts are settled */}
        {sortedDebts.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              All accounts are fully balanced!
            </p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Every traveler's share is settled up. When new activities or ad-hoc expenses are logged, optimized transfers will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {sortedDebts.map((debt) => {
              const deepLink = getPaymentDeepLink(debt.toPaymentApp, debt.toPayoutHandle, debt.amount, trip.currency, trip.title);
              const isOutgoing = debt.fromUserId === currentUser.id;
              const isIncoming = debt.toUserId === currentUser.id;

              return (
                <SwipeableItem
                  key={debt.id}
                  onSwipeRight={() => handleConfirmSettlement(debt)}
                  rightActionLabel="Settle Paid"
                  rightActionIcon={<CheckCircle2 className="w-4 h-4" />}
                  rightActionColor="bg-emerald-600 text-white"
                  threshold={70}
                  className="transition-colors"
                >
                  <div
                    className={`p-3 sm:px-4 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isIncoming
                        ? 'border-l-4 border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/15'
                        : isOutgoing
                        ? 'border-l-4 border-l-rose-500 bg-rose-50/20 dark:bg-rose-950/15'
                        : 'border-l-4 border-l-neutral-200 dark:border-l-neutral-700 bg-white dark:bg-neutral-900'
                    }`}
                  >
                    {/* Left: Transfer Participants & Subtle Direction Pill */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatars with Directional Flow */}
                      <div className="flex items-center shrink-0 -space-x-1.5">
                        <img
                          src={debt.fromAvatar}
                          alt={debt.fromName}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-white dark:ring-neutral-900 shrink-0"
                        />
                        <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 z-10">
                          <ArrowRight className="w-2.5 h-2.5 text-neutral-600 dark:text-neutral-300" />
                        </div>
                        <img
                          src={debt.toAvatar}
                          alt={debt.toName}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-white dark:ring-neutral-900 shrink-0"
                        />
                      </div>

                      {/* Names & Method details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                            {isOutgoing ? (
                              <span className="font-bold text-rose-600 dark:text-rose-400">You</span>
                            ) : (
                              debt.fromName.split(' ')[0]
                            )}
                            <span className="text-neutral-400 font-normal mx-1">pays</span>
                            {isIncoming ? (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">You</span>
                            ) : (
                              debt.toName.split(' ')[0]
                            )}
                          </span>

                          {/* Subtle Direction Badges */}
                          {isIncoming && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              Incoming
                            </span>
                          )}
                          {isOutgoing && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                              Outgoing
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-neutral-400 block truncate">
                          via {debt.toPaymentApp} ({debt.toPayoutHandle})
                        </span>
                      </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t border-neutral-100 dark:border-neutral-800/80 sm:border-0">
                      {/* Amount with Subtle Color Coding */}
                      <div className="text-left sm:text-right">
                        <span
                          className={`font-mono tabular-nums font-extrabold text-sm sm:text-base block ${
                            isIncoming
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isOutgoing
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-neutral-900 dark:text-neutral-100'
                          }`}
                        >
                          {isIncoming
                            ? `+${formatMoney(debt.amount, debt.currency)}`
                            : isOutgoing
                            ? `-${formatMoney(debt.amount, debt.currency)}`
                            : formatMoney(debt.amount, debt.currency)}
                        </span>
                        <span className="text-[10px] text-neutral-400 hidden sm:block">
                          {isIncoming ? 'To receive' : isOutgoing ? 'To send' : 'Transfer'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {isOutgoing && (
                          <a
                            href={deepLink.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[34px] px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                            title={`Open ${debt.toPaymentApp}`}
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Pay</span>
                          </a>
                        )}

                        <button
                          onClick={() => setSelectedDebtToSettle(debt)}
                          className="min-h-[34px] px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-all active:scale-95 flex items-center gap-1"
                          title="Mark settled"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{isIncoming ? 'Mark Received' : 'Mark Paid'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </SwipeableItem>
              );
            })}
          </div>
        )}
      </div>

      {/* TRAVELER BALANCES (Density-Optimized List-Item Style) */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-neutral-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Traveler Net Balances
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400">
            {trip.members.length} members
          </span>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {trip.members.map((member) => {
            const s = financials[member.userId];
            if (!s) return null;
            const { text: netText, isPositive, isZero } = formatSignedMoney(s.netBalance, trip.currency);
            const isCurrent = member.userId === currentUser.id;

            return (
              <div
                key={member.userId}
                className={`px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 transition-colors ${
                  isCurrent
                    ? 'bg-indigo-50/20 dark:bg-indigo-950/15'
                    : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30'
                }`}
              >
                {/* Traveler Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {member.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400 block truncate font-mono">
                      Paid {formatMoney(s.totalPaid, trip.currency)} · Share {formatMoney(s.totalShare, trip.currency)}
                    </span>
                  </div>
                </div>

                {/* Net Balance Status */}
                <div className="text-right shrink-0">
                  <span
                    className={`font-mono tabular-nums font-bold text-xs sm:text-sm block ${
                      isZero
                        ? 'text-neutral-400'
                        : isPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isZero ? '$0.00' : netText}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {isZero ? 'Balanced' : isPositive ? 'Gets back' : 'Owes'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AD-HOC EXPENSES (Density-Optimized List-Item Style) */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-neutral-500" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Non-Calendar Ad-Hoc Expenses
              </h3>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Fuel, shared groceries, and miscellaneous runs
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAdHocModal}
            className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {adHocExpenses.length === 0 ? (
          <p className="text-xs text-neutral-400 italic p-4 text-center">No ad-hoc expenses logged yet.</p>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {adHocExpenses.map((expense) => {
              const payer = trip.members.find((m) => m.userId === expense.paidByUserId);
              return (
                <div key={expense.id} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate block">
                      {expense.title}
                    </span>
                    <span className="text-[11px] text-neutral-400 block truncate">
                      Paid by {payer?.name.split(' ')[0] || 'Unknown'} · Split {expense.splitAmongUserIds.length} ways
                    </span>
                  </div>
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 shrink-0">
                    {formatMoney(expense.totalCost, expense.currency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SETTLEMENT HISTORY (Density-Optimized List-Item Style) */}
      {settlements.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs text-xs">
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span className="font-bold text-neutral-900 dark:text-neutral-100">Settlement Payment History</span>
            <span className="text-[11px] text-neutral-400">{settlements.length} verified payment(s)</span>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {settlements.map((s) => {
              const from = trip.members.find((m) => m.userId === s.fromUserId)?.name.split(' ')[0];
              const to = trip.members.find((m) => m.userId === s.toUserId)?.name.split(' ')[0];
              return (
                <div key={s.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                  <span className="text-neutral-700 dark:text-neutral-300">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{from}</span> paid{' '}
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{to}</span> via {s.method}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(s.amount, s.currency)}
                    </span>
                    <button
                      onClick={() => onUndoSettlement(s.id)}
                      title="Undo payment"
                      className="text-neutral-400 hover:text-rose-500 p-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mark Paid Confirmation Modal */}
      {selectedDebtToSettle && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              Confirm Settlement
            </h4>
            <p className="text-xs text-neutral-500 mb-4">
              Record verified transfer between {selectedDebtToSettle.fromName} and {selectedDebtToSettle.toName}.
            </p>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-center mb-4 border border-neutral-100 dark:border-neutral-700">
              <span className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                {formatMoney(selectedDebtToSettle.amount, selectedDebtToSettle.currency)}
              </span>
              <span className="text-xs text-neutral-600 dark:text-neutral-300 font-mono block">
                {selectedDebtToSettle.toPaymentApp}: {selectedDebtToSettle.toPayoutHandle}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setSelectedDebtToSettle(null)}
                className="px-3.5 py-2 text-neutral-500 hover:text-neutral-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmSettlement(selectedDebtToSettle)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </PullToRefresh>
  );
};

