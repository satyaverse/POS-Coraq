import React from "react";
import { Clock, Activity, AlertTriangle, RefreshCcw } from "lucide-react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
  PieChart,
  Pie,
} from "recharts";
import { Order } from "../../../types";

interface HeatmapData {
  days: string[];
  grid: number[][];
}

interface BcgDataPoint {
  name: string;
  x: number;
  y: number;
  classification: string;
}

interface AnalyticsTabProps {
  orders: Order[];
  categories: string[];
  heatmapData: HeatmapData;
  bcgData: BcgDataPoint[];
  handleGenerateAiForecast: () => void;
  isForecastingAi: boolean;
  aiForecastResult: any | null;
  aiForecastSources: any[];
  aiForecastError: string | null;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  orders,
  categories,
  heatmapData,
  bcgData,
  handleGenerateAiForecast,
  isForecastingAi,
  aiForecastResult,
  aiForecastSources,
  aiForecastError,
}) => (
  <div className="space-y-6">
    <header className="mb-8">
      <h2 className="text-3xl font-bold mb-2">Analisis Bisnis</h2>
      <p className="text-slate-400">Grafik penjualan, produk terlaris, dan jam sibuk.</p>
    </header>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Heatmap */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 col-span-1 lg:col-span-2">
        <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
          <Clock size={20} /> Waktu Teramai (Heatmap)
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[50px_repeat(15,_1fr)] gap-1">
              <div className="col-start-1" />
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="text-center text-xs text-slate-500">
                  {i + 8}:00
                </div>
              ))}
              {heatmapData.days.map((day, dIdx) => (
                <React.Fragment key={day}>
                  <div className="text-xs font-bold text-slate-400 flex items-center">{day}</div>
                  {heatmapData.grid[dIdx].map((val, hIdx) => (
                    <div
                      key={hIdx}
                      className={`h-8 rounded-sm transition-all hover:scale-110 ${
                        val === 0 ? "bg-slate-800/50" : val < 5 ? "bg-brand-900/40" : val < 10 ? "bg-brand-700/60" : "bg-brand-500"
                      }`}
                      title={`${day} ${hIdx + 8}:00 - ${val} Order`}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BCG Matrix */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-[400px]">
        <h3 className="font-bold text-xl mb-4">Menu Matrix (BCG Analysis)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" dataKey="x" name="Volume" unit=" pcs" stroke="#94a3b8" label={{ value: "Sales Volume", position: "bottom", fill: "#94a3b8" }} />
            <YAxis type="number" dataKey="y" name="Margin" unit="%" stroke="#94a3b8" label={{ value: "Profit Margin", angle: -90, position: "left", fill: "#94a3b8" }} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "white" }} />
            <Legend />
            <Scatter name="Products" data={bcgData} fill="#8884d8">
              {bcgData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.classification === "STAR" ? "#22c55e" :
                    entry.classification === "CASH COW" ? "#eab308" :
                    entry.classification === "QUESTION" ? "#3b82f6" : "#ef4444"
                  }
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Category Sales Pie */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-[400px]">
        <h3 className="font-bold text-xl mb-4">Penjualan per Kategori</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories.map((cat) => ({ name: cat, value: orders.reduce((acc, o) => acc + o.items.filter((i) => i.product.category === cat).reduce((sum, i) => sum + i.quantity, 0), 0) })).filter((d) => d.value > 0)}
              cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {categories.map((_, index) => (
                <Cell key={`cell-${index}`} fill={["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#ec4899"][index % 5]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "white" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* AI Business Co-Pilot Forecasting Panel */}
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden mt-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-600/10 to-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-850">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-full text-xs font-black bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm">AI FORECAST</span>
            <h3 className="font-extrabold text-2xl text-white tracking-tight">Coraq AI Business Co-Pilot 🧠</h3>
          </div>
          <p className="text-slate-400 text-sm">Proyeksikan pertumbuhan omset, pantau SWOT, dan susun milestone langkah strategis.</p>
        </div>
        <button
          onClick={handleGenerateAiForecast}
          disabled={isForecastingAi}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 transition-all hover:opacity-90 text-white px-6 py-3 rounded-xl font-extrabold flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-indigo-950/40 disabled:opacity-50 disabled:pointer-events-none text-sm shrink-0"
        >
          {isForecastingAi ? (
            <><RefreshCcw size={16} className="animate-spin" /> Mengevaluasi Kinerja...</>
          ) : (
            <><Activity size={16} /> Jalankan Proyeksi &amp; Analisis Strategis ⚡</>
          )}
        </button>
      </div>

      {aiForecastError && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-900/30 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
          <div className="space-y-1 text-left">
            <h5 className="font-extrabold text-red-500 text-sm">Gagal Melakukan Ramalan Bisnis AI</h5>
            <p className="text-xs text-slate-400 leading-relaxed">{aiForecastError}</p>
          </div>
        </div>
      )}

      {isForecastingAi ? (
        <div className="flex flex-col justify-center items-center py-16 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-sm text-indigo-400 font-black animate-pulse">Coraq</div>
          </div>
          <div className="text-center space-y-1.5 max-w-md">
            <h5 className="font-extrabold text-white text-base">CFO AI sedang memproses proyeksi finansial...</h5>
            <p className="text-xs text-slate-400 leading-relaxed italic">"Mengambil data penjualan real-time, menganalisis struktur HPP, mencocokkan tren FnB viral global di Google, dan merancang milestone eksekusi omset besar..."</p>
          </div>
        </div>
      ) : aiForecastResult ? (
        <div className="space-y-8 animate-fade-in text-left">
          {/* SWOT */}
          <div className="space-y-3">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full" /> Matriks SWOT Analitis Coraq Coffee
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "💪 Strengths (Kekuatan)", items: aiForecastResult.swotAnalysis?.strengths, color: "emerald" },
                { label: "⚠️ Weaknesses (Kelemahan)", items: aiForecastResult.swotAnalysis?.weaknesses, color: "amber" },
                { label: "🚀 Opportunities (Peluang)", items: aiForecastResult.swotAnalysis?.opportunities, color: "blue" },
                { label: "☠️ Threats (Ancaman)", items: aiForecastResult.swotAnalysis?.threats, color: "rose" },
              ].map(({ label, items, color }) => (
                <div key={label} className={`bg-${color}-950/20 border border-${color}-950/40 p-4 rounded-2xl space-y-2 text-left`}>
                  <div className={`flex items-center gap-2 text-${color}-400 font-black text-xs uppercase tracking-widest`}><span>{label}</span></div>
                  <ul className="space-y-1.5 text-left">
                    {items?.map((item: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-1.5 justify-start">
                        <span className={`text-${color}-500 mt-0.5 shrink-0`}>•</span><span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* 3-Month Forecast */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-4">
              <h4 className="text-base font-extrabold text-white flex items-center gap-2">📊 Proyeksi Kuantitatif &amp; Target Omset 3 Bulan Kedepan</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Bulan ke-1", data: aiForecastResult.growthForecast?.month1Forecast, color: "indigo" },
                  { label: "Bulan ke-2 (Eskalasi)", data: aiForecastResult.growthForecast?.month2Forecast, color: "purple" },
                  { label: "Bulan ke-3 (Puncak)", data: aiForecastResult.growthForecast?.month3Forecast, color: "emerald" },
                ].map(({ label, data, color }) => (
                  <div key={label} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1 text-left">
                    <span className={`text-[10px] uppercase font-black text-${color}-400 tracking-wider`}>{label}</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{data}</p>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-850 space-y-1.5 text-left">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Analisis Tren Pertumbuhan:</span>
                <p className="text-xs text-slate-400 leading-relaxed italic">{aiForecastResult.growthForecast?.summaryTrend}</p>
              </div>
            </div>
            <div className="lg:col-span-4 bg-gradient-to-br from-indigo-950/20 to-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="p-1 px-2.5 rounded-full text-[9px] font-black bg-indigo-900/40 text-indigo-300 border border-indigo-500/20 uppercase tracking-widest inline-block">FINANCIAL ADVISORY</span>
                <h4 className="text-base font-extrabold text-white flex items-center gap-1.5">🪙 Optimalisasi HPP &amp; Resep</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{aiForecastResult.financialOptimization}</p>
              </div>
              <div className="pt-2 text-[10px] text-slate-500 italic border-t border-slate-850 leading-tight">"Menekan HPP (BOM) hingga 25%-33% dari harga jual merupakan golden rule kedai kopi sukses."</div>
            </div>
          </div>

          {/* Strategic Milestones */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full" /> Roadmap Aksi Strategis (Langkah Sukses Naik Omset)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiForecastResult.strategicMilestones?.map((milestone: any, idx: number) => (
                <div key={idx} className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 hover:border-slate-750 transition-all space-y-2 relative group text-left flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center bg-indigo-900/50 text-indigo-300 text-xs font-black">{idx + 1}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${milestone.impactScale === "HIGH" ? "bg-rose-950 text-rose-400 border border-rose-900/30" : "bg-slate-800 text-slate-400"}`}>
                        IMPACT: {milestone.impactScale}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-white pr-1">{milestone.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed text-wrap pr-1 mt-1.5">{milestone.description}</p>
                  </div>
                  <div className="pt-2 mt-3 border-t border-slate-900 text-xs flex justify-between items-center bg-slate-950">
                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Potensi:</span>
                    <span className="text-emerald-400 font-extrabold font-mono text-xs">{milestone.estimatedRevenueBoost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {aiForecastSources.length > 0 && (
            <div className="pt-4 border-t border-slate-850 space-y-2 text-left">
              <span className="text-[10px] tracking-wider uppercase font-black text-slate-500">Sumber Referensi &amp; Data Grounding Trend:</span>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {aiForecastSources.map((src, idx) => (
                  <a key={idx} href={src.uri} target="_blank" referrerPolicy="no-referrer" className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 truncate max-w-xs">
                    🔗 {src.title || src.uri}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <p className="text-xs text-slate-400 leading-relaxed">Seluruh proyeksi AI di atas dihasilkan secara dinamis menggunakan parameter real-time kedai kopi Anda. Terapkan strategi di atas secara bertahap bersama tim baristawati dan kasir untuk pertumbuhan omzet maksimal.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center text-slate-400 text-2xl animate-pulse">💡</div>
          <div className="max-w-md space-y-2">
            <h5 className="font-extrabold text-white text-base">Belum Ada Proyeksi Bisnis Aktif</h5>
            <p className="text-xs text-slate-400 leading-relaxed">Tekan tombol <b>"Jalankan Proyeksi &amp; Analisis Strategis"</b> di atas untuk meluncurkan analisis finansial taktis.</p>
          </div>
        </div>
      )}
    </div>
  </div>
);
