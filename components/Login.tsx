
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { FaceScanner } from './FaceScanner';
import { ScanFace, Clock, LogIn, LogOut } from 'lucide-react';
import { User } from '../types';

export const LoginScreen: React.FC<{ onNavigateToMemberPortal?: () => void }> = ({ onNavigateToMemberPortal }) => {
  const { authenticate, authenticateWithFace, setSession, clockIn, clockOut, getUserStatus } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);

  const handleNumberClick = (num: string) => {
    if (pin.length < 13) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleLogin = async () => {
    const user = await authenticate(pin);
    if (!user) {
      setError('PIN atau No. HP Tidak Dikenal');
      setPin('');
    } else {
      setAuthenticatedUser(user);
    }
  };

  const handleFaceDetected = async (descriptor: number[]) => {
    setShowFaceScanner(false);
    const user = await authenticateWithFace(descriptor);
    if (!user) {
      setError('Wajah tidak dikenali. Silakan gunakan PIN.');
    } else {
      setAuthenticatedUser(user);
    }
  };

  if (authenticatedUser) {
    const status = getUserStatus(authenticatedUser.id);
    
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
          <div className="p-8 text-center border-b border-slate-800">
            <div className="w-20 h-20 rounded-full bg-slate-800 mx-auto mb-4 flex items-center justify-center overflow-hidden border-2 border-orange-500">
               {authenticatedUser.avatar ? (
                 <img src={authenticatedUser.avatar} alt={authenticatedUser.name} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-2xl font-bold text-white">{authenticatedUser.name.charAt(0)}</span>
               )}
            </div>
            <h2 className="text-xl font-bold text-white">Halo, {authenticatedUser.name}!</h2>
            <p className="text-slate-400 text-sm mt-1">Status Absensi Hari Ini: 
               <span className={`ml-2 font-bold ${status === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
                 {status === 'IN' ? 'SUDAH CLOCK IN' : 'BELUM CLOCK IN'}
               </span>
            </p>
          </div>

          <div className="p-8 space-y-4">
            {status === 'OUT' ? (
              <button 
                onClick={() => {
                  clockIn(authenticatedUser, 'PIN');
                  setSession(authenticatedUser);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 rounded-xl transition-all flex items-center justify-center gap-3 text-lg shadow-lg shadow-green-900/20"
              >
                <Clock className="w-6 h-6" />
                CLOCK IN & MASUK POS
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setSession(authenticatedUser)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-6 rounded-xl transition-all flex items-center justify-center gap-3 text-lg shadow-lg shadow-orange-900/20"
                >
                  <LogIn className="w-6 h-6" />
                  MASUK KE SISTEM POS
                </button>
                <button 
                  onClick={() => {
                    clockOut(authenticatedUser, 'PIN');
                    setAuthenticatedUser(null);
                    setPin('');
                  }}
                  className="w-full bg-slate-800 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 border border-slate-700 hover:border-red-500"
                >
                  <LogOut className="w-5 h-5" />
                  CLOCK OUT & KELUAR
                </button>
              </>
            )}
            
            <button 
              onClick={() => {
                setAuthenticatedUser(null);
                setPin('');
              }}
              className="w-full text-slate-500 hover:text-white text-sm font-medium py-2"
            >
              Bukan saya, kembali ke Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {showFaceScanner && (
        <FaceScanner 
          onFaceDetected={handleFaceDetected} 
          onCancel={() => setShowFaceScanner(false)} 
          title="Absensi Wajah (Clock In)"
        />
      )}
      
      <div className="max-w-md w-full bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
        <div className="p-8 text-center border-b border-slate-800">
          <div className="flex justify-center mb-6">
             <img src="https://hesindonesia.id/img/LogoCoraqCoffee.png" alt="Coraq Coffee Logo" className="h-24 w-auto object-contain drop-shadow-xl" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Coraq POS</h1>
          <p className="text-slate-400 text-sm">Masukkan PIN atau No. HP untuk akses sistem</p>
        </div>

        <div className="p-8">
           {/* Input Display */}
           <div className="mb-8">
             <input 
               type="text" 
               readOnly 
               value={pin.replace(/./g, '•')} 
               className="w-full bg-slate-800 text-center text-4xl text-white font-bold py-4 rounded-xl tracking-widest outline-none border border-slate-700"
             />
           </div>
           
           {error && <p className="text-red-500 text-center mb-4 text-sm font-medium">{error}</p>}

           {/* Numpad */}
           <div className="grid grid-cols-3 gap-4 mb-6">
             {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
               <button
                 key={num}
                 onClick={() => handleNumberClick(num.toString())}
                 className="h-16 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xl font-bold transition-colors"
               >
                 {num}
               </button>
             ))}
             <button onClick={() => setPin('')} className="h-16 rounded-xl text-slate-500 hover:text-white font-bold">C</button>
             <button onClick={() => handleNumberClick('0')} className="h-16 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xl font-bold">0</button>
             <button onClick={handleBackspace} className="h-16 rounded-xl text-slate-500 hover:text-white font-bold">⌫</button>
           </div>

           <div className="flex gap-3">
             <button 
               onClick={() => setShowFaceScanner(true)}
               className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700"
             >
               <ScanFace className="w-5 h-5" />
               FACE LOGIN
             </button>
             <button 
               onClick={handleLogin}
               disabled={pin.length < 6}
               className="flex-[2] bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all"
             >
               MASUK
             </button>
           </div>
        </div>
        <div className="bg-slate-800 p-4 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
           <span>Gunakan PIN (6 digit), Nomor Handphone, atau Face Login.</span>
           {onNavigateToMemberPortal && (
             <button onClick={onNavigateToMemberPortal} className="text-orange-500 font-bold hover:text-white transition-colors underline">
               Portal Member (Pelanggan)
             </button>
           )}
        </div>
      </div>
    </div>
  );
};
