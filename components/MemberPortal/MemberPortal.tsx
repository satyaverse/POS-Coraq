import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { LogOut, ArrowLeft, Camera, RefreshCcw, Coffee, Award, Star, History, Image as ImageIcon } from 'lucide-react';
import { Member, Tier } from '../../types';

interface MemberPortalProps {
  onBack: () => void;
}

export const MemberPortal: React.FC<MemberPortalProps> = ({ onBack }) => {
  const { members, updateMember, orders, products } = useStore();
  const [loggedInMemberId, setLoggedInMemberId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const member = members.find(m => m.phone.replace(/\D/g, '') === cleanPhone);

    if (!member) {
      setError('Nomor Handphone tidak ditemukan.');
      return;
    }

    // Default PIN for members who don't have one is "123456" for demo purposes 
    // or we check their actual pin.
    const validPin = member.pin || '123456';
    if (pin !== validPin) {
      setError('PIN salah.');
      return;
    }

    setLoggedInMemberId(member.id);
    setError('');
    setPhoneNumber('');
    setPin('');
  };

  const currentMember = members.find(m => m.id === loggedInMemberId);

  if (!currentMember) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
         <div className="p-4">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
               <ArrowLeft size={20} /> Kembali ke Karyawan
            </button>
         </div>
         <div className="flex-1 flex items-center justify-center p-4">
           <div className="max-w-md w-full bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
             <div className="p-8 text-center border-b border-slate-800">
               <div className="flex justify-center mb-6">
                  <img src="https://hesindonesia.id/img/LogoCoraqCoffee.png" alt="Coraq Coffee Logo" className="h-24 w-auto object-contain drop-shadow-xl" />
               </div>
               <h1 className="text-2xl font-bold text-brand-500 mb-1">Coraq Member Portal</h1>
               <p className="text-slate-400 text-sm">Masuk untuk melihat points, tier, dan menambahkan foto Anda.</p>
             </div>

             <div className="p-8">
                <form onSubmit={handleLogin} className="space-y-4 relative">
                   {error && <div className="bg-red-500/10 text-red-500 text-sm font-bold p-3 rounded text-center border border-red-500/20">{error}</div>}
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">No. WhatsApp</label>
                     <input 
                       type="text" 
                       value={phoneNumber} 
                       onChange={(e) => setPhoneNumber(e.target.value)}
                       className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white font-bold outline-none focus:border-brand-500 transition-colors"
                       placeholder="Contoh: 08123456789"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">PIN</label>
                     <input 
                       type="password" 
                       value={pin} 
                       onChange={(e) => setPin(e.target.value)}
                       className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white font-bold outline-none focus:border-brand-500 transition-colors text-center text-2xl tracking-[0.5em]"
                       placeholder="••••••"
                       maxLength={6}
                     />
                   </div>
                   <button 
                     type="submit"
                     disabled={phoneNumber.length < 8 || pin.length < 4}
                     className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-900/50 mt-4"
                   >
                     MASUK
                   </button>
                   <p className="text-xs text-center text-slate-500 mt-4">Catatan: Jika belum pernah mengatur PIN, PIN default adalah <strong>123456</strong>.</p>
                </form>
             </div>
           </div>
         </div>
      </div>
    );
  }

  return <MemberPortalDashboard member={currentMember} onLogout={() => setLoggedInMemberId(null)} updateMember={updateMember} />
};

