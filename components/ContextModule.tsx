
import React, { useState } from 'react';
import { Project, SceneContext } from '../types';

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

const PLAN_DESCRIPTIONS: Record<string, string> = {
  "TGP": "Très Gros Plan : Détail extrême d'un objet ou d'une partie du visage (œil, bouche).",
  "GP": "Gros Plan : Le visage remplit l'écran. Focus sur l'émotion pure.",
  "PR": "Plan Rapproché : Personnage coupé à la poitrine. Favorise l'intimité.",
  "PT": "Plan Taille : Personnage coupé à la taille. Montre l'action des bras et mains.",
  "PA": "Plan Américain : Coupé à mi-cuisses. Issu du western pour montrer le revolver.",
  "PM": "Plan Moyen : Personnage entier de la tête aux pieds. Situe l'action physique.",
  "PE": "Plan d'Ensemble : Le décor domine. Situe le personnage dans son environnement.",
  "TPE": "Très Plan d'Ensemble : Vue panoramique ou aérienne. Sujet minuscule.",
  "PTA": "Plan de Travail : Focus sur un geste technique ou manuel."
};

const DEFAULT_CONTEXT: SceneContext = {
  lumieres: ["INT.", "EXT.", "INT./EXT."],
  lieux: ["MAISON", "RUE", "BUREAU"],
  temps: ["JOUR", "SOIR", "AUBE", "CRÉPUSCULE", "NUIT"],
  transitions: ["COUPE VERS :", "FONDU AU NOIR", "FONDU ENCHAÎNÉ", "IRIS", "VOLET"],
  plans: ["TGP", "GP", "PR", "PT", "PA", "PM", "PE"],
  eclairages: ["LUMIÈRE NATURELLE", "HIGH KEY", "LOW KEY", "CONTRE-JOUR", "TROIS POINTS"]
};

const GLOBAL_LIB_KEY = 'MACHINE_A_ECRIRE_GLOBAL_CONTEXT';

