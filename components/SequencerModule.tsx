
import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export const SequencerModule: React.FC<Props> = ({ project, onUpdate }) => {
  const context = project.sceneContext;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [shouldFocus, setShouldFocus] = useState(false);
  
  const { autoHeaderSpacing, autoBlockSpacing } = project.writingPreferences || { autoHeaderSpacing: true, autoBlockSpacing: true };

  const [selectedLumiere, setSelectedLumiere] = useState(context?.lumieres[0] || "");
  const [selectedLieu, setSelectedLieu] = useState(context?.lieux[0] || "");
  const [selectedTemps, setSelectedTemps] = useState(context?.temps[0] || "");

  useEffect(() => {
    if (shouldFocus && textareaRef.current) {
      const length = textareaRef.current.value.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(length, length);
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      setShouldFocus(false);
    }
  }, [project.sequencier, shouldFocus]);

  const togglePreference = (key: 'autoHeaderSpacing' | 'autoBlockSpacing') => {
    onUpdate({
      writingPreferences: {
        ...project.writingPreferences!,
        [key]: !project.writingPreferences![key]
      }
    });
  };

  const reindexSequencer = () => {
    const lines = project.sequencier.split('\n');
    let sceneCount = 0;
    const newLines = lines.map(line => {
      const trimmed = line.trim().toUpperCase();
      if (trimmed.startsWith('INT.') || trimmed.startsWith('EXT.') || /^\d+\.\s*(INT\.|EXT\.)/.test(trimmed)) {
        sceneCount++;
        const cleanContent = trimmed.replace(/^(\d+\.\s*)+/, ""); // Enlever anciens numéros
        return `${sceneCount}. ${cleanContent}`;
      }
      return line;
    });
    onUpdate({ sequencier: newLines.join('\n') });
  };

  const generateHeader = () => {
    if (!selectedLumiere || !selectedLieu || !selectedTemps) return;
    
    let textToInsert = "";
    const currentContent = project.sequencier || "";

    if (autoBlockSpacing && currentContent.trim().length > 0) {
      const cleaned = currentContent.replace(/\n+$/, "");
      textToInsert = cleaned + "\n\n";
    } else {
      textToInsert = currentContent;
      if (currentContent.length > 0 && !currentContent.endsWith("\n")) {
        textToInsert += "\n";
      }
    }

    textToInsert += `${selectedLumiere} - ${selectedLieu} - ${selectedTemps}`;

    if (autoHeaderSpacing) {
      textToInsert += "\n\n";
    } else {
      textToInsert += "\n";
    }

    onUpdate({ sequencier: textToInsert });
    setShouldFocus(true);
  };

  return (
    <div className="h-full p-8 flex flex-col gap-6">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-[11px] font-bold uppercase text-stone-500 tracking-[0.4em] flex items-center gap-3">
          <span className="w-8 h-px bg-stone-700"></span>
          Séquencier Narrative
        </h2>
        <button 
          onClick={reindexSequencer}
          className="px-4 py-1.5 bg-amber-900/20 hover:bg-amber-900/40 text-amber-500 border border-amber-900/50 rounded text-[9px] font-bold uppercase tracking-widest transition-all"
        >
          🔢 Numéroter les séquences
        </button>
      </div>

      <div className="flex gap-4 h-full overflow-hidden">
        <aside className="w-64 flex flex-col gap-4 shrink-0">
          <div className="bg-[#2b2b2b] p-6 rounded border border-[#3c3c3c] flex flex-col gap-6 shadow-xl">
            <h3 className="text-[10px] font-bold uppercase text-stone-400 tracking-widest border-b border-stone-700 pb-2">Générateur d'Entête</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[9px] uppercase font-bold text-stone-500 mb-1 block">Lumière</label>
                <select 
                  value={selectedLumiere}
                  onChange={(e) => setSelectedLumiere(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-stone-700 rounded text-[10px] p-2 text-stone-300 focus:ring-1 focus:ring-stone-500"
                >
                  {context?.lumieres.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-stone-500 mb-1 block">Lieu</label>
                <select 
                  value={selectedLieu}
                  onChange={(e) => setSelectedLieu(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-stone-700 rounded text-[10px] p-2 text-stone-300 focus:ring-1 focus:ring-stone-500"
                >
                  {context?.lieux.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-stone-500 mb-1 block">Temps</label>
                <select 
                  value={selectedTemps}
                  onChange={(e) => setSelectedTemps(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-stone-700 rounded text-[10px] p-2 text-stone-300 focus:ring-1 focus:ring-stone-500"
                >
                  {context?.temps.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <button 
                onClick={generateHeader}
                className="w-full py-3 bg-stone-700 hover:bg-stone-600 text-white rounded text-[10px] font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 border border-stone-600"
              >
                + Insérer Entête
              </button>
            </div>

            <div className="pt-4 border-t border-stone-700 space-y-3">
              <h4 className="text-[8px] font-bold uppercase text-stone-600 tracking-widest mb-2">Préférences d'écriture</h4>
              
              <button 
                onClick={() => togglePreference('autoHeaderSpacing')}
                className={`w-full py-2 px-3 rounded text-[9px] font-bold uppercase tracking-widest transition-all flex justify-between items-center border ${
                  autoHeaderSpacing 
                    ? 'bg-emerald-900/20 border-emerald-700 text-emerald-400' 
                    : 'bg-stone-800 border-stone-700 text-stone-500'
                }`}
              >
                <span>Auto-Entête</span>
                <span className={autoHeaderSpacing ? 'opacity-100' : 'opacity-30'}>{autoHeaderSpacing ? 'ON' : 'OFF'}</span>
              </button>

              <button 
                onClick={() => togglePreference('autoBlockSpacing')}
                className={`w-full py-2 px-3 rounded text-[9px] font-bold uppercase tracking-widest transition-all flex justify-between items-center border ${
                  autoBlockSpacing 
                    ? 'bg-emerald-900/20 border-emerald-700 text-emerald-400' 
                    : 'bg-stone-800 border-stone-700 text-stone-500'
                }`}
              >
                <span>Auto-Bloc</span>
                <span className={autoBlockSpacing ? 'opacity-100' : 'opacity-30'}>{autoBlockSpacing ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          <div className="bg-[#2b2b2b]/50 p-4 rounded border border-[#3c3c3c] italic text-stone-500 text-[9px] leading-relaxed">
            <span className="text-stone-300 block mb-1">Dactylographie assistée :</span>
            Utilisez le bouton <span className="text-amber-500">Numéroter</span> en haut à droite pour indexer tout votre travail d'un coup.
          </div>
        </aside>

        <section className="flex-grow flex flex-col bg-[#2b2b2b] rounded border border-[#3c3c3c] overflow-hidden shadow-2xl relative">
          <textarea 
            ref={textareaRef}
            className="flex-grow bg-transparent p-12 text-stone-200 focus:ring-0 border-none resize-none font-serif text-lg leading-relaxed custom-scrollbar"
            value={project.sequencier}
            onChange={(e) => onUpdate({ sequencier: e.target.value })}
            placeholder="Détaillez le contenu de vos séquences ici..."
          />
          <div className="absolute bottom-4 right-8 text-[9px] uppercase font-bold text-stone-700 font-mono tracking-widest pointer-events-none">
            Continuité Narrative
          </div>
        </section>
      </div>
    </div>
  );
};
