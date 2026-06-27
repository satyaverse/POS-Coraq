import React from 'react';
import { CheckCircle, ChefHat, FileText, X } from 'lucide-react';
import { OrderStatus } from '../../types';

export const HoldDebtPanel: React.FC<any> = ({
  isOpen,
  orders,
  orderListTab,
  setOrderListTab,
  setOrderListModalOpen,
  pendingOrdersCount,
  unpaidDebtCount,
  preparingOrdersCount,
  formatRupiah,
  handleMarkAsDebt,
  resumeOrder,
  initiatePayDebt,
}) => {
  if (!isOpen) return null;

  return (
         <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-4xl border border-slate-800 flex flex-col max-h-[85vh]">
               <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
                  <h3 className="text-xl font-bold text-white">Daftar Pesanan</h3>
                  <button onClick={() => setOrderListModalOpen(false)}><X className="text-slate-400 hover:text-white"/></button>
               </div>
               
               {/* Tabs */}
               <div className="flex border-b border-slate-800 shrink-0">
                  <button 
                    onClick={() => setOrderListTab('HOLD')}
                    className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${orderListTab === 'HOLD' ? 'border-brand-500 text-brand-500 bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-white'}`}
                  >
                     Disimpan (Hold) <span className="ml-2 bg-slate-700 text-white px-2 py-0.5 rounded-full text-xs">{pendingOrdersCount}</span>
                  </button>
                  <button 
                    onClick={() => setOrderListTab('DEBT')}
                    className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${orderListTab === 'DEBT' ? 'border-red-500 text-red-500 bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-white'}`}
                  >
                     Belum Lunas (Bon) <span className="ml-2 bg-red-900 text-white px-2 py-0.5 rounded-full text-xs">{unpaidDebtCount}</span>
                  </button>
                  <button 
                    onClick={() => setOrderListTab('KITCHEN')}
                    className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${orderListTab === 'KITCHEN' ? 'border-orange-500 text-orange-500 bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-white'}`}
                  >
                     Dapur / Proses <span className="ml-2 bg-orange-900 text-white px-2 py-0.5 rounded-full text-xs">{preparingOrdersCount}</span>
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* KITCHEN / PREPARING LIST */}
                  {orderListTab === 'KITCHEN' && (
                     orders.filter(o => o.status === OrderStatus.PREPARING).length === 0 ? (
                         <div className="text-center py-20 text-slate-500">
                             <ChefHat size={48} className="mx-auto mb-4 opacity-20"/>
                             <p>Tidak ada pesanan yang sedang diproses.</p>
                         </div>
                     ) : (
                         orders.filter(o => o.status === OrderStatus.PREPARING).map(order => {
                            const elapsedMinutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                            return (
                               <div key={order.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl group hover:border-orange-500/50 transition-colors">
                                  <div className="flex justify-between items-start mb-4">
                                     <div className="flex items-center gap-4">
                                        <div className="bg-orange-900/20 w-14 h-14 rounded-lg flex flex-col items-center justify-center border border-orange-900/50 text-orange-500">
                                           <span className="text-[8px] uppercase font-bold">Pager</span>
                                           <span className="text-xl font-bold">{order.pagerNumber}</span>
                                        </div>
                                        <div>
                                           <div className="flex items-center gap-2">
                                               <h4 className="font-bold text-white text-lg">
                                                  {order.customerName ? order.customerName : `Order #${order.id.slice(-4)}`}
                                               </h4>
                                               <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                                   elapsedMinutes > 15 ? 'bg-red-900/50 text-red-400 animate-pulse' : 
                                                   elapsedMinutes > 10 ? 'bg-yellow-900/50 text-yellow-400' : 
                                                   'bg-green-900/50 text-green-400'
                                               }`}>
                                                   {elapsedMinutes} menit lalu
                                               </span>
                                           </div>
                                           <p className="text-xs text-slate-400 mt-1">
                                               Dibuat: {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                           </p>
                                        </div>
                                     </div>
                                     <div className="text-right">
                                         <span className="block text-xs text-slate-500 uppercase font-bold">Status</span>
                                         <span className="text-orange-400 font-bold animate-pulse">SEDANG DIBUAT</span>
                                     </div>
                                  </div>
                                  
                                  {/* Order Items Preview */}
                                  <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-300 space-y-1 border border-slate-800">
                                      {order.items.map((item, idx) => (
                                          <div key={idx} className="flex justify-between">
                                              <span>{item.quantity}x {item.product.name}</span>
                                              {item.modifiers.length > 0 && (
                                                  <span className="text-xs text-slate-500 italic">({item.modifiers.map(m => m.name).join(', ')})</span>
                                              )}
                                          </div>
                                      ))}
                                  </div>
                               </div>
                            );
                         })
                     )
                  )}

                  {/* HOLD LIST */}
                  {orderListTab === 'HOLD' && (
                     orders.filter(o => o.status === OrderStatus.PENDING).length === 0 ? (
                         <div className="text-center py-20 text-slate-500">
                             <FileText size={48} className="mx-auto mb-4 opacity-20"/>
                             <p>Tidak ada pesanan yang ditahan.</p>
                         </div>
                     ) : (
                         orders.filter(o => o.status === OrderStatus.PENDING).map(order => (
                            <div key={order.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex justify-between items-center group hover:border-brand-500/50 transition-colors">
                               <div className="flex items-center gap-6">
                                  <div className="bg-slate-900 w-16 h-16 rounded-lg flex flex-col items-center justify-center border border-slate-700">
                                     <span className="text-[10px] text-slate-500 uppercase font-bold">Pager</span>
                                     <span className="text-2xl font-bold text-white">{order.pagerNumber}</span>
                                  </div>
                                  <div>
                                     <div className="flex items-center gap-2 mb-1">
                                         <h4 className="font-bold text-white text-lg">
                                            {order.customerName ? order.customerName : `Order #${order.id.slice(-4)}`}
                                         </h4>
                                         <span className="text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                     </div>
                                     <p className="text-sm text-slate-400">{order.items.length} Items • <span className="text-brand-400 font-bold">{formatRupiah(order.finalAmount)}</span></p>
                                  </div>
                               </div>
                               
                               <div className="flex gap-2">
                                   {/* Convert to Debt (Kitchen) */}
                                   {/* Disable if no customer name (should always have one for holds, but safety check) */}
                                   <button 
                                      onClick={() => handleMarkAsDebt(order.id)}
                                      className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-bold border border-slate-600 flex items-center gap-2"
                                   >
                                      <ChefHat size={18}/> BON / KIRIM DAPUR
                                   </button>
                                   
                                   {/* Resume to Cart */}
                                   <button 
                                      onClick={() => resumeOrder(order)}
                                      className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg"
                                   >
                                      LANJUT BAYAR
                                   </button>
                               </div>
                            </div>
                         ))
                     )
                  )}

                  {/* DEBT LIST */}
                  {orderListTab === 'DEBT' && (
                     orders.filter(o => o.paymentStatus === 'UNPAID' && o.status !== OrderStatus.PENDING).length === 0 ? (
                        <div className="text-center py-20 text-slate-500">
                            <CheckCircle size={48} className="mx-auto mb-4 opacity-20"/>
                            <p>Semua pesanan lunas.</p>
                        </div>
                    ) : (
                        orders.filter(o => o.paymentStatus === 'UNPAID' && o.status !== OrderStatus.PENDING).map(order => (
                           <div key={order.id} className="bg-slate-800 border border-red-900/30 p-4 rounded-xl flex justify-between items-center group hover:border-red-500/50 transition-colors">
                              <div className="flex items-center gap-6">
                                 <div className="bg-red-900/20 w-16 h-16 rounded-lg flex flex-col items-center justify-center border border-red-900/50 text-red-500">
                                    <span className="text-[10px] uppercase font-bold">Pager</span>
                                    <span className="text-2xl font-bold">{order.pagerNumber}</span>
                                 </div>
                                 <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-white text-lg">
                                           {order.customerName ? order.customerName : `Order #${order.id.slice(-4)}`}
                                        </h4>
                                        <div className="flex gap-1">
                                            <span className="text-[10px] text-white bg-red-600 px-2 py-0.5 rounded font-bold uppercase">BELUM LUNAS</span>
                                            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded font-bold uppercase">{order.status}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400">{order.items.length} Items • <span className="text-red-400 font-bold">{formatRupiah(order.finalAmount)}</span></p>
                                 </div>
                              </div>
                              
                              <button 
                                 onClick={() => initiatePayDebt(order)}
                                 className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg animate-pulse hover:animate-none"
                              >
                                 LUNASI SEKARANG
                              </button>
                           </div>
                        ))
                    )
                  )}
               </div>
            </div>
         </div>
  );
};
