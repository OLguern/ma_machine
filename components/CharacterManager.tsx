
import React, { useState, useEffect, useRef } from 'react';
import { Character } from '../types';

interface Props {
  characters: Character[];
  onUpdate: (chars: Character[]) => void;
}

const QUESTIONS = [
  "Caractéristiques physiques", "Profil social", "Sa biographie", 
  "Qualités", "Défauts", "Faiblesses", "Forces", "Alliés", "Rivaux", "Autres / Notes"
];

export const CharacterManager: React.FC<Props> = ({ characters, onUpdate }) => {
  const [selectedId, setSelectedId] = useState<string | null>(characters[0]?.id || null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const addChar = () => {
    const newChar: Character = {
      id: crypto.randomUUID(),
      name: "NOUVEAU PERSONNAGE",
      role: "Rôle",
      description: "",
      answers: QUESTIONS.reduce((acc, q) => ({ ...acc, [q]: "" }), {})
    };
    onUpdate([...characters, newChar]);
    setSelectedId(newChar.id);
  };

  // Focus automatique sur le nom si c'est un nouveau perso
  useEffect(() => {
    if (selectedId && nameInputRef.current) {
      const char = characters.find(c => c.id === selectedId);
      if (char?.name === "NOUVEAU PERSONNAGE") {
        nameInputRef.current.focus();
        nameInputRef.current.select();
      }
    }
  }, [selectedId]);

  const removeChar = (id: string) => {
    if (confirm("Supprimer définitivement ce personnage ?")) {
      const newChars = characters.filter(c => c.id !== id);
      onUpdate(newChars);
      if (selectedId === id) {
        setSelectedId(newChars.length > 0 ? newChars[0].id : null);
      }
    }
  };

  const selectedChar = characters.find(c => c.id === selectedId);

  return (
    <div className="flex h-full gap-6">
      {/* BARRE LATÉRALE */}
      <div className="w-64 bg-[#2b2b2b] rounded border border-[#3c3c3c] flex flex-col shrink-0 shadow-xl">
        <div className="p-4 border-b border-[#3c3c3c]">
          <button 
            onClick={addChar} 
            className="w-full py-2 bg-stone-700 hover:bg-stone-600 rounded text-[10px] font-bold uppercase transition-all shadow-md text-stone-100 tracking-widest active:scale-95"
          >
            + Nouveau Personnage
          </button>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {characters.map(c => (
            <div key={c.id} className="group relative border-b border-[#3c3c3c]">
              <button 
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors pr-10 ${selectedId === c.id ? 'bg-stone-700 text-white shadow-inner' : 'hover:bg-[#353535] text-stone-500'}`}
              >
                {c.name || "SANS NOM"}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); removeChar(c.id); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-stone-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xl leading-none z-10"
                title="Supprimer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ZONE D'ÉDITION */}
      <div className="flex-grow bg-[#2b2b2b] rounded border border-[#3c3c3c] p-12 overflow-y-auto custom-scrollbar shadow-2xl">
        {selectedChar ? (
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="flex gap-6">
              <div className="flex-grow">
                <label className="text-[9px] uppercase font-bold text-stone-500 mb-2 block tracking-widest">Identité / Nom</label>
                <input 
                  ref={nameInputRef}
                  value={selectedChar.name} 
                  onChange={e => onUpdate(characters.map(c => c.id === selectedId ? {...c, name: e.target.value} : c))}
                  className="w-full bg-[#1e1e1e] border border-stone-800 focus:border-stone-600 text-2xl font-bold p-4 rounded focus:ring-0 uppercase text-stone-100 shadow-inner"
                />
              </div>
              <div className="w-1/3">
                <label className="text-[9px] uppercase font-bold text-stone-500 mb-2 block tracking-widest">Fonction Narrative</label>
                <input 
                  value={selectedChar.role} 
                  onChange={e => onUpdate(characters.map(c => c.id === selectedId ? {...c, role: e.target.value} : c))}
                  className="w-full bg-[#1e1e1e] border border-stone-800 focus:border-stone-600 text-xl p-4 rounded focus:ring-0 text-stone-300 shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="bg-[#252525] p-6 rounded border border-stone-800 shadow-lg">
                <label className="text-[9px] uppercase font-bold text-stone-500 mb-3 block tracking-widest">L'essence du personnage</label>
                <textarea 
                  value={selectedChar.description}
                  onChange={e => onUpdate(characters.map(c => c.id === selectedId ? {...c, description: e.target.value} : c))}
                  className="w-full bg-transparent border-none p-0 text-sm resize-none focus:ring-0 text-stone-300 min-h-[100px] leading-relaxed"
                  placeholder="Qui est-il au fond ? Sa blessure, son désir..."
                />
              </div>

              {QUESTIONS.map(q => (
                <div key={q} className="bg-[#252525] p-6 rounded border border-stone-800 shadow-lg group focus-within:border-stone-600 transition-colors">
                  <label className="text-[9px] uppercase font-bold text-stone-500 mb-3 block tracking-widest group-focus-within:text-stone-300 transition-colors">{q}</label>
                  <textarea 
                    value={selectedChar.answers[q] || ""}
                    onChange={e => {
                      const newChars = characters.map(c => {
                        if (c.id === selectedId) {
                          return { ...c, answers: { ...c.answers, [q]: e.target.value } };
                        }
                        return c;
                      });
                      onUpdate(newChars);
                    }}
                    className="w-full bg-transparent border-none p-0 text-sm resize-none focus:ring-0 text-stone-300 min-h-[80px] leading-relaxed"
                    placeholder="..."
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-stone-600 italic uppercase text-[10px] tracking-widest gap-4">
            <span className="text-4xl">👥</span>
            Sélectionnez un personnage pour éditer sa fiche.
          </div>
        )}
      </div>
    </div>
  );
};
