import React from 'react';
import { AlertTriangle, Coffee, Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem, Member, Order } from '../../types';
import { MemberLookup } from './MemberLookup';

interface CartPanelProps {
  activeMember: Member | null;
  memberQuery: string;
  cart: CartItem[];
  pointsToRedeem: number;
  displaySubtotal: number;
  displayPromoDiscount: number;
  displayTierDiscount: number;
  displayPointDiscount: number;
  displayTotal: number;
  pagerNumber: string;
  pagerConflict: Order | null;
  pagerErrorShake: boolean;
  pointValue: number;
  formatRupiah: (value: number) => string;
  onMemberQueryChange: (value: string) => void;
  onMemberSearch: () => void;
  onOpenQRScanner: () => void;
  onOpenAddMember: () => void;
  onClearMember: () => void;
  onRedeemPoints: (points: number) => void;
  onClearPoints: () => void;
  onBindMemberCard: (memberId: string) => void;
  onUpdateCartQuantity: (tempId: string, delta: number) => void;
  onRemoveFromCart: (tempId: string) => void;
  onPagerNumberChange: (value: string) => void;
  onHoldBillClick: () => void;
  onPayClick: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  activeMember,
  memberQuery,
  cart,
  pointsToRedeem,
  displaySubtotal,
  displayPromoDiscount,
  displayTierDiscount,
  displayPointDiscount,
  displayTotal,
  pagerNumber,
  pagerConflict,
  pagerErrorShake,
  pointValue,
  formatRupiah,
  onMemberQueryChange,
  onMemberSearch,
  onOpenQRScanner,
  onOpenAddMember,
  onClearMember,
  onRedeemPoints,
  onClearPoints,
  onBindMemberCard,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onPagerNumberChange,
  onHoldBillClick,
  onPayClick,
}) => (
  <div className="w-[400px] bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-20">
    <MemberLookup
      activeMember={activeMember}
      memberQuery={memberQuery}
      pointsToRedeem={pointsToRedeem}
      displaySubtotal={displaySubtotal}
      pointValue={pointValue}
      onMemberQueryChange={onMemberQueryChange}
      onMemberSearch={onMemberSearch}
      onOpenQRScanner={onOpenQRScanner}
      onOpenAddMember={onOpenAddMember}
      onClearMember={onClearMember}
      onRedeemPoints={onRedeemPoints}
      onClearPoints={onClearPoints}
      onBindMemberCard={onBindMemberCard}
    />

    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {cart.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-600">
          <Coffee size={64} className="mb-4 opacity-20" />
          <p>Keranjang masih kosong.</p>
        </div>
      ) : (
        cart.map(item => (
          <div key={item.tempId} className="bg-slate-800/50 border border-slate-800 p-3 rounded-xl flex gap-3 group hover:border-brand-500/30 transition-colors">
            <img src={item.product.image} className="w-14 h-14 rounded-lg object-cover bg-slate-700" />
            <div className="flex-1 min-w-0">
              <div className="mb-1">
                <h4 className="font-bold text-slate-200 leading-tight">{item.product.name}</h4>
              </div>
              <div className="text-xs text-slate-400 mb-2">
                {item.modifiers.map(modifier => (
                  <span key={modifier.id} className="inline-block mr-1">â€¢ {modifier.name}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => item.quantity > 1 ? onUpdateCartQuantity(item.tempId, -1) : onRemoveFromCart(item.tempId)}
                    className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white text-xs"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-bold text-white text-sm w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateCartQuantity(item.tempId, 1)}
                    className="w-8 h-8 rounded bg-slate-700 hover:bg-brand-600 flex items-center justify-center text-white text-xs"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="font-mono text-white font-bold">
                  {formatRupiah((item.product.price + item.modifiers.reduce((sum, modifier) => sum + modifier.price, 0)) * item.quantity)}
                </span>
              </div>
            </div>
            <button onClick={() => onRemoveFromCart(item.tempId)} className="self-center text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={18} />
            </button>
          </div>
        ))
      )}
    </div>

    <div className="bg-slate-900 border-t border-slate-800 p-6 space-y-4 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-30">
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{formatRupiah(displaySubtotal)}</span></div>
        {displayPromoDiscount > 0 && (
          <div className="flex justify-between text-blue-400"><span>Promo</span><span>-{formatRupiah(displayPromoDiscount)}</span></div>
        )}
        {displayTierDiscount > 0 && <div className="flex justify-between text-yellow-500"><span>Tier Diskon</span><span>-{formatRupiah(displayTierDiscount)}</span></div>}
        {displayPointDiscount > 0 && <div className="flex justify-between text-pink-400"><span>Poin</span><span>-{formatRupiah(displayPointDiscount)}</span></div>}
        <div className="flex justify-between text-white text-2xl font-bold pt-2 border-t border-slate-800 mt-2">
          <span>Total</span>
          <span>{formatRupiah(displayTotal)}</span>
        </div>
      </div>

      <div className="relative">
        <label className="absolute -top-2.5 left-3 bg-slate-900 px-1 text-xs text-brand-500 font-bold uppercase tracking-wider">No. Pager</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="00"
          className={`w-full bg-slate-950 border-2 rounded-xl text-center text-3xl font-bold text-white py-3 outline-none transition-all placeholder-slate-700 ${
            pagerErrorShake ? 'border-red-500 animate-shake' :
            pagerConflict ? 'border-red-500 bg-red-950/20' : 'border-slate-800 focus:border-brand-500'
          }`}
          value={pagerNumber}
          onChange={event => onPagerNumberChange(event.target.value.replace(/\D/g, ''))}
        />

        {pagerConflict && (
          <div className="absolute top-full mt-2 w-full bg-red-900/90 text-white p-3 rounded-lg text-sm font-bold flex items-center gap-2 animate-pulse z-10">
            <AlertTriangle size={18} className="shrink-0" />
            <div className="leading-tight">
              Pager #{pagerNumber} dipakai oleh <span className="text-yellow-300">{pagerConflict.customerName}</span> ({pagerConflict.status})
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onHoldBillClick}
          disabled={cart.length === 0 || !!pagerConflict}
          className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 font-bold text-lg py-4 rounded-xl transition-all border border-slate-700"
        >
          SIMPAN TAGIHAN
        </button>

        <button
          onClick={onPayClick}
          disabled={cart.length === 0 || !!pagerConflict}
          className="flex-[2] bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-xl py-4 rounded-xl shadow-lg shadow-brand-900/50 transition-all transform active:scale-[0.98]"
        >
          BAYAR
        </button>
      </div>
    </div>
  </div>
);
