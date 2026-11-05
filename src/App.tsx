/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  INITIAL_USERS, 
  INITIAL_TRIPS, 
  INITIAL_EVENTS, 
  INITIAL_AD_HOC_EXPENSES, 
  INITIAL_SETTLEMENTS 
} from './data/initialData';
import { User, Trip, ItineraryEvent, AdHocExpense, SettlementPayment, PaymentApp } from './types';
import { calculateMemberFinancials } from './utils/debtSimplification';
import { TopNav } from './components/TopNav';
import { TopBalanceStrip } from './components/TopBalanceStrip';
import { TimelineView } from './components/TimelineView';
import { LedgerView } from './components/LedgerView';
import { MembersView } from './components/MembersView';
import { ProposeEventModal } from './components/ProposeEventModal';
import { AdHocExpenseModal } from './components/AdHocExpenseModal';
import { ProfileModal } from './components/ProfileModal';
import { TripModal } from './components/TripModal';
import { VenueMapModal } from './components/VenueMapModal';
import { Calendar, Vote, Receipt, Users, Plus, Smartphone, Monitor } from 'lucide-react';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Mobile Device Frame Simulator Toggle (shows the exact mobile app UX)
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);

  // Application Data State with LocalStorage Persistence
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('equitrip_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('equitrip_current_user_id') || 'user_elena';
  });

  const [allTrips, setAllTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('equitrip_trips');
    return saved ? JSON.parse(saved) : INITIAL_TRIPS;
  });

  const [currentTripId, setCurrentTripId] = useState<string>(() => {
    return localStorage.getItem('equitrip_current_trip_id') || 'trip_kyoto';
  });

  const [events, setEvents] = useState<ItineraryEvent[]>(() => {
    const saved = localStorage.getItem('equitrip_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [adHocExpenses, setAdHocExpenses] = useState<AdHocExpense[]>(() => {
    const saved = localStorage.getItem('equitrip_adhoc');
    return saved ? JSON.parse(saved) : INITIAL_AD_HOC_EXPENSES;
  });

  const [settlements, setSettlements] = useState<SettlementPayment[]>(() => {
    const saved = localStorage.getItem('equitrip_settlements');
    return saved ? JSON.parse(saved) : INITIAL_SETTLEMENTS;
  });

  // Local storage effects
  useEffect(() => {
    localStorage.setItem('equitrip_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('equitrip_current_user_id', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('equitrip_trips', JSON.stringify(allTrips));
  }, [allTrips]);

  useEffect(() => {
    localStorage.setItem('equitrip_current_trip_id', currentTripId);
  }, [currentTripId]);

  useEffect(() => {
    localStorage.setItem('equitrip_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('equitrip_adhoc', JSON.stringify(adHocExpenses));
  }, [adHocExpenses]);

  useEffect(() => {
    localStorage.setItem('equitrip_settlements', JSON.stringify(settlements));
  }, [settlements]);

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'timeline' | 'ledger' | 'members'>('timeline');

  // Modals state
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [proposeModalInitialDate, setProposeModalInitialDate] = useState<string | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<ItineraryEvent | null>(null);

  const [isAdHocModalOpen, setIsAdHocModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [tripModalMode, setTripModalMode] = useState<'create' | 'join' | null>(null);
  const [isVenueMapOpen, setIsVenueMapOpen] = useState(false);
  const [selectedMapEvent, setSelectedMapEvent] = useState<ItineraryEvent | null>(null);
  const [mapDayEvents, setMapDayEvents] = useState<ItineraryEvent[]>([]);

  // Active user & trip resolvers
  const currentUser = allUsers.find((u) => u.id === currentUserId) || allUsers[0];
  const currentTrip = allTrips.find((t) => t.id === currentTripId) || allTrips[0];

  // Trip events & expenses filter
  const currentTripEvents = events.filter((e) => e.tripId === currentTrip.id);
  const currentTripAdHoc = adHocExpenses.filter((e) => e.tripId === currentTrip.id);
  const currentTripSettlements = settlements.filter((s) => s.tripId === currentTrip.id);

  // Financial calculations
  const financials = calculateMemberFinancials(
    currentTrip.members,
    currentTripEvents,
    currentTripAdHoc,
    currentTripSettlements
  );

  const userFinancialSummary = financials[currentUser.id];

  const confirmedTripEvents = currentTripEvents.filter(
    (e) => e.status === 'confirmed' || e.status === 'locked'
  );
  const totalTripSpend =
    confirmedTripEvents.reduce((sum, e) => sum + e.totalCost, 0) +
    currentTripAdHoc.reduce((sum, e) => sum + e.totalCost, 0);

  const pendingProposalsCount = currentTripEvents.filter((e) => e.status === 'proposed').length;

  // Handlers
  const handleVoteEvent = (eventId: string, vote: 'in' | 'skip') => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            votes: { ...e.votes, [currentUser.id]: vote },
          };
        }
        return e;
      })
    );
  };

  const handleLockEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            status: 'locked',
            isPaid: true,
          };
        }
        return e;
      })
    );
  };

  const handleSaveEvent = (eventData: Omit<ItineraryEvent, 'id'>) => {
    if (editingEvent) {
      setEvents((prev) =>
        prev.map((e) => (e.id === editingEvent.id ? { ...eventData, id: editingEvent.id } : e))
      );
      setEditingEvent(null);
    } else {
      const newEvent: ItineraryEvent = {
        ...eventData,
        id: `event_${Date.now()}`,
      };
      setEvents((prev) => [...prev, newEvent]);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const handleSaveAdHocExpense = (expenseData: Omit<AdHocExpense, 'id'>) => {
    const newExpense: AdHocExpense = {
      ...expenseData,
      id: `adhoc_${Date.now()}`,
    };
    setAdHocExpenses((prev) => [...prev, newExpense]);
  };

  const handleRecordSettlement = (
    fromUserId: string,
    toUserId: string,
    amount: number,
    method: PaymentApp
  ) => {
    const newSettlement: SettlementPayment = {
      id: `set_${Date.now()}`,
      tripId: currentTrip.id,
      fromUserId,
      toUserId,
      amount,
      currency: currentTrip.currency,
      timestamp: new Date().toISOString(),
      method,
      note: 'One-tap verified settlement',
    };
    setSettlements((prev) => [newSettlement, ...prev]);
  };

  const handleUndoSettlement = (settlementId: string) => {
    setSettlements((prev) => prev.filter((s) => s.id !== settlementId));
  };

  const handleCreateTrip = (
    tripData: Omit<Trip, 'id' | 'code' | 'members' | 'createdBy'>
  ) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newTrip: Trip = {
      ...tripData,
      id: `trip_${Date.now()}`,
      code,
      createdBy: currentUser.id,
      members: [
        {
          userId: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          role: 'organizer',
          payoutHandle: currentUser.payoutHandle,
          paymentApp: currentUser.paymentApp,
        },
      ],
    };

    setAllTrips((prev) => [newTrip, ...prev]);
    setCurrentTripId(newTrip.id);
    setCurrentTab('timeline');
  };

  const handleJoinTrip = (code: string): boolean => {
    const found = allTrips.find((t) => t.code.toUpperCase() === code.toUpperCase());
    if (!found) return false;

    const alreadyMember = found.members.some((m) => m.userId === currentUser.id);
    if (!alreadyMember) {
      const updatedMembers = [
        ...found.members,
        {
          userId: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          role: 'member' as const,
          payoutHandle: currentUser.payoutHandle,
          paymentApp: currentUser.paymentApp,
        },
      ];

      setAllTrips((prev) =>
        prev.map((t) => (t.id === found.id ? { ...t, members: updatedMembers } : t))
      );
    }

    setCurrentTripId(found.id);
    setCurrentTab('timeline');
    return true;
  };

  const handleSaveProfile = (updated: Partial<User>) => {
    const updatedUser = { ...currentUser, ...updated };
    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    setAllTrips((prev) =>
      prev.map((t) => ({
        ...t,
        members: t.members.map((m) =>
          m.userId === currentUser.id
            ? {
                ...m,
                name: updatedUser.name,
                avatar: updatedUser.avatar,
                payoutHandle: updatedUser.payoutHandle,
                paymentApp: updatedUser.paymentApp,
              }
            : m
        ),
      }))
    );
  };

  // Pull-to-refresh sync handler
  const handleRefreshTripData = async () => {
    // Simulate real-time sync / network revalidation
    await new Promise((resolve) => setTimeout(resolve, 650));

    const savedEvents = localStorage.getItem('equitrip_events');
    if (savedEvents) setEvents(JSON.parse(savedEvents));

    const savedAdHoc = localStorage.getItem('equitrip_adhoc');
    if (savedAdHoc) setAdHocExpenses(JSON.parse(savedAdHoc));

    const savedSettlements = localStorage.getItem('equitrip_settlements');
    if (savedSettlements) setSettlements(JSON.parse(savedSettlements));

    const savedTrips = localStorage.getItem('equitrip_trips');
    if (savedTrips) setAllTrips(JSON.parse(savedTrips));

    const savedUsers = localStorage.getItem('equitrip_users');
    if (savedUsers) setAllUsers(JSON.parse(savedUsers));
  };

  // Render main screen content
  const renderScreenContent = () => {
    switch (currentTab) {
      case 'timeline':
        return (
          <TimelineView
            trip={currentTrip}
            currentUser={currentUser}
            events={currentTripEvents}
            onVoteEvent={handleVoteEvent}
            onLockEvent={handleLockEvent}
            onOpenProposeEventModal={(date) => {
              setEditingEvent(null);
              setProposeModalInitialDate(date);
              setIsProposeModalOpen(true);
            }}
            onSelectEventForEdit={(event) => {
              setEditingEvent(event);
              setIsProposeModalOpen(true);
            }}
            onDeleteEvent={handleDeleteEvent}
            onOpenVenueMap={(event, dayEvents) => {
              setSelectedMapEvent(event);
              setMapDayEvents(dayEvents);
              setIsVenueMapOpen(true);
            }}
            onRefresh={handleRefreshTripData}
          />
        );
      case 'ledger':
        return (
          <LedgerView
            trip={currentTrip}
            currentUser={currentUser}
            events={currentTripEvents}
            adHocExpenses={currentTripAdHoc}
            settlements={currentTripSettlements}
            onOpenAdHocModal={() => setIsAdHocModalOpen(true)}
            onRecordSettlement={handleRecordSettlement}
            onUndoSettlement={handleUndoSettlement}
            onRefresh={handleRefreshTripData}
          />
        );
      case 'members':
        return (
          <MembersView
            trip={currentTrip}
            currentUser={currentUser}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
      
      {/* Top Bar Navigation */}
      <TopNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={setCurrentUserId}
        currentTrip={currentTrip}
        allTrips={allTrips}
        onSelectTrip={setCurrentTripId}
        onOpenNewTripModal={() => setTripModalMode('create')}
        onOpenJoinTripModal={() => setTripModalMode('join')}
        onOpenProposeEventModal={() => {
          setEditingEvent(null);
          setProposeModalInitialDate(undefined);
          setIsProposeModalOpen(true);
        }}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        pendingProposalsCount={pendingProposalsCount}
        isMobilePreview={isMobilePreview}
        onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
      />

      {/* Main View Area (Responsive Desktop vs Centered Mobile Device Frame) */}
      {isMobilePreview ? (
        /* Mobile Device Frame Mockup (iPhone 16 Pro styling) */
        <div className="flex-1 py-8 px-4 flex items-center justify-center">
          <div className="w-[390px] h-[844px] bg-neutral-50 dark:bg-neutral-900 rounded-[50px] shadow-2xl ring-12 ring-neutral-900 dark:ring-neutral-800 flex flex-col overflow-hidden relative border border-neutral-300 dark:border-neutral-700">
            
            {/* Dynamic Island / Status Bar */}
            <div className="h-10 w-full bg-white dark:bg-neutral-900 flex items-center justify-between px-7 shrink-0 z-20">
              <span className="text-[11px] font-bold font-mono">9:41</span>
              <div className="w-20 h-4 bg-black rounded-full mx-auto" />
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-[10px]">5G</span>
                <span>􀛨</span>
              </div>
            </div>

            {/* Mobile Header Bar */}
            <div className="px-4 py-2 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">EquiTrip</span>
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[170px] block">
                  {currentTrip.title}
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setIsProposeModalOpen(true);
                }}
                aria-label="Add activity"
                className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-2xs active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Top Balance Strip */}
            <TopBalanceStrip
              userSummary={userFinancialSummary}
              totalTripSpend={totalTripSpend}
              currency={currentTrip.currency}
              trip={currentTrip}
              onSettleUp={() => setCurrentTab('ledger')}
              activeConfirmedEventsCount={confirmedTripEvents.length}
              sandboxProposalsCount={pendingProposalsCount}
            />

            {/* Mobile Scrollable Viewport */}
            <div className="flex-1 overflow-y-auto pb-20">
              {renderScreenContent()}
            </div>

            {/* Mobile Native Bottom Navigation Tab Bar (Clean 3-Tab Structure with Large Touch Targets) */}
            <div className="absolute bottom-0 left-0 right-0 h-18 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-3 items-center px-3 z-30 pb-3 pt-1">
              <button
                onClick={() => setCurrentTab('timeline')}
                className={`min-h-[48px] min-w-[48px] w-full flex flex-col items-center justify-center p-1.5 rounded-xl transition-all relative active:scale-95 ${
                  currentTab === 'timeline' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[clamp(0.6875rem,2.2vw,0.75rem)] mt-0.5 font-semibold">Itinerary</span>
                {pendingProposalsCount > 0 && (
                  <span className="absolute top-1 right-6 w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[8px] flex items-center justify-center font-bold">
                    {pendingProposalsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setCurrentTab('ledger')}
                className={`min-h-[48px] min-w-[48px] w-full flex flex-col items-center justify-center p-1.5 rounded-xl transition-all active:scale-95 ${
                  currentTab === 'ledger' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <Receipt className="w-5 h-5" />
                <span className="text-[clamp(0.6875rem,2.2vw,0.75rem)] mt-0.5 font-semibold">Ledger</span>
              </button>

              <button
                onClick={() => setCurrentTab('members')}
                className={`min-h-[48px] min-w-[48px] w-full flex flex-col items-center justify-center p-1.5 rounded-xl transition-all active:scale-95 ${
                  currentTab === 'members' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[clamp(0.6875rem,2.2vw,0.75rem)] mt-0.5 font-semibold">Travelers</span>
              </button>
            </div>

            {/* iPhone Home Indicator bar */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-neutral-400 dark:bg-neutral-600 rounded-full z-40 pointer-events-none" />

          </div>
        </div>
      ) : (
        /* Full Responsive Canvas View */
        <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900">
          <TopBalanceStrip
            userSummary={userFinancialSummary}
            totalTripSpend={totalTripSpend}
            currency={currentTrip.currency}
            trip={currentTrip}
            onSettleUp={() => setCurrentTab('ledger')}
            activeConfirmedEventsCount={confirmedTripEvents.length}
            sandboxProposalsCount={pendingProposalsCount}
          />
          <main className="flex-1 pb-20 md:pb-6">
            {renderScreenContent()}
          </main>

          {/* Responsive Mobile Fixed Bottom Navigation Bar (for real mobile viewports < md) */}
          <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-3 items-center px-4 z-40 shadow-lg">
            <button
              onClick={() => setCurrentTab('timeline')}
              className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center p-1.5 rounded-xl transition-all relative active:scale-95 ${
                currentTab === 'timeline' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-neutral-400'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[clamp(0.6875rem,2.2vw,0.75rem)] mt-0.5 font-semibold">Itinerary</span>
              {pendingProposalsCount > 0 && (
                <span className="absolute top-1 right-8 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {pendingProposalsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('ledger')}
              className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center p-1.5 rounded-xl transition-all active:scale-95 ${
                currentTab === 'ledger' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-neutral-400'
              }`}
            >
              <Receipt className="w-5 h-5" />
              <span className="text-[clamp(0.6875rem,2.2vw,0.75rem)] mt-0.5 font-semibold">Ledger</span>
            </button>

            <button
              onClick={() => setCurrentTab('members')}
              className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center p-1.5 rounded-xl transition-all active:scale-95 ${
                currentTab === 'members' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-neutral-400'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[clamp(0.6875rem,2.2vw,0.75rem)] mt-0.5 font-semibold">Travelers</span>
            </button>
          </nav>
        </div>
      )}

      {/* Modals */}
      <ProposeEventModal
        isOpen={isProposeModalOpen}
        onClose={() => {
          setIsProposeModalOpen(false);
          setEditingEvent(null);
        }}
        trip={currentTrip}
        currentUser={currentUser}
        onSaveEvent={handleSaveEvent}
        initialDate={proposeModalInitialDate}
        editingEvent={editingEvent}
      />

      <AdHocExpenseModal
        isOpen={isAdHocModalOpen}
        onClose={() => setIsAdHocModalOpen(false)}
        trip={currentTrip}
        currentUser={currentUser}
        onSaveExpense={handleSaveAdHocExpense}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onSaveProfile={handleSaveProfile}
      />

      {tripModalMode && (
        <TripModal
          isOpen={Boolean(tripModalMode)}
          onClose={() => setTripModalMode(null)}
          mode={tripModalMode}
          currentUser={currentUser}
          allTrips={allTrips}
          onCreateTrip={handleCreateTrip}
          onJoinTrip={handleJoinTrip}
        />
      )}

      <VenueMapModal
        isOpen={isVenueMapOpen}
        onClose={() => setIsVenueMapOpen(false)}
        selectedEvent={selectedMapEvent}
        dayEvents={mapDayEvents}
      />

    </div>
  );
}
