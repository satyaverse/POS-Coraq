import React from 'react';
import { ArrowRight, Image as ImageIcon, Search, ShoppingBag, Upload, X } from 'lucide-react';
import { compressImage } from '../../utils/imageCompression';

export const PurchaseModal: React.FC<any> = ({
  isOpen,
  setPurchaseModalOpen,
  selectedIngredient,
  purchaseTab,
  setPurchaseTab,
  shiftPurchases,
  purchaseSearch,
  setPurchaseSearch,
  ingredients,
  handleSelectIngredientForPurchase,
  formatRupiah,
  setPurchaseVoidModal,
  setSelectedIngredient,
  purchaseForm,
  setPurchaseForm,
  handlePriceInputChange,
  addThousand,
  angkaKeTerbilang,
  handlePurchaseSubmit,
}) => {
  if (!isOpen) return null;

  return (
         <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2"><ShoppingBag size={24} className="text-emerald-500"/> Belanja Stok Bahan</h3>
                  <button onClick={() => setPurchaseModalOpen(false)}><X className="text-slate-400 hover:text-white"/></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6">
                  {/* Step 1: Search Ingredient / Shift Purchase History */}
                  {!selectedIngredient ? (
                     <div className="space-y-6">
                        {/* Tab selection */}
                        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-805">
                           <button 
                             type="button"
                             onClick={() => setPurchaseTab('NEW')}
                             className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold uppercase transition-all ${purchaseTab === 'NEW' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-505 hover:text-slate-300'}`}
                           >
                             Belanja Baru
                           </button>
                           <button 
                             type="button"
                             onClick={() => setPurchaseTab('HISTORY')}
                             className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold uppercase transition-all ${purchaseTab === 'HISTORY' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-505 hover:text-slate-300'}`}
                           >
                             Riwayat Belanja ({shiftPurchases.length})
                           </button>
                        </div>

                        {purchaseTab === 'NEW' ? (
                           <div className="space-y-4">
                              <div className="relative">
                                 <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                                 <input 
                                    className="w-full bg-slate-950 border border-slate-800 p-3 pl-10 rounded-xl text-white focus:border-emerald-500 outline-none"
                                    placeholder="Cari bahan yang dibeli..."
                                    value={purchaseSearch}
                                    onChange={e => setPurchaseSearch(e.target.value)}
                                    autoFocus
                                 />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                 {ingredients.filter(i => i.name.toLowerCase().includes(purchaseSearch.toLowerCase())).map(ing => (
                                    <div key={ing.id} onClick={() => handleSelectIngredientForPurchase(ing)} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-emerald-500 cursor-pointer transition-colors group">
                                       <h4 className="font-bold text-white group-hover:text-emerald-400">{ing.name}</h4>
                                       <div className="flex justify-between mt-2 text-sm text-slate-400">
                                          <span>Stok: {ing.stock} {ing.unit}</span>
                                          <span>Satuan Beli: {ing.buyUnit || 'Pcs'}</span>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        ) : (
                           <div className="space-y-4">
                              {shiftPurchases.length === 0 ? (
                                 <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/45 text-slate-500">
                                    <ShoppingBag size={48} className="mx-auto mb-3 opacity-30 text-emerald-500 animate-pulse" />
                                    <p className="font-bold text-slate-400 mb-1">Belum Ada Belanja</p>
                                    <p className="text-xs max-w-xs mx-auto">Semua pengeluaran belanja bahan selama shift ini akan tercatat di sini untuk memudahkan pencocokan kas saat closing.</p>
                                 </div>
                              ) : (
                                 <div className="space-y-3">
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex justify-between">
                                       <span>Daftar Belanja Bahan</span>
                                       <span className="text-emerald-400 font-mono font-bold">Total: {formatRupiah(shiftPurchases.filter(p => !p.isVoided).reduce((sum, p) => sum + p.amount, 0))}</span>
                                    </div>
                                    <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
                                       {shiftPurchases.map(purchase => (
                                          <div key={purchase.id} className={`p-4 rounded-xl border transition-all ${purchase.isVoided ? 'bg-slate-950/40 border-slate-900 opacity-60' : 'bg-slate-800 border-slate-700'}`}>
                                             <div className="flex justify-between items-start gap-4">
                                                <div>
                                                   <div className="flex items-center gap-2">
                                                      <h4 className={`font-bold ${purchase.isVoided ? 'line-through text-slate-500' : 'text-white'}`}>{purchase.description}</h4>
                                                      {purchase.isVoided && <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-red-950/50 text-red-500 rounded border border-red-900/30">VOID</span>}
                                                   </div>
                                                   <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-400">
                                                      <span>Sumber: <span className={purchase.source === 'CASH_DRAWER' ? 'text-amber-500 font-bold font-mono' : 'text-blue-450 font-bold font-mono'}>{purchase.source === 'CASH_DRAWER' ? 'Laci Kasir (Tunai)' : 'Transfer / Rekening'}</span></span>
                                                      <span>Waktu: {new Date(purchase.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                   </div>
                                                   {purchase.transferProof && (
                                                      <div className="mt-2">
                                                         <a href={purchase.transferProof} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 border border-blue-900/50 bg-blue-950/30 px-2.5 py-1 rounded cursor-pointer">
                                                            <ImageIcon size={12} /> Lihat Bukti Transfer
                                                         </a>
                                                      </div>
                                                   )}
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-2">
                                                   <span className={`font-mono font-bold ${purchase.isVoided ? 'text-slate-500 line-through' : 'text-red-400'}`}>-{formatRupiah(purchase.amount)}</span>
                                                   {!purchase.isVoided && (
                                                      <button
                                                         type="button"
                                                         onClick={() => setPurchaseVoidModal({ isOpen: true, expenseId: purchase.id })}
                                                         className="text-[10px] px-2 py-1 bg-red-950/30 text-red-500 border border-red-900/50 hover:bg-red-900/20 hover:text-red-400 rounded transition-all font-bold uppercase"
                                                      >
                                                         Batal (Void)
                                                      </button>
                                                   )}
                                                </div>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              )}
                           </div>
                        )}
                     </div>
                  ) : (
                     /* Step 2: Input Purchase Details */
                     <div className="space-y-6">
                        <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                           <div>
                              <span className="text-xs text-slate-500 font-bold uppercase">Nama Bahan</span>
                              <h3 className="text-xl font-bold text-white">{selectedIngredient.name}</h3>
                              <p className="text-xs text-slate-400 mt-1">Stok Saat Ini: {selectedIngredient.stock} {selectedIngredient.unit}</p>
                           </div>
                           <button onClick={() => setSelectedIngredient(null)} className="text-sm text-emerald-400 hover:underline">Ganti Bahan</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="block text-xs text-slate-500 mb-1 font-bold uppercase">Jumlah Beli</label>
                               <div className="flex items-center gap-2">
                                  <input 
                                    type="number" 
                                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white font-mono text-xl" 
                                    value={purchaseForm.buyQty}
                                    onChange={e => setPurchaseForm({...purchaseForm, buyQty: Number(e.target.value)})}
                                  />
                                  <span className="text-white font-bold">{purchaseForm.buyUnit}</span>
                               </div>
                            </div>
                            <div>
                               <label className="block text-xs text-slate-500 mb-1 font-bold uppercase">Konversi ({selectedIngredient.unit})</label>
                               <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-400">1 {purchaseForm.buyUnit} = </span>
                                  <input 
                                    type="number" 
                                    className="w-20 bg-slate-800 border border-slate-700 p-2 rounded text-white text-center" 
                                    value={purchaseForm.conversionRate}
                                    onChange={e => setPurchaseForm({...purchaseForm, conversionRate: Number(e.target.value)})}
                                  />
                                  <span className="text-sm text-slate-400">{selectedIngredient.unit}</span>
                               </div>
                            </div>
                        </div>

                        {/* Conversion Preview */}
                        <div className="bg-emerald-900/10 p-4 rounded-xl border border-emerald-900/30 flex items-center gap-4">
                           <div className="bg-emerald-900/20 p-2 rounded-full text-emerald-500"><ArrowRight size={20}/></div>
                           <div>
                              <span className="text-xs text-emerald-400 uppercase font-bold">Akan Menambah Stok</span>
                              <div className="text-xl font-bold text-white">
                                 +{purchaseForm.buyQty * purchaseForm.conversionRate} <span className="text-sm font-normal text-slate-400">{selectedIngredient.unit}</span>
                              </div>
                           </div>
                        </div>

                        <div className="border-t border-slate-800 pt-4">
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-xs text-slate-500 font-bold uppercase">Total Harga Beli (Rp)</label>
                                {selectedIngredient && (
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700 block mb-1">
                                            Harga Nota Terakhir: <span className="text-white font-mono">{formatRupiah((selectedIngredient.priceHistory && selectedIngredient.priceHistory.length > 0 ? selectedIngredient.priceHistory[selectedIngredient.priceHistory.length - 1].price : selectedIngredient.costPerUnit) * purchaseForm.conversionRate)}</span> / {purchaseForm.buyUnit}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-4 text-slate-500 font-bold text-lg">Rp</span>
                                <input 
                                   type="text" 
                                   className="w-full bg-slate-950 border border-slate-700 p-4 pl-12 pr-20 rounded-xl text-white font-mono text-2xl font-bold focus:border-emerald-500 outline-none" 
                                   placeholder="0"
                                   value={purchaseForm.totalPrice}
                                   onChange={handlePriceInputChange}
                                />
                                <button 
                                    onClick={addThousand}
                                    className="absolute right-3 top-3 bottom-3 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-lg border border-slate-700 transition-colors"
                                    title="Tambah 000"
                                >
                                    +000
                                </button>
                            </div>
                            {purchaseForm.totalPrice && (
                                <p className="mt-2 text-[10px] text-emerald-500 font-medium italic">
                                    "{angkaKeTerbilang(Number(String(purchaseForm.totalPrice).replace(/\D/g, '')))} Rupiah"
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs text-slate-500 mb-2 font-bold uppercase">Sumber Dana</label>
                            <div className="flex gap-4">
                               <button 
                                  onClick={() => setPurchaseForm({...purchaseForm, paymentSource: 'CASH_DRAWER', transferProof: null})}
                                  className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                                     purchaseForm.paymentSource === 'CASH_DRAWER' 
                                     ? 'bg-orange-600/20 border-orange-600 text-orange-500' 
                                     : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                  }`}
                               >
                                  <span className="font-bold text-sm">Laci Kasir (Tunai)</span>
                                  <span className="text-[10px] opacity-70">Mengurangi Setoran Akhir</span>
                               </button>
                               <button 
                                  onClick={() => setPurchaseForm({...purchaseForm, paymentSource: 'TRANSFER'})}
                                  className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                                     purchaseForm.paymentSource === 'TRANSFER' 
                                     ? 'bg-blue-600/20 border-blue-600 text-blue-500' 
                                     : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                  }`}
                               >
                                  <span className="font-bold text-sm">Transfer / Rekening</span>
                                  <span className="text-[10px] opacity-70">Hanya Catat Pengeluaran</span>
                               </button>
                            </div>
                            
                            {purchaseForm.paymentSource === 'TRANSFER' && (
                               <div className="mt-4 p-4 border border-dashed border-blue-600/50 bg-blue-950/20 rounded-xl">
                                  <label className="block text-xs text-blue-400 mb-2 font-bold uppercase">Bukti Transfer (Wajib)</label>
                                  <div className="flex items-center gap-4">
                                     {purchaseForm.transferProof ? (
                                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-700">
                                           <img src={purchaseForm.transferProof} className="w-full h-full object-cover" alt="Bukti Transfer" />
                                           <button 
                                              onClick={() => setPurchaseForm({...purchaseForm, transferProof: null})}
                                              className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 hover:bg-red-500"
                                           >
                                              <X size={12} />
                                           </button>
                                        </div>
                                     ) : (
                                        <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-lg hover:border-blue-500 hover:bg-blue-900/20 cursor-pointer text-slate-400 transition-colors">
                                            <Upload size={24} className="mb-2" />
                                            <span className="text-[10px] font-bold">Upload Foto</span>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={async (e) => {
                                                   const file = e.target.files?.[0];
                                                   if (file) {
                                                       try {
                                                           const compressed = await compressImage(file, 800, 0.7);
                                                           setPurchaseForm({...purchaseForm, transferProof: compressed});
                                                       } catch (err) {
                                                           console.error('Error compressing image:', err);
                                                           alert('Gagal mengkompres gambar.');
                                                       }
                                                   }
                                                }}
                                            />
                                        </label>
                                     )}
                                     <div className="text-xs text-slate-500 max-w-[200px]">
                                        Silakan unggah foto dari galeri atau kamera Anda. Sistem akan otomatis melakukan kompresi untuk menghemat ruang.
                                     </div>
                                  </div>
                               </div>
                            )}
                        </div>
                     </div>
                  )}
               </div>

               <div className="p-6 border-t border-slate-800 bg-slate-900 flex gap-4">
                  <button onClick={() => setPurchaseModalOpen(false)} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-lg font-bold">Batal</button>
                  <button 
                     disabled={!selectedIngredient || !purchaseForm.totalPrice}
                     onClick={handlePurchaseSubmit}
                     className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-lg"
                  >
                     KONFIRMASI BELI
                  </button>
               </div>
            </div>
         </div>
  );
};
