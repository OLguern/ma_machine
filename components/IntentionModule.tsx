
import React, { useState } from 'react';
import { Project, IntentionQuestion } from '../types';

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

const DEFAULT_QUESTIONS: IntentionQuestion[] = [
  { id: 'who', q: "Qui êtes-vous ?", hint: "Votre légitimité, votre regard d'auteur." },
  { id: 'theme', q: "Quel est le thème ?", hint: "L'idée profonde, le message universel." },
  { id: 'what', q: "De quoi parle votre film ?", hint: "Quel est le cœur battant du récit ?" },
  { id: 'why', q: "Pourquoi cette histoire ?", hint: "L'urgence créative." },
  { id: 'char_pertinence', q: "Pertinence du personnage ?", hint: "Lien entre protagoniste et thématique." },
  { id: 'treatment', q: "Originalité du traitement ?", hint: "Vos choix esthétiques et narratifs." },
  { id: 'influences', q: "Influences ?", hint: "Ce qui nourrit votre imaginaire." }
];

export const IntentionModule: React.FC<Props> = ({ project, onUpdate }) => {
  const [showQuestions, setShowQuestions] = useState(true);
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);

  const questions = project.intentionQuestions || DEFAULT_QUESTIONS;
  const answers = project.intentionAnswers || {};

  const updateQuestions = (newQuestions: IntentionQuestion[]) => onUpdate({ intentionQuestions: newQuestions });
  const updateAnswer = (id: string, value: string) => onUpdate({ intentionAnswers: { ...answers, [id]: value } });
  const addQuestion = () => updateQuestions([...questions, { id: crypto.randomUUID(), q: "Nouvelle Question ?", hint: "" }]);
  const removeQuestion = (id: string) => updateQuestions(questions.filter(q => q.id !== id));
  const editQuestion = (id: string, field: keyof IntentionQuestion, value: string) => updateQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));

  return (
    <div className="flex h-full overflow-hidden bg-[#353535] relative">
      <button 
        onClick={() => setShowQuestions(!showQuestions)}
        className={`absolute left-4 top-4 z-20 w-8 h-8 rounded-full bg-stone-800 text-stone-400 border border-stone-600 flex items-center justify-center hover:bg-stone-700 hover:text-white transition-all shadow-xl ${showQuestions ? 'translate-x-[30vw]' : 'translate-x-0'}`}
      >
        {showQuestions ? "←" : "→"}
      </button>

      {showQuestions && (
        <section className="w-1/3 border-r border-[#444] p-8 overflow-y-auto bg-[#2b2b2b] custom-scrollbar animate-in slide-in-from-left duration-300">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-[10px] font-bold uppercase text-stone-500 tracking-[0.3em]">Réflexion d'auteur</h2>
            <button onClick={() => setIsEditingQuestions(!isEditingQuestions)} className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded ${isEditingQuestions ? 'bg-amber-700 text-white' : 'text-stone-500'}`}>
              {isEditingQuestions ? "Finir" : "Éditer"}
            </button>
          </div>
          
          <div className="space-y-12">
            {questions.map((item, idx) => (
              <div key={item.id} className="group relative">
                {isEditingQuestions ? (
                  <div className="bg-stone-800/50 p-4 rounded border border-stone-700 space-y-3">
                    <button onClick={() => removeQuestion(item.id)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-900 text-white rounded-full text-xs flex items-center justify-center">×</button>
                    <input value={item.q} onChange={(e) => editQuestion(item.id, 'q', e.target.value)} className="w-full bg-stone-900 border-none text-xs font-bold p-2 rounded text-stone-100" />
                    <textarea value={item.hint} onChange={(e) => editQuestion(item.id, 'hint', e.target.value)} className="w-full bg-stone-900 border-none text-[10px] p-2 rounded text-stone-400 h-16 resize-none" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-stone-200 text-[10px] font-bold uppercase tracking-widest">{idx + 1}. {item.q}</h3>
                    <textarea 
                      value={answers[item.id] || ""}
                      onChange={(e) => updateAnswer(item.id, e.target.value)}
                      placeholder="Développer ici..."
                      className="w-full bg-[#1e1e1e] border border-stone-800 rounded p-3 text-xs text-stone-300 font-serif leading-relaxed min-h-[80px]"
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
          <div className="mb-12 border-b border-stone-200 pb-2 flex justify-between">
            <span className="text-[10px] font-bold typewriter-font uppercase tracking-widest">NOTE D'INTENTION</span>
            <span className="text-[10px] font-bold typewriter-font uppercase tracking-widest">{project.title}</span>
          </div>
          <textarea 
            value={project.noteIntention}
            onChange={(e) => onUpdate({ noteIntention: e.target.value })}
            className="flex-grow w-full bg-transparent border-none focus:ring-0 font-serif text-[13pt] leading-loose resize-none placeholder-stone-400"
            placeholder="Rédigez ici votre synthèse finale..."
            style={{ minHeight: '800px' }}
          />
        </div>
      </section>
    </div>
  );
};
