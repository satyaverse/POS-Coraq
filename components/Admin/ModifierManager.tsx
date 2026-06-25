
import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Modifier, ProductCategory } from '../../types';
import { Plus, Edit2, Trash2, X, Save, Layers } from 'lucide-react';

export const ModifierManager: React.FC = () => {
  const { modifiers, categories, addModifier, updateModifier, deleteModifier } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [form, setForm] = useState<Partial<Modifier>>({
    name: '', price: 0, type: 'ADDON', targetCategories: []
  });

  const formatRupiah = (value: number) => {
    return value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
  };

  const handleOpenModal = (modifier?: Modifier) => {
    if (modifier) {
      setEditingId(modifier.id);
      setForm({ ...modifier });
    } else {
      setEditingId(null);
      setForm({ name: '', price: 0, type: 'ADDON', targetCategories: [] });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.type) {
      alert("Nama dan Tipe wajib diisi");
      return;
    }

    if (editingId) {
      updateModifier(editingId, form);
    } else {
      addModifier({
        id: `m-${Date.now()}`,
        name: form.name,
        price: Number(form.price) || 0,
        type: form.type,
        targetCategories: form.targetCategories || []
      } as Modifier);
    }
    setIsModalOpen(false);
  };

  const toggleTargetCategory = (cat: string) => {
    const current = form.targetCategories || [];
    if (current.includes(cat)) {
       setForm({ ...form, targetCategories: current.filter(c => c !== cat) });
    } else {
       setForm({ ...form, targetCategories: [...current, cat] });
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
           <div>
              <h3 className="font-bold text-white flex items-center gap-2"><Layers size={20} className="text-purple-500"/> Daftar Modifier & Add-ons</h3>
              <p className="text-xs text-slate-500">Atur varian rasa, toping, dan level.</p>
           </div>
           <button onClick={() => handleOpenModal()} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm">
              <Plus size={16} /> Tambah Baru
           </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modifiers.map(mod => (
            <div key={mod.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between group hover:border-purple-500/50 transition-colors">
               <div>
                  <div className="flex justify-between items-start mb-2">
                     <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        mod.type === 'SUGAR' ? 'bg-pink-900/30 text-pink-400' :
                        mod.type === 'ICE' ? 'bg-blue-900/30 text-blue-400' :
                        'bg-emerald-900/30 text-emerald-400'
                     }`}>{mod.type}</span>
                     <span className="font-mono text-slate-300 font-bold">{mod.price > 0 ? `+${formatRupiah(mod.price)}` : 'Free'}</span>
                  </div>
                  <h4 className="font-bold text-lg text-white mb-1">{mod.name}</h4>
                  <div className="flex flex-wrap gap-1 mb-4">
                      {mod.targetCategories && mod.targetCategories.length > 0 ? 
                         mod.targetCategories.map(c => <span key={c} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">{c}</span>)
                         : <span className="text-[10px] text-slate-600 italic">Berlaku Semua Kategori</span>
                      }
                  </div>
               </div>
               
               <div className="flex gap-2 pt-3 border-t border-slate-800">
                  <button onClick={() => handleOpenModal(mod)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-1.5 rounded text-sm flex items-center justify-center gap-2">
                    <Edit2 size={14}/> Edit
                  </button>
                  <button onClick={() => deleteModifier(mod.id)} className="px-3 bg-slate-800 hover:bg-red-900/30 text-red-500 rounded">
                    <Trash2 size={14}/>
                  </button>
               </div>
            </div>
          ))}
       </div>

       {/* MODAL FORM */}
       {isModalOpen && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-800">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl text-white">{editingId ? 'Edit Modifier' : 'Modifier Baru'}</h3>
                  <button onClick={() => setIsModalOpen(false)}><X className="text-slate-500 hover:text-white"/></button>
               </div>
               
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs text-slate-500 mb-1 font-bold uppercase">Nama Modifier</label>
                     <input className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white focus:border-purple-500 outline-none" placeholder="Contoh: Less Sugar, Extra Shot" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  
                  <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="block text-xs text-slate-500 mb-1 font-bold uppercase">Tipe</label>
                        <select className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white outline-none" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                           <option value="ADDON">Add-on (Topping)</option>
                           <option value="ICE">Temperature (Es/Panas)</option>
                           <option value="SUGAR">Sugar Level (Gula)</option>
                        </select>
                     </div>
                     <div className="flex-1">
                        <label className="block text-xs text-slate-500 mb-1 font-bold uppercase">Harga (+)</label>
                        <input type="number" className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white outline-none" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} />
                     </div>
                  </div>
                  
                  <div>
                     <label className="block text-xs text-slate-500 mb-2 font-bold uppercase">Target Kategori (Opsional)</label>
                     <p className="text-[10px] text-slate-600 mb-2">Jika kosong, modifier akan muncul di semua produk.</p>
                     <div className="flex flex-wrap gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                        {categories.map(cat => (
                           <button 
                              key={cat}
                              onClick={() => toggleTargetCategory(cat)}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${
                                 form.targetCategories?.includes(cat) 
                                 ? 'bg-purple-600 border-purple-600 text-white' 
                                 : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                              }`}
                           >
                              {cat}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                     <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 font-bold">Batal</button>
                     <button onClick={handleSubmit} className="flex-1 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold flex justify-center items-center gap-2">
                        <Save size={18}/> Simpan
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
