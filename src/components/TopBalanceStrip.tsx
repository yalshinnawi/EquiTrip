import React from 'react';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, DollarSign } from 'lucide-react';
import { formatMoney, formatSignedMoney } from '../utils/currency';
import { MemberFinancialSummary } from '../utils/debtSimplification';
import { Trip } from '../types';

interface TopBalanceStripProps {
  userSummary?: MemberFinancialSummary;
  totalTripSpend: number;
  currency: string;
  trip: Trip;
  onSettleUp: () => void;
  activeConfirmedEventsCount: number;
  sandboxProposalsCount: number;
}

export const TopBalanceStrip: React.FC<TopBalanceStripProps> = ({
  userSummary,
  totalTripSpend,
  currency,
  onSettleUp,
}) => {
  const netBalance = userSummary?.netBalance ?? 0;
  const { isPositive, isZero } = formatSignedMoney(netBalance, currency);
  const absAmount = formatMoney(Math.abs(netBalance), currency);

  return (
    <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
      <div className="max-w-4xl mx-auto px-4 py-2.5 sm:py-3">
        {/* Main Row: Balance status + Settle up button */}
        <div className="flex items-center justify-between gap-3">
          
          {/* Balance card */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isZero
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                  : isPositive
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
              }`}
            >
              {isZero ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isPositive ? (
                <ArrowDownRight className="w-4 h-4" />
              ) : (
                <ArrowUpRight className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0">
              <span
                className={`text-[clamp(0.625rem,1.8vw,0.6875rem)] font-bold uppercase tracking-wider block leading-tight ${
                  isZero
                    ? 'text-neutral-400'
                    : isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isZero ? 'Settled Up' : isPositive ? 'You are owed' : 'You owe'}
              </span>

              <div className="text-[clamp(1.05rem,3.2vw,1.35rem)] font-bold font-mono tabular-nums leading-tight truncate">
                <span
                  className={
                    isZero
                      ? 'text-neutral-700 dark:text-neutral-300'
                      : isPositive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }
                >
                  {isZero ? '0.00' : `${isPositive ? '+' : '-'}${absAmount}`}
                </span>
              </div>
            </div>
          </div>

          {/* Settle Up Action Button with comfortable touch target */}
          <button
            onClick={onSettleUp}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-[clamp(0.6875rem,2vw,0.75rem)] font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-2xs active:scale-95"
          >
            <DollarSign className="w-4 h-4" />
            <span>Settle Up</span>
          </button>
        </div>

        {/* Secondary Compact Metrics: 3 dedicated columns that never collide or wrap awkwardly */}
        <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 grid grid-cols-3 divide-x divide-neutral-200 dark:divide-neutral-800 text-center bg-neutral-50 dark:bg-neutral-800/40 rounded-lg py-1.5 px-1">
          <div className="px-1 min-w-0">
            <span className="text-[clamp(0.5625rem,1.6vw,0.625rem)] uppercase font-semibold text-neutral-400 block truncate">
              Trip Total
            </span>
            <span className="text-[clamp(0.6875rem,2.1vw,0.75rem)] font-bold font-mono tabular-nums text-neutral-800 dark:text-neutral-200 block truncate">
              {formatMoney(totalTripSpend, currency)}
            </span>
          </div>

          <div className="px-1 min-w-0">
            <span className="text-[clamp(0.5625rem,1.6vw,0.625rem)] uppercase font-semibold text-neutral-400 block truncate">
              You Paid
            </span>
            <span className="text-[clamp(0.6875rem,2.1vw,0.75rem)] font-bold font-mono tabular-nums text-neutral-800 dark:text-neutral-200 block truncate">
              {formatMoney(userSummary?.totalPaid ?? 0, currency)}
            </span>
          </div>

          <div className="px-1 min-w-0">
            <span className="text-[clamp(0.5625rem,1.6vw,0.625rem)] uppercase font-semibold text-neutral-400 block truncate">
              Your Share
            </span>
            <span className="text-[clamp(0.6875rem,2.1vw,0.75rem)] font-bold font-mono tabular-nums text-neutral-800 dark:text-neutral-200 block truncate">
              {formatMoney(userSummary?.totalShare ?? 0, currency)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