export const ContextModule: React.FC<Props> = ({ project, onUpdate }) => {
  const context = project.sceneContext || { ...DEFAULT_CONTEXT };

  const [inputs, setInputs] = useState<Record<string, string>>({
    lumieres: "", lieux: "", temps: "", transitions: "", plans: "", eclairages: ""
  });

  const updateList = (key: keyof SceneContext, newList: string[]) => {
    onUpdate({
      sceneContext: { ...context, [key]: newList }
    });
  };

  const addItem = (key: keyof SceneContext) => {
    const val = inputs[key].trim().toUpperCase();
    if (!val) return;
    // Fixed indexing error by casting to any to handle potential symbol key issues in TS
    if ((context as any)[key].includes(val)) return;
    updateList(key, [...(context as any)[key], val]);
    setInputs({ ...inputs, [key]: "" });
  };

  const removeItem = (key: keyof SceneContext, index: number) => {
    // Fixed indexing error by casting to any to handle potential symbol key issues in TS
    const newList = [...(context as any)[key]];
    newList.splice(index, 1);
    updateList(key, newList);
  };

  const saveToLibrary = () => {
    localStorage.setItem(GLOBAL_LIB_KEY, JSON.stringify(context));
    alert("Configurations enregistrées dans votre bibliothèque globale.");
  };

  const loadFromLibrary = () => {
    const saved = localStorage.getItem(GLOBAL_LIB_KEY);
    if (saved) {
      onUpdate({ sceneContext: JSON.parse(saved) });
    } else {
      alert("Aucune configuration trouvée dans la bibliothèque.");
    }
  };

  const resetToDefault = () => {
    if (confirm("Réinitialiser avec les réglages d'usine ?")) {
      onUpdate({ sceneContext: { ...DEFAULT_CONTEXT } });
    }
  };

  const columns = [
    { key: 'lumieres' as keyof SceneContext, label: 'Lumière' },
    { key: 'lieux' as keyof SceneContext, label: 'Lieux' },
    { key: 'temps' as keyof SceneContext, label: 'Temps' },
    { key: 'transitions' as keyof SceneContext, label: 'Transitions' },
    { key: 'plans' as keyof SceneContext, label: 'Plan' },
    { key: 'eclairages' as keyof SceneContext, label: 'Éclairage' }
  ];

  return (
    <div className="h-full p-8 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-[11px] font-bold uppercase text-stone-500 tracking-[0.4em] flex items-center gap-3">
          <span className="w-8 h-px bg-stone-700"></span>
          Contexte des Scènes / Paramètres de Production
        </h2>
        <div className="flex gap-2">
          <button onClick={saveToLibrary} className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-400 text-[9px] font-bold uppercase tracking-widest rounded border border-stone-700 transition-colors">Enregistrer en Biblio</button>
          <button onClick={loadFromLibrary} className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-400 text-[9px] font-bold uppercase tracking-widest rounded border border-stone-700 transition-colors">Charger Biblio</button>
          <button onClick={resetToDefault} className="px-3 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 text-[9px] font-bold uppercase tracking-widest rounded border border-red-900/50 transition-colors">Défaut</button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4 flex-grow overflow-hidden">
        {columns.map((col) => (
          // Fixed: Stringified the key to satisfy React's Key requirements and avoid symbol issues
          <div key={String(col.key)} className="flex flex-col bg-[#2b2b2b] rounded border border-[#3c3c3c] overflow-hidden shadow-xl">
            {/* EN-TÊTE COLONNE */}
            <div className="p-3 bg-[#3c3f41] border-b border-[#4c4f51] flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-200">{col.label}</span>
              {/* Fixed: Indexed context with col.key using any cast */}
              <span className="text-[9px] text-stone-500 bg-[#252525] px-1.5 py-0.5 rounded">{(context as any)[col.key].length}</span>
            </div>

            {/* LISTE DES ÉLÉMENTS */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-1 min-h-0 bg-[#252525]">
              {/* Fixed: Indexed context with col.key using any cast */}
              {(context as any)[col.key].length === 0 ? (
                <div className="h-full flex items-center justify-center italic text-stone-700 text-[9px] uppercase tracking-tighter">Vide</div>
              ) : (
                (context as any)[col.key].map((item: string, idx: number) => (
                  <div 
                    key={idx} 
                    className="group flex items-center justify-between p-2 rounded hover:bg-[#323232] transition-colors border border-transparent hover:border-[#444] relative"
                    title={col.key === 'plans' ? PLAN_DESCRIPTIONS[item] || "" : ""}
                  >
                    <span className={`text-[10px] font-mono text-stone-300 truncate pr-2 ${col.key === 'plans' ? 'cursor-help border-b border-dashed border-stone-600' : ''}`}>
                      {item}
                    </span>
                    <button 
                      onClick={() => removeItem(col.key, idx)}
                      className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-red-500 transition-opacity"
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* INPUT D'AJOUT */}
            <div className="p-2 border-t border-[#3c3c3c] bg-[#2b2b2b]">
              <div className="flex gap-1">
                <input 
                  value={inputs[col.key]}
                  onChange={(e) => setInputs({...inputs, [col.key]: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && addItem(col.key)}
                  placeholder="AJOUTER..."
                  className="w-full bg-[#1e1e1e] border-none text-[10px] p-2 rounded focus:ring-1 focus:ring-stone-500 text-stone-200 placeholder-stone-700 uppercase"
                />
                <button 
                  onClick={() => addItem(col.key)}
                  className="px-2 bg-stone-700 hover:bg-stone-600 text-white rounded transition-colors text-sm"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#2d2d2d] p-4 rounded border border-[#3c3c3c] flex items-center gap-4">
        <div className="p-2 bg-blue-900/20 text-blue-400 rounded-full text-xs">ℹ️</div>
        <p className="text-[10px] uppercase tracking-widest text-stone-500 leading-relaxed">
          Survolez les abréviations de <span className="text-stone-300">"Plan"</span> pour voir leur signification. Utilisez la bibliothèque pour garder vos réglages d'un projet à l'autre.
        </p>
      </div>
    </div>
  );
};
