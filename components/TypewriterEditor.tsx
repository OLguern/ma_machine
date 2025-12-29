
import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../types';
import { AI_ACTIONS } from '../constants';
// Fixed: Changed processWritingAction to processScriptAction
import { processScriptAction } from '../services/geminiService';
import { Button } from './Button';

interface TypewriterEditorProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export const TypewriterEditor: React.FC<TypewriterEditorProps> = ({ project, onUpdate }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  // Fixed: changed dependency from content to script
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [project.script]);

  const handleAiAction = async (prompt: string) => {
    // Fixed: changed from content to script
    if (!project.script.trim()) {
      alert("S'il vous plaît, écrivez quelques mots avant d'utiliser l'assistant.");
      return;
    }

    setIsAiLoading(true);
    setAiResponse(null);
    try {
      // Fixed: changed from content to script
      const result = await processScriptAction(project.script, prompt);
      setAiResponse(result);
    } catch (e) {
      console.error(e);
      alert("L'assistant a rencontré un problème.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const applyAiResult = () => {
    if (aiResponse) {
      // Fixed: changed from content to script
      onUpdate({ script: project.script + (project.script.endsWith('\n') ? '' : '\n\n') + aiResponse });
      setAiResponse(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Immersive Editor Wrapper */}
      <div className="relative group">
        {/* Typewriter Cylinder Top */}
        <div className="h-6 w-full bg-stone-800 rounded-t-xl border-b-2 border-stone-900 shadow-lg relative z-10 flex justify-center items-center">
          <div className="w-1/3 h-1 bg-stone-700 rounded-full"></div>
        </div>

        {/* Paper Sheet */}
        <div className="paper-texture min-h-[600px] p-12 md:p-16 relative -mt-2 transition-transform duration-500 ease-out">
          {/* Paper Edge Shadow */}
          <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-stone-200/50 to-transparent pointer-events-none"></div>
          
          <input 
            type="text"
            value={project.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full text-2xl font-bold typewriter-font bg-transparent border-none focus:ring-0 mb-8 placeholder-stone-300 text-stone-700 text-center"
            placeholder="Titre du récit..."
          />

          <textarea
            ref={textareaRef}
            // Fixed: changed from content to script
            value={project.script}
            onChange={(e) => onUpdate({ script: e.target.value })}
            className="w-full min-h-[400px] bg-transparent border-none focus:ring-0 text-lg leading-relaxed typewriter-font placeholder-stone-300 resize-none"
            placeholder="Tapez votre histoire ici... Clac, clac, clac."
          />
        </div>

        {/* Typewriter Cylinder Bottom Decoration */}
        <div className="h-4 w-[102%] -ml-[1%] bg-stone-900 rounded-b-lg shadow-xl mt-[-4px]"></div>
      </div>

      {/* AI Assistance Panel */}
      <div className="bg-stone-100 border border-stone-200 rounded-lg p-6 shadow-inner">
        <h3 className="text-stone-600 font-bold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.5 2A3.5 3.5 0 0 0 2 5.5v5A3.5 3.5 0 0 0 5.5 14h5a3.5 3.5 0 0 0 3.5-3.5V8a.5.5 0 0 1 1 0v2.5a4.5 4.5 0 0 1-4.5 4.5h-5A4.5 4.5 0 0 1 1 10.5v-5A4.5 4.5 0 0 1 5.5 1H8a.5.5 0 0 1 0 1H5.5z"/>
            <path d="M16 3a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
          </svg>
          Assistant de Rédaction
        </h3>
        
        <div className="flex flex-wrap gap-3">
          {AI_ACTIONS.map(action => (
            <Button 
              key={action.label} 
              variant="secondary" 
              onClick={() => handleAiAction(action.prompt)}
              disabled={isAiLoading}
              className="text-sm"
            >
              <span>{action.icon}</span> {action.label}
            </Button>
          ))}
        </div>

        {isAiLoading && (
          <div className="mt-6 flex flex-col items-center gap-4 py-8 bg-white/50 rounded animate-pulse">
            <div className="w-8 h-8 border-4 border-stone-800 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-stone-500 italic">La machine réfléchit aux mots suivants...</p>
          </div>
        )}

        {aiResponse && !isAiLoading && (
          <div className="mt-6 p-6 bg-white border border-stone-300 rounded shadow-md animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Suggestion de l'IA</span>
              <button 
                onClick={() => setAiResponse(null)}
                className="text-stone-400 hover:text-stone-800"
              >
                Ignorer
              </button>
            </div>
            <p className="typewriter-font text-stone-700 leading-relaxed mb-6 italic">
              {aiResponse}
            </p>
            <Button onClick={applyAiResult} className="w-full">
              Intégrer ce passage au manuscrit
            </Button>
          </div>
        )}
      </div>

      <div className="sticky bottom-6 flex justify-center">
        <div className="px-6 py-3 bg-stone-800 text-stone-400 text-xs rounded-full shadow-2xl border border-stone-700 flex items-center gap-4">
          <span>{project.script.length} caractères</span>
          <span className="w-px h-3 bg-stone-600"></span>
          <span>{project.script.split(/\s+/).filter(Boolean).length} mots</span>
          <span className="w-px h-3 bg-stone-600"></span>
          <span className="text-stone-300 font-bold">Sauvegarde automatique</span>
        </div>
      </div>
    </div>
  );
};
