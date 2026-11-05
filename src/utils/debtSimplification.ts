import { ItineraryEvent, AdHocExpense, SettlementPayment, TripMember, SimplifiedDebt } from '../types';

export interface MemberFinancialSummary {
  userId: string;
  name: string;
  avatar: string;
  payoutHandle: string;
  paymentApp: TripMember['paymentApp'];
  totalPaid: number;      // Amount this user fronted for the group
  totalShare: number;     // Fair share this user is responsible for
  settlementsPaid: number;   // Settlements already sent out
  settlementsReceived: number; // Settlements received
  netBalance: number;     // Positive: owed money. Negative: owes money.
}

/**
 * Calculates who attended each event (voted 'in') and their exact cost share.
 */
export function getEventAttendees(event: ItineraryEvent, allMembers: TripMember[]): string[] {
  const inUserIds = Object.entries(event.votes)
    .filter(([_, vote]) => vote === 'in')
    .map(([userId]) => userId);
  
  // If no one explicitly voted 'in' yet (e.g. newly created proposal), return empty or creator
  return inUserIds;
}

/**
 * Returns the exact cost share for a specific user on a given event.
 * If user voted 'skip' or didn't vote 'in', returns 0.
 */
export function getUserEventShare(event: ItineraryEvent, userId: string, attendees: string[]): number {
  if (!attendees.includes(userId) || attendees.length === 0) {
    return 0;
  }

  if (event.splitType === 'custom_amounts' && event.customSplits && event.customSplits[userId] !== undefined) {
    return event.customSplits[userId];
  }

  if (event.splitType === 'percentages' && event.customSplits && event.customSplits[userId] !== undefined) {
    return (event.customSplits[userId] / 100) * event.totalCost;
  }

  // Default: Equal split among participants who voted 'in'
  return event.totalCost / attendees.length;
}

/**
 * Calculates net balances for every member across locked/confirmed events,
 * ad-hoc expenses, and completed settlements.
 */
export function calculateMemberFinancials(
  members: TripMember[],
  events: ItineraryEvent[],
  adHocExpenses: AdHocExpense[],
  settlements: SettlementPayment[]
): Record<string, MemberFinancialSummary> {
  const summary: Record<string, MemberFinancialSummary> = {};

  for (const m of members) {
    summary[m.userId] = {
      userId: m.userId,
      name: m.name,
      avatar: m.avatar,
      payoutHandle: m.payoutHandle,
      paymentApp: m.paymentApp,
      totalPaid: 0,
      totalShare: 0,
      settlementsPaid: 0,
      settlementsReceived: 0,
      netBalance: 0,
    };
  }

  // 1. Process Itinerary Events (only confirmed or locked events carry financial obligations)
  for (const event of events) {
    if (event.status !== 'confirmed' && event.status !== 'locked') {
      continue;
    }

    // Payer fronts the total cost
    if (summary[event.paidByUserId]) {
      summary[event.paidByUserId].totalPaid += event.totalCost;
    }

    const attendees = getEventAttendees(event, members);
    for (const attendeeId of attendees) {
      if (summary[attendeeId]) {
        const share = getUserEventShare(event, attendeeId, attendees);
        summary[attendeeId].totalShare += share;
      }
    }
  }

  // 2. Process Ad-Hoc Expenses
  for (const expense of adHocExpenses) {
    if (summary[expense.paidByUserId]) {
      summary[expense.paidByUserId].totalPaid += expense.totalCost;
    }

    const splitCount = expense.splitAmongUserIds.length;
    if (splitCount > 0) {
      const perPerson = expense.totalCost / splitCount;
      for (const attendeeId of expense.splitAmongUserIds) {
        if (summary[attendeeId]) {
          summary[attendeeId].totalShare += perPerson;
        }
      }
    }
  }

  // 3. Process Recorded Settlement Payments
  for (const s of settlements) {
    if (summary[s.fromUserId]) {
      summary[s.fromUserId].settlementsPaid += s.amount;
    }
    if (summary[s.toUserId]) {
      summary[s.toUserId].settlementsReceived += s.amount;
    }
  }

  // 4. Compute Net Balance
  // Net = (totalPaid + settlementsPaid) - (totalShare + settlementsReceived)
  for (const m of members) {
    const s = summary[m.userId];
    const net = (s.totalPaid + s.settlementsPaid) - (s.totalShare + s.settlementsReceived);
    // Round to 2 decimal places to avoid floating point drift
    s.netBalance = Math.round(net * 100) / 100;
  }

  return summary;
}

/**
 * Greedy Min-Cash-Flow Debt Simplification Algorithm.
 * Compresses an N-member web of debts into minimal bilateral payments.
 */
export function simplifyDebts(
  financials: Record<string, MemberFinancialSummary>,
  currency: string = 'USD'
): {
  simplifiedDebts: SimplifiedDebt[];
  rawDebtCount: number;
  compressedDebtCount: number;
} {
  // Working balances
  const balances: { userId: string; balance: number }[] = Object.values(financials).map((f) => ({
    userId: f.userId,
    balance: f.netBalance,
  }));

  const simplifiedDebts: SimplifiedDebt[] = [];
  let debtIdCounter = 1;

  // Clone balances to mutate in greedy matching
  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  for (const b of balances) {
    if (b.balance > 0.009) {
      creditors.push({ userId: b.userId, amount: b.balance });
    } else if (b.balance < -0.009) {
      debtors.push({ userId: b.userId, amount: -b.balance });
    }
  }

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settledAmount = Math.min(debtor.amount, creditor.amount);

    if (settledAmount > 0.009) {
      const debtorInfo = financials[debtor.userId];
      const creditorInfo = financials[creditor.userId];

      simplifiedDebts.push({
        id: `sim_debt_${debtIdCounter++}`,
        fromUserId: debtor.userId,
        fromName: debtorInfo?.name || debtor.userId,
        fromAvatar: debtorInfo?.avatar || '',
        toUserId: creditor.userId,
        toName: creditorInfo?.name || creditor.userId,
        toAvatar: creditorInfo?.avatar || '',
        toPayoutHandle: creditorInfo?.payoutHandle || '',
        toPaymentApp: creditorInfo?.paymentApp || 'venmo',
        amount: Math.round(settledAmount * 100) / 100,
        currency,
      });

      debtor.amount -= settledAmount;
      creditor.amount -= settledAmount;
    }

    if (debtor.amount <= 0.009) {
      dIdx++;
    }
    if (creditor.amount <= 0.009) {
      cIdx++;
    }
  }

  // Estimate raw pairwise debts count without simplification (combinatorial web)
  const nonZeroCount = Object.values(financials).filter((f) => Math.abs(f.netBalance) > 0.01).length;
  const rawDebtCount = nonZeroCount > 1 ? Math.max(simplifiedDebts.length, Math.round((nonZeroCount * (nonZeroCount - 1)) / 1.5)) : simplifiedDebts.length;

  return {
    simplifiedDebts,
    rawDebtCount,
    compressedDebtCount: simplifiedDebts.length,
  };
}
