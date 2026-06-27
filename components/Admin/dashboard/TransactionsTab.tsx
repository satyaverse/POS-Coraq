import React from "react";
import { Search } from "lucide-react";
import { Order } from "../../../types";

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

interface TransactionsTabProps {
  orders: Order[];
  transactionSearch: string;
  setTransactionSearch: (v: string) => void;
  transactionDateFilter: string;
  setTransactionDateFilter: (v: string) => void;
  setSelectedOrderDetails: (order: Order | null) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  orders,
  transactionSearch,
  setTransactionSearch,
  transactionDateFilter,
  setTransactionDateFilter,
  setSelectedOrderDetails,
}) => {
  const filteredOrders = orders.filter((order) => {
    const dateStr = new Date(order.createdAt).toISOString().split("T")[0];
    const matchDate = dateStr === transactionDateFilter;
    const matchSearch =
      order.id.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      (order.customerName || "")
        .toLowerCase()
        .includes(transactionSearch.toLowerCase());
    return matchDate && matchSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Riwayat Transaksi</h2>
          <p className="text-slate-400">Daftar nota penjualan dan detail pesanan.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari No. Nota / Nama..."
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white outline-none focus:border-brand-500 w-full sm:w-64"
              value={transactionSearch}
              onChange={(e) => setTransactionSearch(e.target.value)}
            />
          </div>
          <input
            type="date"
            className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-white outline-none focus:border-brand-500"
            value={transactionDateFilter}
            onChange={(e) => setTransactionDateFilter(e.target.value)}
          />
        </div>
      </header>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="p-4">No. Nota</th>
                <th className="p-4">Waktu</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Total</th>
                <th className="p-4">Metode</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-slate-500 italic"
                  >
                    Tidak ada transaksi ditemukan untuk filter ini.
                  </td>
                </tr>
              ) : (
                [...filteredOrders].reverse().map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="p-4 font-mono text-xs text-brand-400 font-bold">
                      {order.id}
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(order.createdAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-bold text-white">
                        {order.customerName || "Guest"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Pager: {order.pagerNumber}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-white">
                      {formatRupiah(order.finalAmount)}
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] px-2 py-1 bg-slate-800 rounded font-bold text-slate-400 uppercase">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-tighter ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-900/30 text-emerald-400"
                            : order.paymentStatus === "VOID"
                              ? "bg-red-900/30 text-red-400"
                              : "bg-yellow-900/30 text-yellow-400"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedOrderDetails(order)}
                        className="p-2 bg-slate-800 text-slate-400 hover:bg-brand-600 hover:text-white rounded-lg transition-all"
                      >
                        <Search size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
