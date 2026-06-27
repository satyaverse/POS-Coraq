import React from 'react';
import { Product } from '../../types';

interface ProductGridProps {
  products: Product[];
  selectedCategory: string;
  menuSearch: string;
  formatRupiah: (value: number) => string;
  onProductClick: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  selectedCategory,
  menuSearch,
  formatRupiah,
  onProductClick,
}) => (
  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
    {products
      .filter(product => selectedCategory === 'ALL' || product.category === selectedCategory)
      .filter(product => !menuSearch || product.name.toLowerCase().includes(menuSearch.toLowerCase()))
      .map(product => (
        <div
          key={product.id}
          onClick={() => onProductClick(product)}
          className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-brand-500 hover:shadow-xl hover:shadow-brand-900/20 transition-all group relative"
        >
          <div className="h-36 relative overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-2 left-3 font-bold text-white text-lg drop-shadow-md">
              {formatRupiah(product.price)}
            </div>
            {product.staffCommission && product.staffCommission > 0 && (
              <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                BONUS
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-bold text-slate-200 leading-tight mb-1 group-hover:text-brand-400 transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-green-500"></div> Tersedia
            </div>
          </div>
        </div>
      ))}
  </div>
);
