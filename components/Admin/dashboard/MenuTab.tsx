import React from "react";
import { Plus, Edit2, Trash2, Settings } from "lucide-react";
import { Product } from "../../../types";
import { ModifierManager } from "../ModifierManager";

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

interface MenuTabProps {
  products: Product[];
  menuTab: "PRODUCTS" | "MODIFIERS";
  setMenuTab: (tab: "PRODUCTS" | "MODIFIERS") => void;
  handleOpenProductModal: (product?: Product) => void;
  setCategoryManagerOpen: (open: boolean) => void;
  calculateProductCost: (product: Product) => number;
  setConfirmDialog: (dialog: { isOpen: boolean; message: string; onConfirm: () => void } | null) => void;
  deleteProduct: (id: string) => void;
}

export const MenuTab: React.FC<MenuTabProps> = ({
  products,
  menuTab,
  setMenuTab,
  handleOpenProductModal,
  setCategoryManagerOpen,
  calculateProductCost,
  setConfirmDialog,
  deleteProduct,
}) => (
  <div className="space-y-6">
    <header className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Manajemen Menu</h2>
        <p className="text-slate-400">Atur produk, harga, resep, dan modifier.</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setCategoryManagerOpen(true)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-bold flex items-center gap-2"
        >
          <Settings size={18} /> Kategori
        </button>
        {menuTab === "PRODUCTS" && (
          <button
            onClick={() => handleOpenProductModal()}
            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <Plus size={18} /> Produk Baru
          </button>
        )}
      </div>
    </header>

    {/* Tabs */}
    <div className="flex border-b border-slate-800 mb-6">
      <button
        onClick={() => setMenuTab("PRODUCTS")}
        className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${
          menuTab === "PRODUCTS"
            ? "border-brand-500 text-brand-500"
            : "border-transparent text-slate-500 hover:text-slate-300"
        }`}
      >
        Daftar Produk
      </button>
      <button
        onClick={() => setMenuTab("MODIFIERS")}
        className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${
          menuTab === "MODIFIERS"
            ? "border-purple-500 text-purple-500"
            : "border-transparent text-slate-500 hover:text-slate-300"
        }`}
      >
        Modifier &amp; Add-ons
      </button>
    </div>

    {menuTab === "PRODUCTS" ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-brand-500/50 transition-colors flex flex-col"
          >
            <div className="h-40 relative overflow-hidden bg-slate-800">
              <img
                src={product.image}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => handleOpenProductModal(product)}
                  className="p-2 bg-slate-900/80 text-blue-400 rounded-lg backdrop-blur-sm hover:bg-white hover:text-blue-600"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      message: `Hapus produk ${product.name}?`,
                      onConfirm: () => deleteProduct(product.id),
                    });
                  }}
                  className="p-2 bg-slate-900/80 text-red-500 rounded-lg backdrop-blur-sm hover:bg-red-600 hover:text-white"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-4 pt-12">
                <span className="bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  {product.category}
                </span>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h4 className="font-bold text-white text-lg mb-1 leading-tight">
                {product.name}
              </h4>
              <p className="text-brand-400 font-bold mb-4">
                {formatRupiah(product.price)}
              </p>

              <div className="mt-auto space-y-2 text-xs text-slate-500 border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span>HPP (Cost)</span>
                  <span className="text-slate-300">
                    {formatRupiah(calculateProductCost(product))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Margin</span>
                  <span
                    className={
                      (product.price - calculateProductCost(product)) /
                        product.price >
                      0.5
                        ? "text-green-500"
                        : "text-yellow-500"
                    }
                  >
                    {(
                      ((product.price - calculateProductCost(product)) /
                        product.price) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <ModifierManager />
    )}
  </div>
);