const MemberPortalDashboard: React.FC<{
  member: Member; 
  onLogout: () => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
}> = ({ member, onLogout, updateMember }) => {
  const { orders } = useStore();
  const [isEditPhotoOpen, setIsEditPhotoOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengakses kamera.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1); // Mirror
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        updateMember(member.id, { photo: base64Image });
        stopCamera();
        setIsEditPhotoOpen(false);
      }
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const memberOrders = orders.filter(o => o.memberId === member.id && o.status === 'COMPLETED').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
       <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Coffee className="text-brand-500" />
                <span className="font-bold text-white tracking-widest uppercase">Coraq Member</span>
             </div>
             <button onClick={onLogout} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold bg-slate-800 px-3 py-1.5 rounded-lg transition-colors">
                Keluar <LogOut size={16} />
             </button>
          </div>
       </header>

       <main className="max-w-2xl mx-auto p-4 py-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-3xl rounded-full mix-blend-screen" />
             <div className="flex items-center gap-6 relative z-10">
                <div className="relative group">
                   <div className={`w-28 h-28 rounded-full overflow-hidden border-4 bg-slate-800 flex items-center justify-center ${
                      member.tier === Tier.PLATINUM ? 'border-purple-500' :
                      member.tier === Tier.GOLD ? 'border-yellow-500' :
                      member.tier === Tier.SILVER ? 'border-slate-400' :
                      'border-brand-500'
                   }`}>
                      {member.photo ? (
                         <img src={member.photo} className="w-full h-full object-cover" />
                      ) : (
                         <span className="text-3xl font-black text-slate-600">{member.name.charAt(0)}</span>
                      )}
                   </div>
                   <button 
                      onClick={() => setIsEditPhotoOpen(true)}
                      className="absolute bottom-0 right-0 bg-slate-800 hover:bg-brand-500 text-white p-2 rounded-full border border-slate-700 shadow-lg transition-all z-20"
                   >
                      <ImageIcon size={18} />
                   </button>
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-black text-white">{member.fullName}</h2>
                   </div>
                   <p className="text-slate-400 font-mono mb-3">{member.phone}</p>
                   <span className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-widest ${
                      member.tier === Tier.PLATINUM ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      member.tier === Tier.GOLD ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      member.tier === Tier.SILVER ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30' :
                      'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                   }`}>{member.tier} MEMBER</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                   <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Points</span>
                   <Award className="text-pink-500" size={20} />
                </div>
                <div className="text-3xl font-black text-white">{member.points}</div>
                <p className="text-slate-500 text-xs mt-2">Dapat ditukar dengan reward</p>
             </div>
             <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                   <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Total Belanja</span>
                   <Star className="text-yellow-500" size={20} />
                </div>
                <div className="text-2xl font-black text-white font-mono">{formatRupiah(member.totalSpending)}</div>
                <p className="text-slate-500 text-xs mt-2">Menuju tier selanjutnya</p>
             </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
             <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2"><History size={18} /> Riwayat Transaksi</h3>
             </div>
             <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
                {memberOrders.length === 0 ? (
                   <div className="p-8 text-center text-slate-500">Belum ada riwayat transaksi.</div>
                ) : (
                   memberOrders.map(order => (
                      <div key={order.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-400 font-mono">{new Date(order.date).toLocaleDateString('id-ID', { dateStyle: 'medium'})}</span>
                            <span className="font-bold text-white">{formatRupiah(order.finalTotal)}</span>
                         </div>
                         <div className="text-sm text-slate-300 line-clamp-1">
                            {order.items.map(i => i.product.name).join(', ')}
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>
       </main>

       {/* Edit Photo Modal */}
       {isEditPhotoOpen && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md">
             <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-800 overflow-hidden">
                <div className="p-6 text-center border-b border-slate-800">
                   <h3 className="font-black text-white text-xl uppercase tracking-tighter">Ganti Foto Profil</h3>
                   <p className="text-slate-400 text-sm mt-1">Harap berfoto jelas menghadap ke depan.</p>
                </div>
                <div className="aspect-square bg-black relative">
                   {isCameraOpen ? (
                      <>
                         <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                         <div className="absolute inset-x-0 bottom-6 flex justify-center">
                            <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-brand-500 border-4 border-white/20 shadow-xl flex items-center justify-center text-white">
                               <Camera size={24} />
                            </button>
                         </div>
                      </>
                   ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                         <Camera size={48} className="opacity-50" />
                         <button onClick={startCamera} className="bg-slate-800 text-white font-bold px-6 py-3 rounded-full hover:bg-slate-700 transition">Buka Kamera Depan</button>
                      </div>
                   )}
                   <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="p-4 grid grid-cols-2 gap-2">
                   <button onClick={() => { stopCamera(); setIsEditPhotoOpen(false); }} className="bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold flexitems-center justify-center">
                      Batal
                   </button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};
