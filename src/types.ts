export type PaymentApp = 'venmo' | 'revolut' | 'cashapp' | 'zelle' | 'paypal';

export type EventCategory = 'activity' | 'dining' | 'lodging' | 'transit' | 'culture' | 'nightlife' | 'groceries' | 'fuel' | 'rideshare';

export type SplitType = 'equal' | 'custom_amounts' | 'percentages';

export type TransitMode = 'walk' | 'transit' | 'drive' | 'bike' | 'train' | 'boat';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  baseCurrency: string; // 'USD' | 'EUR' | 'JPY' | 'GBP' etc.
  payoutHandle: string; // e.g. '@elena_r'
  paymentApp: PaymentApp;
}

export interface TripMember {
  userId: string;
  name: string;
  avatar: string;
  role: 'organizer' | 'member';
  payoutHandle: string;
  paymentApp: PaymentApp;
}

export interface TransitInfo {
  mode: TransitMode;
  durationMinutes: number;
  distanceText?: string;
  instructions?: string;
}

export interface ItineraryEvent {
  id: string;
  tripId: string;
  title: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  placeId?: string;
  googleMapsUri?: string;
  notes?: string;
  isAdHocExpense: boolean;
  status: 'proposed' | 'confirmed' | 'locked' | 'cancelled';
  requiresConsensus: boolean;
  approvalThresholdPercent: number; // e.g. 50 = majority
  votes: Record<string, 'in' | 'skip'>; // userId -> 'in' | 'skip'
  
  // Financial attributes
  totalCost: number;
  currency: string;
  isPaid: boolean;
  paidByUserId: string;
  splitType: SplitType;
  customSplits?: Record<string, number>; // userId -> custom amount or percentage
  
  transitToNext?: TransitInfo;
}

export interface AdHocExpense {
  id: string;
  tripId: string;
  title: string;
  category: EventCategory;
  date: string;
  totalCost: number;
  currency: string;
  paidByUserId: string;
  splitAmongUserIds: string[];
  notes?: string;
  isPaid: boolean;
}

export interface SettlementPayment {
  id: string;
  tripId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  timestamp: string;
  method: PaymentApp | 'cash' | 'bank_transfer';
  note?: string;
}

export interface SimplifiedDebt {
  id: string;
  fromUserId: string;
  fromName: string;
  fromAvatar: string;
  toUserId: string;
  toName: string;
  toAvatar: string;
  toPayoutHandle: string;
  toPaymentApp: PaymentApp;
  amount: number;
  currency: string;
}

export interface Trip {
  id: string;
  code: string; // 6-character join code e.g. 'KYOTO4'
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  currency: string;
  coverImage: string;
  createdBy: string;
  members: TripMember[];
}
