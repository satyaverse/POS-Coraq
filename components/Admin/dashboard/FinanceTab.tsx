// FinanceTab: JSX extracted from DashboardView renderFinance.
// All state and handlers are passed as props from DashboardView.
// financeSummary is computed in parent via useMemo.

import React from "react";
import {
  TrendingUp,
  Minus,
  Wallet,
  Activity,
  ShieldAlert,
  Image as ImageIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Expense, AuditLog } from "../../../types";

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

interface FinanceSummary {
  revenue: number;
  outflow: number;
  profit: number;
  pieData: { name: string; value: number }[];
  orderCount: number;
  expenseCount: number;
}

interface FinanceTabProps {
  financeSummary: FinanceSummary;
  financeTab: "SUMMARY" | "EXPENSES" | "AUDIT";
  setFinanceTab: (tab: "SUMMARY" | "EXPENSES" | "AUDIT") => void;
  timeFilter: "TODAY" | "WEEK" | "MONTH" | "YEAR";
  setTimeFilter: (f: "TODAY" | "WEEK" | "MONTH" | "YEAR") => void;
  expenses: Expense[];
  auditLogs: AuditLog[];
  voidPurchase: (id: string) => { success: boolean; message: string };
  setConfirmDialog: (dialog: { isOpen: boolean; message: string; onConfirm: () => void } | null) => void;
  setAlertDialog: (dialog: { isOpen: boolean; message: string; type: "success" | "error" | "info" } | null) => void;
  setIsAddingExpense: (v: boolean) => void;
  setExpenseForm: (form: { category: string; amount: number; description: string }) => void;
  setDisplayExpenseAmount: (v: string) => void;
}

