
import React, { useState } from 'react';
import { Project, SynopsisQuestion } from '../types';

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

const DEFAULT_SYNOPSIS_QUESTIONS: SynopsisQuestion[] = [
  { id: 'protagonist', q: "Qui est notre protagoniste ?", hint: "Son identité, sa motivation profonde, son état initial." },
  { id: 'incident', q: "Que lui arrive-t-il ?", hint: "L'événement majeur qui bouleverse son monde." },
  { id: 'goal', q: "Quel est son objectif ?", hint: "Ce qu'il cherche à obtenir ou à résoudre concrètement." },
  { id: 'obstacles', q: "Quels sont les obstacles qu'il devra affronter ?", hint: "Les forces antagonistes, intérieures ou extérieures." },
  { id: 'allies', q: "Sur qui peut-il se fier et se méfier ?", hint: "Les relations clés qui influencent son parcours." },
  { id: 'ending', q: "Quel est le dénouement de notre histoire ?", hint: "La résolution finale, le nouvel équilibre atteint." }
];

export const SynopsisModule: React.FC<Props> = ({ project, onUpdate }) => {
  const [showQuestions, setShowQuestions] = useState(true);
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);

  const questions = project.synopsisQuestions || DEFAULT_SYNOPSIS_QUESTIONS;
  const answers = project.synopsisAnswers || {};

  const updateQuestions = (newQuestions: SynopsisQuestion[]) => {
    onUpdate({ synopsisQuestions: newQuestions });
  };

  const updateAnswer = (id: string, value: string) => {
    onUpdate({ synopsisAnswers: { ...answers, [id]: value } });
  };

  const addQuestion = () => {
    const newQuestion: SynopsisQuestion = {
      id: crypto.randomUUID(),
      q: "Nouvelle Question ?",
      hint: "Indice ou explication..."
    };
    updateQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    updateQuestions(questions.filter(q => q.id !== id));
  };

  const editQuestion = (id: string, field: keyof SynopsisQuestion, value: string) => {
    updateQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  return (
    <div className="flex h-full overflow-hidden bg-[#353535] relative">
      <button 
        onClick={() => setShowQuestions(!showQuestions)}
        className={`absolute left-4 top-4 z-20 w-8 h-8 rounded-full bg-stone-800 text-stone-400 border border-stone-600 flex items-center justify-center hover:bg-stone-700 hover:text-white transition-all shadow-xl ${showQuestions ? 'translate-x-[30vw]' : 'translate-x-0'}`}
        title={showQuestions ? "Masquer les questions" : "Afficher les questions"}
      >
        {showQuestions ? "←" : "→"}
      </button>

      {showQuestions && (
        <section className="w-1/3 border-r border-[#444] p-8 overflow-y-auto bg-[#2b2b2b] custom-scrollbar animate-in slide-in-from-left duration-300 relative">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-[10px] font-bold uppercase text-stone-500 tracking-[0.3em] flex items-center gap-2">
              <span className="w-4 h-px bg-stone-700"></span>
              Narration
            </h2>
            <button onClick={() => setIsEditingQuestions(!isEditingQuestions)} className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded ${isEditingQuestions ? 'bg-amber-700 text-white' : 'text-stone-500'}`}>
              {isEditingQuestions ? "Terminer" : "Modifier"}
            </button>
          </div>
          
          <div className="space-y-12">
            {questions.map((item, idx) => (
              <div key={item.id} className="group relative">
                {isEditingQuestions ? (
                  <div className="bg-stone-800/50 p-4 rounded border border-stone-700 space-y-3">
                    <button onClick={() => removeQuestion(item.id)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-900 text-white rounded-full text-xs flex items-center justify-center">×</button>
                    <input value={item.q} onChange={(e) => editQuestion(item.id, 'q', e.target.value)} className="w-full bg-stone-900 border-none text-xs font-bold p-2 rounded text-stone-100 focus:ring-1" />
                    <textarea value={item.hint} onChange={(e) => editQuestion(item.id, 'hint', e.target.value)} className="w-full bg-stone-900 border-none text-[10px] p-2 rounded text-stone-400 h-16 resize-none" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <span className="text-stone-600 font-mono text-xs mt-1">{String(idx + 1).padStart(2, '0')}</span>
                      <div>
                        <h3 className="text-stone-200 text-sm font-bold mb-1 uppercase tracking-tight">{item.q}</h3>
                        <p className="text-stone-500 text-[10px] italic border-l border-stone-700 pl-3">{item.hint}</p>
                      </div>
                    </div>
                    <textarea 
                      value={answers[item.id] || ""}
                      onChange={(e) => updateAnswer(item.id, e.target.value)}
                      placeholder="Développez ce point ici..."
                      className="w-full bg-[#1e1e1e] border border-stone-800 focus:border-stone-600 focus:ring-0 rounded p-3 text-xs text-stone-300 font-serif leading-relaxed min-h-[80px] resize-none overflow-hidden"
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
            {isEditingQuestions && <button onClick={addQuestion} className="w-full py-4 border-2 border-dashed border-stone-700 text-stone-600 rounded text-xs font-bold uppercase tracking-widest">+ Ajouter</button>}
          </div>
        </section>
      )}

      <section className="flex-grow p-12 overflow-y-auto bg-[#353535] flex justify-center custom-scrollbar">
        <div className="max-w-3xl w-full bg-white shadow-2xl min-h-[1000px] p-16 paper-texture text-black rounded-sm mb-12 flex flex-col relative">
          <h2 className="text-center font-bold text-xl uppercase mb-12 tracking-[0.2em] typewriter-font underline decoration-double underline-offset-8">Synopsis</h2>
          <textarea 
            value={project.synopsis}
            onChange={(e) => onUpdate({ synopsis: e.target.value })}
            className="flex-grow w-full bg-transparent border-none focus:ring-0 font-serif text-[13pt] leading-loose resize-none placeholder-stone-500"
            placeholder="Rédigez ici le résumé complet de votre histoire, du début à la fin, en développant les points notés à gauche..."
            style={{ minHeight: '800px' }}
          />
        </div>
      </section>
    </div>
  );
};
