import React from 'react';
import { Aperture, Banknote, ChevronDown, ChevronUp, CreditCard, RefreshCcw, Smartphone } from 'lucide-react';

export const PaymentModal: React.FC<any> = ({
  isOpen,
  displayTotal,
  formatRupiah,
  activePaymentMethod,
  handlePaymentMethodClick,
  quickCashOptions,
  setCashRecieved,
  cashRecieved,
  canPay,
  change,
  processPayment,
  proofImage,
  videoRef,
  canvasRef,
  isCameraLoading,
  toggleCamera,
  capturePhoto,
  setProofImage,
  startCamera,
  setPaymentModalOpen,
}) => {
  if (!isOpen) return null;

  return (
         <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           {/* Compact Modal Design: max-w-lg, max-h-[90vh], flex-col */}
           <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              
              {/* Header Merged with Total */}
              <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900 shrink-0">
                  <h3 className="text-xl font-bold text-white">Metode Pembayaran</h3>
                  <div className="text-right">
                      <span className="text-xs text-slate-400 block uppercase tracking-wider">Total Bayar</span>
                      <span className="text-2xl font-bold text-white">{formatRupiah(displayTotal)}</span>
                  </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {/* 1. Cash Option (Accordion) */}
                <div className={`bg-slate-800 rounded-xl overflow-hidden transition-all duration-300 border ${activePaymentMethod === 'CASH' ? 'border-green-600' : 'border-transparent'}`}>
                    <button 
                        onClick={() => handlePaymentMethodClick('CASH')} 
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700 transition-colors group"
                    >
                        <div className="flex items-center">
                            <div className="bg-green-500/20 p-3 rounded-lg text-green-500 mr-4 group-hover:bg-green-500 group-hover:text-white transition-colors"><Banknote size={24}/></div>
                            <span className="text-lg font-bold text-white">Tunai (Cash)</span>
                        </div>
                        {activePaymentMethod === 'CASH' ? <ChevronUp className="text-slate-400"/> : <ChevronDown className="text-slate-400"/>}
                    </button>
                    
                    {/* CASH INPUT EXPANDED */}
                    {activePaymentMethod === 'CASH' && (
                        <div className="px-4 pb-4 border-t border-slate-700 pt-4 bg-slate-800/50 animate-in slide-in-from-top-2 fade-in duration-200">
                            {/* Quick Cash Buttons (Auto Cash) */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {quickCashOptions.map((amount, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setCashRecieved(new Intl.NumberFormat('id-ID').format(amount))}
                                        className="bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-bold text-sm border border-slate-600 transition-colors"
                                    >
                                        {amount === displayTotal ? 'Uang Pas' : formatRupiah(amount)}
                                    </button>
                                ))}
                            </div>

                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Uang Diterima</label>
                            <input 
                            type="text" 
                            className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white font-mono text-xl text-center focus:border-green-500 outline-none"
                            placeholder="0"
                            value={cashRecieved}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setCashRecieved(new Intl.NumberFormat('id-ID').format(Number(val)));
                            }}
                            />
                            <div className="flex justify-between items-center mt-4 bg-slate-900 p-3 rounded-lg">
                            <span className="text-sm text-slate-400">Kembalian:</span>
                            <span className={`font-mono font-bold text-lg ${canPay ? 'text-green-400' : 'text-red-400'}`}>{formatRupiah(change)}</span>
                            </div>
                            <button 
                            onClick={() => processPayment('CASH')}
                            disabled={!canPay}
                            className="w-full mt-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg"
                            >
                            BAYAR SEKARANG
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. QRIS Option (Camera Logic) */}
                <div className={`bg-slate-800 rounded-xl overflow-hidden transition-all duration-300 border ${activePaymentMethod === 'QRIS' ? 'border-blue-600' : 'border-transparent'}`}>
                    <button 
                       onClick={() => handlePaymentMethodClick('QRIS')}
                       className="w-full flex items-center justify-between p-4 hover:bg-slate-700 transition-colors group"
                    >
                       <div className="flex items-center">
                          <div className="bg-blue-500/20 p-3 rounded-lg text-blue-500 mr-4 group-hover:bg-blue-500 group-hover:text-white transition-colors"><Smartphone size={24}/></div>
                          <span className="text-lg font-bold text-white">QRIS (Scan)</span>
                       </div>
                       {activePaymentMethod === 'QRIS' ? <ChevronUp className="text-slate-400"/> : <ChevronDown className="text-slate-400"/>}
                    </button>

                    {activePaymentMethod === 'QRIS' && (
                        <div className="px-4 pb-4 border-t border-slate-700 pt-4 bg-slate-800/50 flex flex-col items-center">
                            {/* CAMERA PREVIEW OR IMAGE */}
                            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative mb-4 flex items-center justify-center border border-slate-600">
                                {proofImage ? (
                                    <img src={proofImage} className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                        <canvas ref={canvasRef} className="hidden" />
                                        {isCameraLoading && (
                                           <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                                              <RefreshCcw size={32} className="text-brand-500 animate-spin" />
                                           </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* CAMERA CONTROLS */}
                            {!proofImage ? (
                               <div className="flex flex-col items-center gap-4">
                                  <div className="flex items-center gap-6">
                                     <button 
                                       onClick={() => toggleCamera(false)} 
                                       className="p-4 rounded-full bg-slate-700 text-slate-300 hover:text-white border border-slate-600 shadow-md"
                                       title="Ganti Kamera"
                                     >
                                         <RefreshCcw size={24}/>
                                     </button>
                                     <button 
                                       onClick={() => capturePhoto(false)} 
                                       className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform shadow-xl border-4 border-slate-300"
                                     >
                                         <Aperture size={40} className="text-slate-800"/>
                                     </button>
                                     <div className="w-14"></div> {/* Placeholder for symmetry */}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ambil Bukti Bayar</span>
                               </div>
                            ) : (
                               <button 
                                 onClick={() => { setProofImage(null); startCamera(false); }} 
                                 className="flex items-center gap-2 text-brand-400 hover:text-brand-300 mb-4 font-bold bg-brand-400/10 px-4 py-2 rounded-full border border-brand-400/30"
                               >
                                   <RefreshCcw size={16}/> Ambil Ulang Foto
                               </button>
                            )}

                            <button 
                               onClick={() => processPayment('QRIS')}
                               disabled={!proofImage}
                               className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg"
                            >
                               {proofImage ? 'BUKTI TERSIMPAN - BAYAR SEKARANG' : 'FOTO BUKTI BAYAR DULU'}
                            </button>
                        </div>
                    )}
                </div>
                
                {/* 3. Debit Option (Camera Logic) */}
                <div className={`bg-slate-800 rounded-xl overflow-hidden transition-all duration-300 border ${activePaymentMethod === 'DEBIT' ? 'border-purple-600' : 'border-transparent'}`}>
                    <button 
                       onClick={() => handlePaymentMethodClick('DEBIT')}
                       className="w-full flex items-center justify-between p-4 hover:bg-slate-700 transition-colors group"
                    >
                       <div className="flex items-center">
                          <div className="bg-purple-500/20 p-3 rounded-lg text-purple-500 mr-4 group-hover:bg-purple-500 group-hover:text-white transition-colors"><CreditCard size={24}/></div>
                          <span className="text-lg font-bold text-white">Debit / Kartu Kredit</span>
                       </div>
                       {activePaymentMethod === 'DEBIT' ? <ChevronUp className="text-slate-400"/> : <ChevronDown className="text-slate-400"/>}
                    </button>
                    
                    {activePaymentMethod === 'DEBIT' && (
                        <div className="px-4 pb-4 border-t border-slate-700 pt-4 bg-slate-800/50 flex flex-col items-center">
                            {/* CAMERA PREVIEW OR IMAGE */}
                            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative mb-4 flex items-center justify-center border border-slate-600">
                                {proofImage ? (
                                    <img src={proofImage} className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                        <canvas ref={canvasRef} className="hidden" />
                                        {isCameraLoading && (
                                           <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                                              <RefreshCcw size={32} className="text-brand-500 animate-spin" />
                                           </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* CAMERA CONTROLS */}
                            {!proofImage ? (
                               <div className="flex flex-col items-center gap-4">
                                  <div className="flex items-center gap-6">
                                     <button 
                                       onClick={() => toggleCamera(false)} 
                                       className="p-4 rounded-full bg-slate-700 text-slate-300 hover:text-white border border-slate-600 shadow-md"
                                       title="Ganti Kamera"
                                     >
                                         <RefreshCcw size={24}/>
                                     </button>
                                     <button 
                                       onClick={() => capturePhoto(false)} 
                                       className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform shadow-xl border-4 border-slate-300"
                                     >
                                         <Aperture size={40} className="text-slate-800"/>
                                     </button>
                                     <div className="w-14"></div> {/* Placeholder for symmetry */}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ambil Bukti Struk</span>
                               </div>
                            ) : (
                               <button 
                                 onClick={() => { setProofImage(null); startCamera(false); }} 
                                 className="flex items-center gap-2 text-brand-400 hover:text-brand-300 mb-4 font-bold bg-brand-400/10 px-4 py-2 rounded-full border border-brand-400/30"
                               >
                                   <RefreshCcw size={16}/> Ambil Ulang Foto
                               </button>
                            )}

                            <button 
                               onClick={() => processPayment('DEBIT')}
                               disabled={!proofImage}
                               className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg"
                            >
                               {proofImage ? 'BUKTI TERSIMPAN - BAYAR SEKARANG' : 'FOTO BUKTI STRUK DULU'}
                            </button>
                        </div>
                    )}
                </div>
              </div>

              {/* Footer Button */}
              <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
                  <button onClick={() => setPaymentModalOpen(false)} className="w-full py-3 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white font-bold transition-colors">Batal Pembayaran</button>
              </div>
           </div>
         </div>
  );
};
