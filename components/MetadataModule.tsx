import React, { useState, useEffect } from 'react';
import { Project } from '../types';

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  onNewProject: () => void;
}

export const MetadataModule: React.FC<Props> = ({ project, onUpdate, onNewProject }) => {
  const [showPwd, setShowPwd] = useState(false);
  const [registry, setRegistry] = useState<{key: string, size: string, preview: string, isGhost: boolean}[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const dumpRegistry = () => {
    setIsScanning(true);
    const entries: any[] = [];
    
    setTimeout(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const val = localStorage.getItem(key) || "";
        
        const isGhost = val.toLowerCase().includes('machine') || 
                        val.includes('INT.') || 
                        val.includes('EXT.') || 
                        val.includes('sequencier');

        entries.push({
          key: key,
          size: (val.length / 1024).toFixed(1) + " KB",
          preview: val.substring(0, 80).replace(/[{}"]/g, ''),
          isGhost
        });
      }
      setRegistry(entries);
      setIsScanning(false);
    }, 1000);
  };

  const tryRestore = (key: string) => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    
    try {
      const parsed = JSON.parse(raw);
      const target = Array.isArray(parsed) ? parsed[0] : parsed;
      if (confirm(`Restaurer les données de la clé [${key}] ?\n\nTitre trouvé : ${target.title || 'Inconnu'}`)) {
        onUpdate(target);
        alert("Données réintégrées.");
      }
    } catch(e) {
      if (confirm("Clé non-standard. Extraire le texte vers le module SCRIPT ?")) {
        onUpdate({ script: raw });
        alert("Texte injecté.");
      }
    }
  };

  return (
    <div className="h-full bg-[#0a0a0a] flex flex-col overflow-hidden font-mono text-stone-400">
      <div className="h-12 bg-[#111] border-b border-[#222] flex items-center justify-between px-6 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-600 animate-pulse">CLEAN_STABLE v1.8.7</span>
        <div className="flex gap-4">
          <button onClick={dumpRegistry} className="text-[9px] font-bold text-stone-500 hover:text-amber-500 transition-colors uppercase tracking-widest">[ Scan Mémoire ]</button>
          <button onClick={onNewProject} className="text-[9px] font-bold text-red-900 hover:text-red-500 transition-colors uppercase tracking-widest">[ Purge Manuscrit ]</button>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden">
        <aside className="w-96 border-r border-[#222] bg-[#080808] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#222] bg-[#0d0d0d] flex justify-between">
             <h3 className="text-[9px] font-bold text-stone-600 uppercase tracking-widest">Registre Local</h3>
             <span className="text-[8px] text-amber-900 font-bold">{registry.length} entrées</span>
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {isScanning && <div className="text-center py-20 text-[9px] text-amber-500 uppercase animate-pulse">Lecture des secteurs...</div>}
            
            {registry.length === 0 && !isScanning && (
              <div className="text-center py-20">
                <button onClick={dumpRegistry} className="text-[9px] text-amber-900 border border-amber-900 px-4 py-2 hover:bg-amber-900/10 uppercase tracking-widest font-bold">Lancer Analyse</button>
              </div>
            )}

            {registry.map(entry => (
              <div 
                key={entry.key} 
                className={`p-4 border transition-all group relative ${entry.isGhost ? 'bg-amber-900/5 border-amber-900/30' : 'bg-[#111] border-[#222]'} hover:border-amber-500 cursor-pointer`} 
                onClick={() => tryRestore(entry.key)}
              >
                {entry.isGhost && <div className="absolute top-0 right-0 bg-amber-600 text-black text-[7px] font-bold px-1.5 py-0.5 uppercase">Match</div>}
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[10px] font-bold text-stone-300 truncate w-2/3">{entry.key}</div>
                  <div className="text-[8px] text-stone-600 font-mono tracking-tighter">{entry.size}</div>
                </div>
                <div className="text-[8px] text-stone-700 font-mono italic leading-relaxed break-all line-clamp-2">{entry.preview}</div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-grow p-12 overflow-y-auto bg-[#050505] flex justify-center custom-scrollbar">
           <div className="max-w-3xl w-full bg-[#fdfdfb] shadow-[0_40px_100px_rgba(0,0,0,1)] min-h-[900px] p-20 paper-texture text-black rounded-sm relative mb-20">
              
              <div className="border-b-2 border-black pb-4 mb-12 flex justify-between items-end">
                <div>
                   <h1 className="text-3xl font-black uppercase tracking-tighter">Fiche de Production</h1>
                   <div className="text-[9px] font-bold text-stone-400 tracking-[0.3em] uppercase">Carbon Studio Terminal v1.8.7</div>
                </div>
                <div className="text-right">
                   <div className="text-[8px] font-bold uppercase text-stone-400">Intégrité</div>
                   <div className="text-[10px] font-black uppercase text-amber-600 tracking-widest">VÉRIFIÉ</div>
                </div>
              </div>

              <div className="space-y-12">
                <section>
                  <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Titre</label>
                  <input 
                    value={project.title}
                    onChange={(e) => onUpdate({ title: e.target.value.toUpperCase() })}
                    className="w-full bg-transparent border-b-2 border-black text-4xl font-black uppercase p-2 focus:outline-none typewriter-font"
                  />
                </section>

                <div className="grid grid-cols-2 gap-12">
                  <section>
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Crédit</label>
                    <input 
                      value={project.meta?.author}
                      onChange={(e) => onUpdate({ meta: {...project.meta, author: e.target.value} })}
                      className="w-full bg-stone-100 border-b border-black p-3 text-sm focus:bg-stone-200 outline-none"
                    />
                  </section>
                  <section>
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Code Accès</label>
                    <div className="flex gap-2">
                      <input 
                        type={showPwd ? "text" : "password"}
                        value={project.password || ""} 
                        onChange={(e) => onUpdate({ password: e.target.value })} 
                        className="flex-grow bg-stone-100 border-b border-black p-3 text-sm font-mono tracking-widest outline-none" 
                      />
                      <button onClick={() => setShowPwd(!showPwd)} className="bg-black text-white px-4 text-[8px] font-bold uppercase">{showPwd ? 'X' : '👁'}</button>
                    </div>
                  </section>
                </div>

                <div className="pt-20 border-t border-stone-200 opacity-20 text-center">
                   <div className="inline-block border-2 border-black p-6">
                      <div className="text-[10px] font-black uppercase tracking-[1em]">CARBON-STABLE</div>
                   </div>
                </div>
              </div>
           </div>
        </main>
      </div>
    </div>
  );
};