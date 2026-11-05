import React, { useState } from 'react';
import { 
  Compass, 
  Calendar, 
  Vote, 
  Receipt, 
  Users, 
  Plus, 
  ChevronDown, 
  Sun, 
  Moon, 
  Smartphone, 
  Monitor,
  Check,
  Copy
} from 'lucide-react';
import { User, Trip } from '../types';

interface TopNavProps {
  currentTab: 'timeline' | 'ledger' | 'members';
  onSelectTab: (tab: 'timeline' | 'ledger' | 'members') => void;
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  currentTrip: Trip;
  allTrips: Trip[];
  onSelectTrip: (tripId: string) => void;
  onOpenNewTripModal: () => void;
  onOpenJoinTripModal: () => void;
  onOpenProposeEventModal: () => void;
  onOpenProfileModal: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  pendingProposalsCount: number;
  isMobilePreview: boolean;
  onToggleMobilePreview: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  allUsers,
  onSwitchUser,
  currentTrip,
  allTrips,
  onSelectTrip,
  onOpenNewTripModal,
  onOpenJoinTripModal,
  onOpenProposeEventModal,
  onOpenProfileModal,
  isDarkMode,
  onToggleDarkMode,
  pendingProposalsCount,
  isMobilePreview,
  onToggleMobilePreview,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTripMenu, setShowTripMenu] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentTrip.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-4">
          
          {/* Zone 1: Wordmark & Trip Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-2xs">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-neutral-900 dark:text-white">
                EquiTrip
              </span>
            </div>

            {/* Trip Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowTripMenu(!showTripMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 transition-colors text-xs font-semibold text-neutral-700 dark:text-neutral-200"
              >
                <span className="max-w-[130px] sm:max-w-[180px] truncate">{currentTrip.title}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {showTripMenu && (
                <div 
                  className="absolute left-0 mt-2 w-64 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setShowTripMenu(false)}
                >
                  <div className="px-3 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Select Trip
                  </div>
                  {allTrips.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelectTrip(t.id);
                        setShowTripMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                        t.id === currentTrip.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <span className="truncate">{t.title}</span>
                      <span className="font-mono text-[10px] text-neutral-400">{t.code}</span>
                    </button>
                  ))}
                  
                  <div className="border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-1 px-1">
                    <button
                      onClick={() => {
                        setShowTripMenu(false);
                        onOpenNewTripModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-500" />
                      <span>New Trip</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowTripMenu(false);
                        onOpenJoinTripModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Join with Code</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick 6-char Join Code */}
            <button
              onClick={handleCopyCode}
              title="Click to copy join code"
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] font-mono font-bold text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 transition-colors"
            >
              <span>{currentTrip.code}</span>
              {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-neutral-400" />}
            </button>
          </div>

          {/* Zone 2: Navigation Links (Clean, streamlined tabs) */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onSelectTab('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                currentTab === 'timeline'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Itinerary</span>
              {pendingProposalsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {pendingProposalsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('ledger')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                currentTab === 'ledger'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Ledger & Split</span>
            </button>

            <button
              onClick={() => onSelectTab('members')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                currentTab === 'members'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Travelers ({currentTrip.members.length})
            </button>
          </nav>

          {/* Zone 3: Actions, Device Toggle & User Profile */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Mobile / Desktop Viewport Switcher */}
            <button
              onClick={onToggleMobilePreview}
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                isMobilePreview 
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' 
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title="Preview in Mobile Phone Frame vs Desktop"
            >
              {isMobilePreview ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
              <span>{isMobilePreview ? 'Mobile Frame' : 'Desktop View'}</span>
            </button>

            {/* Propose Event CTA */}
            <button
              onClick={onOpenProposeEventModal}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Event</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Avatar & Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-0.5 rounded-full ring-1 ring-neutral-200 dark:ring-neutral-700 hover:ring-indigo-500 transition-all"
                title={`Active user: ${currentUser.name}`}
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover"
                />
              </button>

              {showUserMenu && (
                <div 
                  className="absolute right-0 mt-2 w-60 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 py-2 z-50"
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{currentUser.name}</p>
                    <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">{currentUser.payoutHandle}</p>
                  </div>

                  <div className="px-3 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mt-1">
                    Switch Active Tester
                  </div>
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u.id);
                        setShowUserMenu(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left flex items-center justify-between text-xs transition-colors ${
                        u.id === currentUser.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 font-bold'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <span>{u.name}</span>
                      <span className="text-[10px] text-neutral-400">{u.payoutHandle}</span>
                    </button>
                  ))}

                  <div className="border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-1 px-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenProfileModal();
                      }}
                      className="w-full text-left px-2 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                    >
                      Edit Payout Handle
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
