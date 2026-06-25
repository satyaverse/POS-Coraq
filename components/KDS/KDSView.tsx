
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { OrderStatus, Role, Order, User, StationStatus } from '../../types';
import { CheckCircle, Clock, CheckSquare, Square, Timer, ArrowDownUp, History } from 'lucide-react';

// --- ALARM UTILITY ---
const playAlarm = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Alarm sound: Double Beep (High Pitch)
        osc.type = 'sawtooth';
        
        // Beep 1
        osc.frequency.setValueAtTime(880, ctx.currentTime); 
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

        // Beep 2 (Short pause then beep again)
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.25); 
        gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.25);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio play failed", e);
    }
};

// Sub-component for individual card logic
interface KDSCardProps { 
    order: Order; 
    currentUser: User | null; 
    updateStationStatus: (id: string, role: Role, status: StationStatus) => void; 
    toggleItemCompletion: (orderId: string, itemTempId: string) => void;
    isBarista: boolean;
}

const KDSCard: React.FC<KDSCardProps> = ({ 
    order, 
    currentUser, 
    updateStationStatus, 
    toggleItemCompletion,
    isBarista 
}) => {
  
  // 1. Identify Role Logic
  const myRole = isBarista ? Role.BARISTA : Role.KITCHEN;
  const myStatus = isBarista ? order.baristaStatus : order.kitchenStatus;
  
  // Filter items for this view
  const itemsToShow = order.items.filter(item => {
    if (isBarista) {
      return item.product.category.includes('COFFEE') || item.product.category.includes('NON_COFFEE');
    } else {
      return item.product.category.includes('FOOD') || item.product.category.includes('DESSERT');
    }
  });

  // If this station has nothing to do for this order, or status is IDLE
  if (itemsToShow.length === 0 || myStatus === 'IDLE') return null;

  // 2. Calculate Target Time (Sum of all items - Cumulative Work Load)
  const targetMinutes = itemsToShow.reduce((total, item) => {
    const itemTime = (item.product.standardPrepTime || 5);
    return total + (itemTime * item.quantity);
  }, 0);
  
  const targetSeconds = targetMinutes * 60;

  // 3. Timer Logic
  // Using a tick to force re-render every second for progress bars
  const [_, setTick] = useState(0);
  const audioPlayedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
        setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate Real-time elapsed/remaining
  const startTime = new Date(order.createdAt).getTime();
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - startTime) / 1000);
  const remainingSeconds = targetSeconds - elapsedSeconds;

  // Trigger Alarm if total time hits 0
  if (remainingSeconds <= 0 && !audioPlayedRef.current && myStatus !== 'READY' && myStatus !== 'COMPLETED') {
        playAlarm();
        audioPlayedRef.current = true;
  }

  // Derived state for Main Timer
  const isOverdue = remainingSeconds <= 0;
  const absSeconds = Math.abs(remainingSeconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;
  
  // Format: "05:00" or "-01:30"
  const timeString = `${isOverdue ? '-' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // Check Checklist Status
  const allItemsDone = itemsToShow.every(i => i.completed);

  // Color & Visual Logic
  let cardBg = 'bg-slate-900';
  let borderColor = 'border-slate-800';
  let timerColor = 'text-slate-400';
  let animateClass = '';

  if (myStatus === 'READY') {
     cardBg = 'bg-green-950/40';
     borderColor = 'border-green-600';
     timerColor = 'text-green-500';
  } else if (myStatus === 'PREPARING') {
     if (isOverdue) {
        // Critical / Overdue
        cardBg = 'bg-red-950/40';
        borderColor = 'border-red-600';
        timerColor = 'text-red-500 font-bold';
        animateClass = 'animate-blink-red';
     } else if (remainingSeconds <= targetSeconds * 0.3) {
        // Warning (Less than 30% time left)
        cardBg = 'bg-yellow-950/30';
        borderColor = 'border-yellow-600';
        timerColor = 'text-yellow-500';
     } else {
        // Normal Working
        cardBg = 'bg-blue-950/20';
        borderColor = 'border-blue-600';
        timerColor = 'text-blue-400';
     }
  }

  return (
    <div className={`border-l-4 rounded-r-xl shadow-lg flex flex-col relative transition-all duration-300 ${cardBg} ${borderColor} ${animateClass}`}>
      {/* Card Header: Pager & Timer */}
      <div className="p-4 flex justify-between items-start border-b border-white/5">
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">PAGER NO</span>
          <span className="text-6xl font-black leading-none tracking-tighter text-white">{order.pagerNumber}</span>
        </div>
        <div className={`flex flex-col items-end ${timerColor}`}>
            <span className="text-4xl font-mono font-bold tracking-tight">{timeString}</span>
            <div className="flex gap-2 mt-1 items-center">
               <span className="text-[10px] opacity-60 font-mono uppercase">Total {targetMinutes}m</span>
               {myStatus === 'PREPARING' && <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded uppercase">MAKING</span>}
               {myStatus === 'READY' && <span className="text-[10px] bg-green-600 text-white font-bold px-1.5 py-0.5 rounded uppercase">READY</span>}
            </div>
        </div>
      </div>

      {/* Items List (Interactive Checklist with Progress Bars) */}
      <div className="p-2 space-y-1 flex-1 overflow-y-auto">
        {itemsToShow.map((item, idx) => {
          const itemTargetMin = (item.product.standardPrepTime || 5) * item.quantity;
          const itemTargetSec = itemTargetMin * 60;
          
          // Determine duration for this specific item (freeze if completed)
          let itemDurationSeconds = elapsedSeconds;
          if (item.completed && item.completedAt) {
              const doneTime = new Date(item.completedAt).getTime();
              itemDurationSeconds = Math.floor((doneTime - startTime) / 1000);
          }
          
          // Progress Calculation (0 to 100%)
          const progressPct = Math.min(100, Math.max(0, (itemDurationSeconds / itemTargetSec) * 100));
          
          let barColor = 'bg-emerald-500';
          if (progressPct > 70) barColor = 'bg-yellow-500';
          if (progressPct >= 100) barColor = 'bg-red-500';

          return (
          <div 
            key={idx} 
            onClick={() => myStatus !== 'READY' && myStatus !== 'COMPLETED' ? toggleItemCompletion(order.id, item.tempId) : null}
            className={`p-3 rounded-lg cursor-pointer transition-all select-none ${
              item.completed ? 'bg-green-900/20 opacity-50' : 'bg-slate-800/50 hover:bg-slate-800'
            }`}
          >
             <div className="flex items-start gap-3">
                 <div className={`mt-1 transition-colors ${item.completed ? 'text-green-500' : 'text-slate-500'}`}>
                    {item.completed ? <CheckSquare size={24}/> : <Square size={24}/>}
                 </div>
                 
                 <div className={`leading-tight flex-1 ${item.completed ? 'line-through text-slate-400' : ''}`}>
                     <div className="flex justify-between items-start">
                        <div className="font-bold text-xl text-slate-200 leading-none">
                            {item.quantity} <span className={item.quantity > 1 ? 'text-brand-400' : ''}>{item.product.name}</span>
                        </div>
                     </div>

                     {item.modifiers && item.modifiers.length > 0 && (
                       <div className="mt-2 flex flex-wrap gap-1.5">
                         {item.modifiers.map(m => {
                            let styleClass = 'bg-slate-800 text-slate-400 border-slate-700';
                            
                            // Visual Color Coding for Modifiers
                            if (m.type === 'SUGAR') {
                                styleClass = 'bg-pink-950/30 text-pink-400 border-pink-500/30'; // Sweet
                            } else if (m.type === 'ICE') {
                                styleClass = 'bg-cyan-950/30 text-cyan-400 border-cyan-500/30'; // Cold
                            } else if (m.type === 'ADDON') {
                                styleClass = 'bg-amber-950/30 text-amber-400 border-amber-500/30'; // Extra
                            }

                            return (
                               <span 
                               key={m.id}
                               className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${styleClass}`}
                               >
                                 {m.name}
                               </span>
                            );
                         })}
                       </div>
                     )}
                     {item.note && <div className="text-sm text-blue-300 italic mt-1">"{item.note}"</div>}
                 </div>
             </div>

             {/* Progress Bar Item */}
             <div className="mt-3">
                 <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ease-linear ${barColor}`} 
                        style={{ width: `${progressPct}%` }}
                    ></div>
                 </div>
                 <div className="flex justify-between items-center mt-1 text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1"><Timer size={10}/> Est: {itemTargetMin}m</span>
                    <span>{progressPct.toFixed(0)}%</span>
                 </div>
             </div>
          </div>
        )})}
      </div>

      {/* Action Footer */}
      <div className="grid grid-cols-1">
        {myStatus === 'PREPARING' && (
          <button 
            onClick={() => updateStationStatus(order.id, myRole, 'READY')}
            disabled={!allItemsDone}
            className={`font-bold py-4 text-lg transition-colors border-t flex items-center justify-center gap-2 ${
              allItemsDone 
               ? 'bg-blue-600 hover:bg-green-600 text-white border-blue-500' 
               : 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
            }`}
          >
              {allItemsDone ? 'MARK AS READY' : 'COMPLETE ITEMS FIRST'}
          </button>
        )}
      </div>
    </div>
  );
};

export const KDSView: React.FC = () => {
  const { orders, updateStationStatus, toggleItemCompletion, currentUser, logout } = useStore();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');

  const isBarista = currentUser?.role === Role.BARISTA;
  const viewTitle = isBarista ? 'KDS Barista' : 'KDS Kitchen';
  const roleName = isBarista ? 'Barista' : 'Kitchen';
  
  // Sorting Helper: Get Projected Deadline based on Role's Items
  const getDeadline = (order: Order) => {
    // 1. Filter items relevant to this role (same logic as KDSCard)
    const relevantItems = order.items.filter(item => {
        if (isBarista) {
            return item.product.category.includes('COFFEE') || item.product.category.includes('NON_COFFEE');
        } else {
            return item.product.category.includes('FOOD') || item.product.category.includes('DESSERT');
        }
    });

    // 2. Sum Prep Time
    const totalPrepTimeMinutes = relevantItems.reduce((total, item) => {
        return total + ((item.product.standardPrepTime || 5) * item.quantity);
    }, 0);

    // 3. Calculate Deadline Timestamp
    return new Date(order.createdAt).getTime() + (totalPrepTimeMinutes * 60 * 1000);
  };

  // Filter Logic: Show Pending/Preparing
  // Sort Logic: LEAST SLACK TIME (Deadline Ascending)
  const activeOrders = orders.filter(o => {
     const myStatus = isBarista ? o.baristaStatus : o.kitchenStatus;
     return myStatus === 'PENDING' || myStatus === 'PREPARING';
  }).sort((a, b) => {
      // Smallest Deadline timestamp comes first (e.g. 10:00 before 10:15)
      // This automatically handles the "Least Slack Time" logic:
      // Slack = Deadline - CurrentTime. Since CurrentTime is constant for both A and B,
      // sorting by Slack Ascending is the same as sorting by Deadline Ascending.
      return getDeadline(a) - getDeadline(b);
  });

  // Filter Logic: Show Completed Today
  const completedOrders = orders.filter(o => {
     const myStatus = isBarista ? o.baristaStatus : o.kitchenStatus;
     const isToday = new Date(o.createdAt).toDateString() === new Date().toDateString();
     return (myStatus === 'READY' || myStatus === 'COMPLETED') && isToday;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first

  // Calculate Total Items Made Today
  const completedItemsCount = completedOrders.reduce((total, order) => {
      const relevantItems = order.items.filter(item => {
        if (isBarista) {
            return item.product.category.includes('COFFEE') || item.product.category.includes('NON_COFFEE');
        } else {
            return item.product.category.includes('FOOD') || item.product.category.includes('DESSERT');
        }
      });
      return total + relevantItems.reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white">
      {/* Minimal Header */}
      <div className="h-14 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold tracking-tight text-white">{viewTitle}</h1>
            
            {/* Tab Switcher */}
            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                <button 
                    onClick={() => setActiveTab('ACTIVE')}
                    className={`px-4 py-1 rounded-md text-xs font-bold uppercase transition-colors ${activeTab === 'ACTIVE' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Active ({activeOrders.length})
                </button>
                <button 
                    onClick={() => setActiveTab('COMPLETED')}
                    className={`px-4 py-1 rounded-md text-xs font-bold uppercase transition-colors flex items-center gap-2 ${activeTab === 'COMPLETED' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <History size={12}/> History
                </button>
            </div>

            {/* Daily Stats Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-green-900/20 border border-green-900/50 rounded-full">
                <CheckCircle size={12} className="text-green-500"/>
                <span className="text-xs font-bold text-green-400 uppercase">Today's Output: {completedItemsCount} Items</span>
            </div>

            {/* Sorting Indicator (Only for Active) */}
            {activeTab === 'ACTIVE' && (
                <span className="text-[10px] text-brand-500 bg-brand-900/20 px-2 py-0.5 rounded flex items-center gap-1">
                    <ArrowDownUp size={10}/> Sorted by Urgency
                </span>
            )}
         </div>
         <div className="flex items-center gap-4">
            <span className="text-slate-400 font-mono text-xl font-bold">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            <span className="text-xs uppercase font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded">Logged as {currentUser?.name}</span>
            <button onClick={logout} className="text-red-500 hover:text-white text-sm uppercase font-bold tracking-wider">Exit</button>
         </div>
      </div>

      {/* Masonry-like Grid */}
      <div className="flex-1 overflow-auto p-4 bg-slate-950">
        {activeTab === 'ACTIVE' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
              {activeOrders.map(order => (
                 <KDSCard 
                   key={order.id} 
                   order={order} 
                   currentUser={currentUser} 
                   updateStationStatus={updateStationStatus} 
                   toggleItemCompletion={toggleItemCompletion} 
                   isBarista={isBarista} 
                 />
              ))}

              {activeOrders.length === 0 && (
                 <div className="col-span-full flex flex-col items-center justify-center h-[80vh] text-slate-700">
                    <CheckCircle size={80} className="mb-4 opacity-20" />
                    <p className="text-2xl font-bold opacity-30">ALL CLEAR - NO ORDERS</p>
                 </div>
              )}
            </div>
        ) : (
            // COMPLETED LIST VIEW
            <div className="max-w-4xl mx-auto space-y-4">
                {completedOrders.length === 0 ? (
                    <div className="text-center py-20 text-slate-700">
                        <History size={64} className="mx-auto mb-4 opacity-20"/>
                        <p className="text-xl font-bold opacity-40">No completed orders yet today.</p>
                    </div>
                ) : (
                    completedOrders.map(order => {
                        // Filter items again for display
                        const relevantItems = order.items.filter(item => {
                            if (isBarista) {
                                return item.product.category.includes('COFFEE') || item.product.category.includes('NON_COFFEE');
                            } else {
                                return item.product.category.includes('FOOD') || item.product.category.includes('DESSERT');
                            }
                        });
                        
                        if (relevantItems.length === 0) return null;

                        return (
                            <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center opacity-75 hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-6">
                                    <div className="bg-slate-800 w-16 h-16 rounded-lg flex flex-col items-center justify-center border border-slate-700">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Pager</span>
                                        <span className="text-2xl font-bold text-slate-300">{order.pagerNumber}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-green-500 font-bold text-sm uppercase flex items-center gap-1">
                                                <CheckCircle size={14}/> Completed
                                            </span>
                                            <span className="text-slate-500 text-xs">• {new Date(order.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="text-slate-300 text-sm">
                                            {relevantItems.map((item, idx) => (
                                                <span key={idx} className="mr-3">
                                                    <span className="font-bold text-white">{item.quantity}x</span> {item.product.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-500 uppercase font-bold block">Total Items</span>
                                    <span className="text-2xl font-bold text-white">{relevantItems.reduce((sum, i) => sum + i.quantity, 0)}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        )}
      </div>
    </div>
  );
};
