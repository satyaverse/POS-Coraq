import React from "react";
import { Plus, Edit2, ClipboardCheck, Layers, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";
import { Ingredient } from "../../../types";

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

interface InventoryTabProps {
  ingredients: Ingredient[];
  openIngredientModal: (ing?: Ingredient) => void;
  openOpnameModal: (ing: Ingredient) => void;
  setProductionItem: (ing: Ingredient) => void;
  setProductionQty: (qty: number) => void;
  setProductionModalOpen: (open: boolean) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  ingredients,
  openIngredientModal,
  openOpnameModal,
  setProductionItem,
  setProductionQty,
  setProductionModalOpen,
}) => (
  <div className="space-y-6">
    <header className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Inventory Bahan</h2>
        <p className="text-slate-400">Manajemen stok bahan baku dan HPP.</p>
      </div>
      <button
        onClick={() => openIngredientModal()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
      >
        <Plus size={18} /> Bahan Baru
      </button>
    </header>

    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-bold">
          <tr>
            <th className="p-4">Nama Bahan</th>
            <th className="p-4">Stok</th>
            <th className="p-4">Satuan</th>
            <th className="p-4">Konversi Beli</th>
            <th className="p-4">HPP &amp; Harga Beli Terakhir</th>
            <th className="p-4">Value</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {ingredients.map((ing) => (
            <tr key={ing.id} className="hover:bg-slate-800/50">
              <td className="p-4 font-bold text-white mb-2">
                {ing.name}
                {ing.isSemiFinished && (
                  <span className="block mt-1 w-max px-2 py-0.5 bg-indigo-900/30 text-indigo-400 text-[10px] rounded uppercase border border-indigo-800">
                    Bahan Setengah Jadi
                  </span>
                )}
              </td>
              <td
                className={`p-4 font-mono font-bold ${
                  ing.stock < (ing.minStockLevel || 10)
                    ? "text-red-500"
                    : "text-green-400"
                }`}
              >
                {ing.stock}
              </td>
              <td className="p-4 text-slate-400">{ing.unit}</td>
              <td className="p-4 text-slate-400 text-xs">
                <div>
                  <span className="block text-white">
                    1 {ing.buyUnit || "Pcs"}
                  </span>
                  <span className="block opacity-60">
                    = {ing.conversionRate || 1} {ing.unit}
                  </span>
                </div>
              </td>
              <td className="p-4">
                <div className="text-slate-300 font-bold">
                  {formatRupiah(ing.costPerUnit)}{" "}
                  <span className="text-[10px] font-normal text-slate-500">
                    / {ing.unit} (HPP)
                  </span>
                </div>
                {ing.priceHistory && ing.priceHistory.length > 0 && (
                  <div className="text-emerald-400 text-xs mt-1">
                    {formatRupiah(
                      ing.priceHistory[ing.priceHistory.length - 1].price,
                    )}{" "}
                    <span className="text-[10px] text-emerald-500/70">
                      / {ing.unit} (Nota Terakhir)
                    </span>
                  </div>
                )}
              </td>
              <td className="p-4 font-mono text-slate-300">
                {formatRupiah(ing.stock * ing.costPerUnit)}
              </td>
              <td className="p-4 flex gap-2">
                <>
                  {ing.isSemiFinished && (
                    <button
                      onClick={() => {
                        setProductionItem(ing);
                        setProductionQty(1);
                        setProductionModalOpen(true);
                      }}
                      className="p-2 bg-indigo-900/30 text-indigo-400 rounded hover:bg-indigo-900/50"
                      title="Produksi Batch"
                    >
                      <Layers size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => openOpnameModal(ing)}
                    className="p-2 bg-orange-900/30 text-orange-500 rounded hover:bg-orange-900/50"
                    title="Stock Opname"
                  >
                    <ClipboardCheck size={16} />
                  </button>
                  <button
                    onClick={() => openIngredientModal(ing)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded"
                  >
                    <Edit2 size={16} />
                  </button>
                </>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Price Intelligence Section */}
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
      <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
        <TrendingUp size={20} /> Price Intelligence (Tren Harga Bahan)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ingredients
          .filter((ing) => ing.priceHistory && ing.priceHistory.length > 1)
          .map((ing) => (
            <div
              key={ing.id}
              className="bg-slate-950 p-4 rounded-lg border border-slate-800 h-[200px]"
            >
              <h4 className="text-sm font-bold text-slate-400 mb-2">
                {ing.name}
              </h4>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={ing.priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      color: "white",
                    }}
                    formatter={(value: number) => [formatRupiah(value), "Harga"]}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString()
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        {ingredients.filter(
          (ing) => ing.priceHistory && ing.priceHistory.length > 1,
        ).length === 0 && (
          <p className="text-slate-500 italic text-sm col-span-full">
            Belum ada cukup data riwayat harga untuk menampilkan tren.
          </p>
        )}
      </div>
    </div>
  </div>
);
