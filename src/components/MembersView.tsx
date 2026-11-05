import React, { useState } from 'react';
import { Users, Copy, Check, Share2, Crown, ExternalLink } from 'lucide-react';
import { Trip, User } from '../types';
import { getPaymentDeepLink } from '../utils/currency';

interface MembersViewProps {
  trip: Trip;
  currentUser: User;
  onOpenProfileModal: () => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  trip,
  currentUser,
  onOpenProfileModal,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(trip.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/?join=${trip.code}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Clean Invite Card */}
      <div className="p-5 rounded-2xl bg-neutral-900 text-white dark:bg-neutral-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
            Trip Join Code
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-2xl font-mono font-extrabold tracking-widest text-white">
              {trip.code}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              title="Copy join code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Share this 6-character code with friends to join {trip.title}.
          </p>
        </div>

        <button
          onClick={handleCopyLink}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Link Copied' : 'Copy Invite Link'}</span>
        </button>
      </div>

      {/* Travelers Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-neutral-500" />
            <span>Trip Travelers ({trip.members.length})</span>
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {trip.members.map((member) => {
            const isCurrentUser = member.userId === currentUser.id;
            const isOrganizer = member.role === 'organizer' || trip.createdBy === member.userId;
            const deepLink = getPaymentDeepLink(member.paymentApp, member.payoutHandle, 20, trip.currency);

            return (
              <div
                key={member.userId}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCurrentUser
                    ? 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/20'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
                    />
                    <div>
                      <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100 block">
                        {member.name} {isCurrentUser && <span className="text-indigo-600 font-normal">(You)</span>}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-500">
                        {member.payoutHandle}
                      </span>
                    </div>
                  </div>

                  {isOrganizer ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                      <Crown className="w-2.5 h-2.5" /> Organizer
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-neutral-400">
                      Member
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                  <span className="uppercase font-bold text-neutral-400 text-[10px]">
                    {member.paymentApp}
                  </span>

                  <div className="flex items-center gap-2">
                    <a
                      href={deepLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[36px] px-3 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-semibold flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <span>Pay</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {isCurrentUser && (
                      <button
                        onClick={onOpenProfileModal}
                        className="min-h-[36px] px-2.5 py-1 rounded-lg font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-all active:scale-95"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
