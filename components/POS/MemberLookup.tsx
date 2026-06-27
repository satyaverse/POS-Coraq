import React from 'react';
import { ChevronRight, Gift, QrCode, Search, UserPlus, X } from 'lucide-react';
import { Member, MemberStatus, Tier } from '../../types';

interface MemberLookupProps {
  activeMember: Member | null;
  memberQuery: string;
  pointsToRedeem: number;
  displaySubtotal: number;
  pointValue: number;
  onMemberQueryChange: (value: string) => void;
  onMemberSearch: () => void;
  onOpenQRScanner: () => void;
  onOpenAddMember: () => void;
  onClearMember: () => void;
  onRedeemPoints: (points: number) => void;
  onClearPoints: () => void;
  onBindMemberCard: (memberId: string) => void;
}

export const MemberLookup: React.FC<MemberLookupProps> = ({
  activeMember,
  memberQuery,
  pointsToRedeem,
  displaySubtotal,
  pointValue,
  onMemberQueryChange,
  onMemberSearch,
  onOpenQRScanner,
  onOpenAddMember,
  onClearMember,
  onRedeemPoints,
  onClearPoints,
  onBindMemberCard,
}) => (
  <div className="p-4 border-b border-slate-800">
    {activeMember ? (
      <div className={`rounded-xl p-4 relative overflow-hidden shadow-lg border ${
        activeMember.tier === Tier.PLATINUM ? 'bg-gradient-to-r from-slate-800 to-purple-900 border-purple-500/50' :
        activeMember.tier === Tier.GOLD ? 'bg-gradient-to-r from-yellow-900/80 to-yellow-600/20 border-yellow-500/50' :
        activeMember.tier === Tier.SILVER ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-slate-400/50' :
        'bg-slate-800 border-slate-700'
      }`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 border-2 border-brand-500/30 shadow-inner">
              {activeMember.photo ? (
                <img src={activeMember.photo} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center font-bold text-slate-900 ${
                  activeMember.tier === Tier.PLATINUM ? 'bg-purple-400' :
                  activeMember.tier === Tier.GOLD ? 'bg-yellow-400' :
                  activeMember.tier === Tier.SILVER ? 'bg-slate-300' :
                  'bg-brand-500'
                }`}>
                  {activeMember.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-white text-lg leading-none">{activeMember.name}</div>
              <div className={`text-xs font-bold tracking-widest mt-1 ${
                activeMember.tier === Tier.PLATINUM ? 'text-purple-300' :
                activeMember.tier === Tier.GOLD ? 'text-yellow-400' :
                'text-brand-400'
              }`}>{activeMember.tier} MEMBER</div>
            </div>
          </div>
          <button onClick={onClearMember} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="flex items-center justify-between bg-black/30 rounded-lg p-2 px-3">
          <div className="flex items-center gap-2">
            <Gift size={14} className="text-pink-400" />
            <span className="text-sm font-bold text-white">{activeMember.points} Poin</span>
          </div>
          {pointsToRedeem === 0 && activeMember.points > 0 && displaySubtotal > 0 && activeMember.status === MemberStatus.ACTIVE && (
            <button
              onClick={() => onRedeemPoints(Math.min(activeMember.points, Math.floor(displaySubtotal / pointValue)))}
              className="text-xs bg-pink-600 hover:bg-pink-700 px-2 py-1 rounded text-white transition-colors"
            >
              Tukar
            </button>
          )}
          {pointsToRedeem > 0 && (
            <button onClick={onClearPoints} className="text-xs text-red-300 hover:text-white">Batal</button>
          )}
        </div>

        {activeMember.status !== MemberStatus.ACTIVE && (
          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex flex-col gap-2 relative z-20">
            <div className="text-red-400 text-xs font-bold opacity-80 text-center">Kartu belum terhubung</div>
            <button
              onClick={() => onBindMemberCard(activeMember.id)}
              className="w-full bg-red-500/20 hover:bg-red-500/40 text-red-300 text-xs py-2 rounded-md font-black uppercase tracking-wider transition-colors border border-red-500/30"
            >
              Bind Kartu Sekarang
            </button>
          </div>
        )}
      </div>
    ) : (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
          <input
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-brand-500 outline-none transition-colors"
            placeholder="Cari Member / No HP"
            value={memberQuery}
            onChange={event => onMemberQueryChange(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && onMemberSearch()}
          />
        </div>
        <button
          onClick={onOpenQRScanner}
          className="bg-slate-800 hover:bg-slate-700 text-brand-400 p-3 rounded-xl border border-slate-700"
          title="Scan QR Member"
        >
          <QrCode size={20} />
        </button>
        <button onClick={onMemberSearch} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl border border-slate-700">
          <ChevronRight size={20} />
        </button>
        <button onClick={onOpenAddMember} className="bg-brand-600 hover:bg-brand-500 text-white p-3 rounded-xl shadow-lg shadow-brand-900/50">
          <UserPlus size={20} />
        </button>
      </div>
    )}
  </div>
);