export const FinanceTab: React.FC<FinanceTabProps> = ({
  financeSummary,
  financeTab,
  setFinanceTab,
  timeFilter,
  setTimeFilter,
  expenses,
  auditLogs,
  voidPurchase,
  setConfirmDialog,
  setAlertDialog,
  setIsAddingExpense,
  setExpenseForm,
  setDisplayExpenseAmount,
}) => (
  <div className="space-y-6">
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Laporan Keuangan</h2>
        <p className="text-slate-400">Pencatatan pengeluaran dan rekapitulasi.</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            setIsAddingExpense(true);
            setExpenseForm({ category: "SALARY", amount: 0, description: "" });
            setDisplayExpenseAmount("");
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <Minus size={18} /> Catat Pengeluaran
        </button>
      </div>
    </header>

    {/* Sub Tabs */}
    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
      <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 w-full sm:w-fit">
        <button
          onClick={() => setFinanceTab("SUMMARY")}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${financeTab === "SUMMARY" ? "bg-brand-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
        >
          <TrendingUp size={16} /> Ringkasan Eksekutif
        </button>
        <button
          onClick={() => setFinanceTab("EXPENSES")}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${financeTab === "EXPENSES" ? "bg-brand-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
        >
          <Minus size={16} /> Pengeluaran Operasional
        </button>
        <button
          onClick={() => setFinanceTab("AUDIT")}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${financeTab === "AUDIT" ? "bg-brand-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
        >
          <ShieldAlert size={16} /> Log Audit &amp; Keamanan
        </button>
      </div>

      {financeTab === "SUMMARY" && (
        <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 w-full sm:w-fit">
          {(["TODAY", "WEEK", "MONTH", "YEAR"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs transition-all ${timeFilter === f ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              {f === "TODAY" ? "Hari Ini" : f === "WEEK" ? "Minggu Ini" : f === "MONTH" ? "Bulan Ini" : "Tahunan"}
            </button>
          ))}
        </div>
      )}
    </div>

    <div className="w-full">
      {financeTab === "SUMMARY" ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <TrendingUp className="text-emerald-500" size={24} />
                </div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">Revenue</span>
              </div>
              <h3 className="text-slate-400 text-sm font-bold mb-1">Total Pemasukan</h3>
              <p className="text-3xl font-mono font-black text-white">{formatRupiah(financeSummary.revenue)}</p>
              <p className="text-xs text-slate-500 mt-2">{financeSummary.orderCount} Transaksi Berhasil</p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <Minus className="text-red-500" size={24} />
                </div>
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded">Expenses</span>
              </div>
              <h3 className="text-slate-400 text-sm font-bold mb-1">Total Pengeluaran</h3>
              <p className="text-3xl font-mono font-black text-white">{formatRupiah(financeSummary.outflow)}</p>
              <p className="text-xs text-slate-500 mt-2">{financeSummary.expenseCount} Catatan Pengeluaran</p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-20 ${financeSummary.profit >= 0 ? "bg-emerald-500" : "bg-red-500"}`} />
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${financeSummary.profit >= 0 ? "bg-brand-500/10" : "bg-red-500/10"}`}>
                  <Wallet className={financeSummary.profit >= 0 ? "text-brand-500" : "text-red-500"} size={24} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${financeSummary.profit >= 0 ? "bg-brand-500/10 text-brand-500" : "bg-red-500/10 text-red-500"}`}>Net Profit</span>
              </div>
              <h3 className="text-slate-400 text-sm font-bold mb-1">Laba Bersih</h3>
              <p className={`text-3xl font-mono font-black ${financeSummary.profit >= 0 ? "text-white" : "text-red-400"}`}>
                {financeSummary.profit < 0 && "-"}{formatRupiah(Math.abs(financeSummary.profit))}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${financeSummary.profit >= 0 ? "bg-emerald-500" : "bg-red-500"}`} />
                <p className="text-xs text-slate-500">{financeSummary.profit >= 0 ? "Bisnis Sehat / Surplus" : "Defisit Anggaran"}</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Activity size={20} className="text-brand-500" /> Perbandingan Cashflow
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: "Inflow", amount: financeSummary.revenue }, { name: "Outflow", amount: financeSummary.outflow }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `Rp ${v / 1000}k`} />
                    <Tooltip cursor={{ fill: "#1e293b", opacity: 0.4 }} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px" }} formatter={(v: number) => [formatRupiah(v), "Jumlah"]} />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={60}>
                      {[0, 1].map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Wallet size={20} className="text-brand-500" /> Alokasi Pengeluaran
              </h3>
              <div className="h-[300px]">
                {financeSummary.pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={financeSummary.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {financeSummary.pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={["#f97316", "#3b82f6", "#8b5cf6", "#ec4899", "#10b981"][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px" }} formatter={(v: number) => [formatRupiah(v), "Total"]} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 italic">
                    <Minus size={48} className="mb-2 opacity-20" />
                    <p>Belum ada data pengeluaran</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Real-time Balance */}
          <div className="bg-brand-900/20 border border-brand-500/30 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-brand-500 rounded-2xl shadow-lg shadow-brand-500/20">
                <Wallet className="text-white" size={32} />
              </div>
              <div>
                <h4 className="text-brand-400 font-black uppercase tracking-widest text-xs">Real-time Balance</h4>
                <p className="text-slate-300 text-sm">Estimasi saldo kas berdasarkan filter aktif</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-4xl font-mono font-black text-white tracking-tighter">{formatRupiah(financeSummary.profit)}</p>
              <p className="text-xs text-brand-400 font-bold mt-1 uppercase tracking-widest">Available Cashflow</p>
            </div>
          </div>
        </div>
      ) : financeTab === "EXPENSES" ? (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl">Daftar Pengeluaran</h3>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Pengeluaran</p>
              <p className="text-2xl font-mono text-red-500 font-bold">
                -{formatRupiah(expenses.filter((e) => !e.isVoided).reduce((sum, e) => sum + e.amount, 0))}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {expenses.length === 0 ? (
              <p className="text-slate-500 italic py-8 text-center">Belum ada data pengeluaran.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="pb-4 text-left">Tanggal</th>
                    <th className="pb-4 text-left">Kategori</th>
                    <th className="pb-4 text-left">Sumber</th>
                    <th className="pb-4 text-left">Keterangan</th>
                    <th className="pb-4 text-right">Jumlah</th>
                    <th className="pb-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {[...expenses].reverse().map((exp) => (
                    <tr key={exp.id} className={`${exp.isVoided ? "opacity-40 grayscale" : ""} hover:bg-slate-800/30 transition-colors`}>
                      <td className="py-4 text-slate-400">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${exp.category === "PURCHASE" ? "bg-blue-900/30 text-blue-400" : "bg-slate-800 text-slate-400"}`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-slate-500">{exp.source || "CASH_DRAWER"}</td>
                      <td className="py-4 text-slate-300 font-medium">
                        {exp.description}
                        {exp.transferProof && (
                          <a href={exp.transferProof} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 border border-blue-900/50 bg-blue-950/30 px-2 py-0.5 rounded cursor-pointer">
                            <ImageIcon size={10} /> Lihat Bukti Transfer
                          </a>
                        )}
                      </td>
                      <td className="py-4 text-right font-mono text-red-400 font-bold">-{formatRupiah(exp.amount)}</td>
                      <td className="py-4 text-center">
                        {exp.category === "PURCHASE" && !exp.isVoided && (
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                message: `Yakin ingin membatalkan (VOID) pengeluaran "${exp.description}"? Stok dan HPP akan dikembalikan.`,
                                onConfirm: () => {
                                  const result = voidPurchase(exp.id);
                                  setAlertDialog({ isOpen: true, message: result.message, type: result.success ? "success" : "error" });
                                },
                              });
                            }}
                            className="bg-red-900/30 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-tighter"
                          >
                            VOID
                          </button>
                        )}
                        {exp.isVoided && (
                          <span className="text-[10px] text-red-500 font-black uppercase tracking-tighter border border-red-900/50 px-2 py-1 rounded">VOIDED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl">Log Audit &amp; Keamanan</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold"><div className="w-2 h-2 rounded-full bg-red-500" />High</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold"><div className="w-2 h-2 rounded-full bg-yellow-500" />Med</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold"><div className="w-2 h-2 rounded-full bg-blue-500" />Low</span>
            </div>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {auditLogs.length === 0 ? (
              <p className="text-slate-500 italic py-8 text-center">Belum ada log audit.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className={`p-4 rounded-xl border-l-4 bg-slate-950/50 border border-slate-800/50 hover:border-slate-700 transition-colors ${log.severity === "HIGH" ? "border-l-red-500" : log.severity === "MEDIUM" ? "border-l-yellow-500" : "border-l-blue-500"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${log.severity === "HIGH" ? "text-red-500" : log.severity === "MEDIUM" ? "text-yellow-500" : "text-blue-500"}`}>
                      {log.action.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-2 leading-relaxed">{log.details}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold">{log.user.charAt(0)}</div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">User: {log.user}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);
