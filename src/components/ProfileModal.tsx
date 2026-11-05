import React, { useState } from 'react';
import { 
  X, 
  User as UserIcon, 
  CreditCard, 
  DollarSign, 
  ShieldCheck, 
  Mail, 
  Check, 
  Sparkles,
  ArrowRight,
  Lock
} from 'lucide-react';
import { User, PaymentApp } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSaveProfile: (updatedUser: Partial<User>) => void;
  onSimulateAuthMethod?: (method: 'google' | 'apple' | 'magic_link', email?: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveProfile,
  onSimulateAuthMethod,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [baseCurrency, setBaseCurrency] = useState(currentUser.baseCurrency);
  const [payoutHandle, setPayoutHandle] = useState(currentUser.payoutHandle);
  const [paymentApp, setPaymentApp] = useState<PaymentApp>(currentUser.paymentApp);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [authSuccessNotice, setAuthSuccessNotice] = useState<string | null>(null);

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80',
  ];

  const handleSimulateLogin = (provider: 'google' | 'apple' | 'magic_link') => {
    setAuthSuccessNotice(`Authenticated via Supabase Auth (${provider.replace('_', ' ').toUpperCase()})`);
    setTimeout(() => setAuthSuccessNotice(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      name: name.trim(),
      email: email.trim(),
      baseCurrency,
      payoutHandle: payoutHandle.trim(),
      paymentApp,
      avatar,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/40">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Financial Identity & Authentication</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Supabase Auth login & payout handle capture for Splitwise settlement deep-links.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {authSuccessNotice && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-in fade-in duration-200">
            <Check className="w-3.5 h-3.5" />
            <span>{authSuccessNotice}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* Quick Simulated Supabase Auth Buttons */}
          <div>
            <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Fast Supabase Auth Login
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSimulateLogin('google')}
                className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => handleSimulateLogin('apple')}
                className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Apple</span>
              </button>
              <button
                type="button"
                onClick={() => handleSimulateLogin('magic_link')}
                className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Magic Link</span>
              </button>
            </div>
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Choose Profile Photo
            </label>
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt="Selected Avatar"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500 shadow-sm"
              />
              <div className="flex items-center gap-2">
                {sampleAvatars.map((url, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setAvatar(url)}
                    className={`w-8 h-8 rounded-full overflow-hidden transition-all ${
                      avatar === url ? 'ring-2 ring-indigo-500 scale-105' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Option ${i}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 font-medium"
              />
            </div>
          </div>

          {/* Financial Identity Capture */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700 space-y-3">
            <span className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Financial Identity Capture (Settlement Hub)
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Base Currency
                </label>
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-neutral-900 dark:text-neutral-100"
                >
                  <option value="USD">USD ($ United States)</option>
                  <option value="EUR">EUR (€ Euro)</option>
                  <option value="JPY">JPY (¥ Japanese Yen)</option>
                  <option value="GBP">GBP (£ British Pound)</option>
                  <option value="CAD">CAD (CA$ Canadian Dollar)</option>
                  <option value="AUD">AUD (A$ Australian Dollar)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Primary Payout App
                </label>
                <select
                  value={paymentApp}
                  onChange={(e) => setPaymentApp(e.target.value as PaymentApp)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-neutral-900 dark:text-neutral-100 capitalize"
                >
                  <option value="venmo">Venmo</option>
                  <option value="revolut">Revolut</option>
                  <option value="cashapp">Cash App</option>
                  <option value="paypal">PayPal</option>
                  <option value="zelle">Zelle</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Payout Handle / Username (e.g. @handle)
                </label>
                <input
                  type="text"
                  required
                  placeholder="@your_username"
                  value={payoutHandle}
                  onChange={(e) => setPayoutHandle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Other travelers tap "Pay via {paymentApp}" to initiate zero-fee bilateral transfers directly to this handle.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
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
              <Check className="w-3.5 h-3.5" />
              <span>Save Financial Profile</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
