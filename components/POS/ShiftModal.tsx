import React from 'react';
import { LogOut } from 'lucide-react';

interface ShiftModalProps {
  startCash: string;
  onStartCashChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenShift: () => void;
  onLogout: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  startCash,
  onStartCashChange,
  onOpenShift,
  onLogout,
}) => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div className="bg-slate-900 p-8 rounded-lg w-96 text-center border border-slate-700 relative">
      <button
        onClick={onLogout}
        className="absolute top-4 right-4 text-slate-500 hover:text-red-400"
        title="Keluar"
      >
        <LogOut size={20} />
      </button>
      <h2 className="text-xl font-bold mb-4 text-white">Mulai Shift</h2>
      <p className="mb-4 text-slate-400">Masukkan jumlah uang kas awal (petty cash).</p>
      <div className="relative mb-6">
        <span className="absolute left-4 top-3 text-slate-400 font-bold">Rp</span>
        <input
          type="text"
          className="w-full bg-slate-900 border border-slate-700 p-3 pl-12 rounded-xl text-white font-mono text-xl text-center focus:border-brand-500 outline-none transition-colors"
          placeholder="0"
          value={startCash}
          onChange={onStartCashChange}
        />
      </div>
      <button
        onClick={onOpenShift}
        className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-900/50"
      >
        Buka Shift
      </button>
    </div>
  </div>
);
