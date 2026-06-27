import React from "react";
import { Package, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { Order, Ingredient, Member, AuditLog } from "../../../types";

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

interface SummaryTabProps {
  getDailySales: () => number;
  orders: Order[];
  ingredients: Ingredient[];
  members: Member[];
  auditLogs: AuditLog[];
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
  getDailySales,
  orders,
  members,
  auditLogs,
}) => (
  <div className="space-y-6">
    <header className="mb-8">
      <h2 className="text-3xl font-bold mb-2">Ringkasan Dashboard</h2>
      <p className="text-slate-400">Wawasan bisnis waktu nyata.</p>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-orange-900/30 w-12 h-12 flex items-center justify-center rounded-lg text-orange-500 font-serif font-black text-xl">
            Rp
          </div>
          <span className="text-xs text-green-500 bg-green-900/20 px-2 py-1 rounded">
            +12%
          </span>
        </div>
        <p className="text-slate-400 text-sm">Pendapatan Harian</p>
        <h3 className="text-2xl font-bold">{formatRupiah(getDailySales())}</h3>
      </div>
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-blue-900/30 p-3 rounded-lg text-blue-500">
            <Package size={24} />
          </div>
        </div>
        <p className="text-slate-400 text-sm">Total Pesanan</p>
        <h3 className="text-2xl font-bold">{orders.length}</h3>
      </div>
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-purple-900/30 p-3 rounded-lg text-purple-500">
            <Users size={24} />
          </div>
        </div>
        <p className="text-slate-400 text-sm">Total Member</p>
        <h3 className="text-2xl font-bold">{members.length}</h3>
      </div>
    </div>

    {/* Smart Alerts Section */}
    {auditLogs.filter((l) => l.severity !== "LOW").length > 0 && (
      <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl">
        <h3 className="text-red-500 font-bold flex items-center gap-2 mb-3">
          <AlertTriangle size={18} /> Peringatan Sistem (Smart Alerts)
        </h3>
        <div className="space-y-2">
          {auditLogs
            .filter((l) => l.severity !== "LOW")
            .slice(0, 3)
            .map((log) => (
              <div
                key={log.id}
                className="flex justify-between items-center text-sm bg-slate-900/50 p-2 rounded border border-slate-800"
              >
                <span className="text-slate-300">{log.details}</span>
                <span className="text-[10px] text-slate-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
        </div>
      </div>
    )}
  </div>
);
