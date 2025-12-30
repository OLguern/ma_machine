import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types.ts';

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export const ScriptEditor: React.FC<Props> = ({ project, onUpdate }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionPos, setSuggestionPos] = useState({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  const characterList = project.characters.map(c => c.name.toUpperCase());

  useEffect(() => {
    if (editorRef.current && project.script !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = project.script || "<div>&nbsp;</div>";
    }
  }, [project.script]);

  const playSound = (type: 'key' | 'bell') => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'bell') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    }
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  const handleInput = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const node = range.startContainer.parentElement;

    if (node && node.classList.contains('character-name')) {
      const text = node.innerText.trim().toUpperCase();
      if (text.length > 0) {
        const matches = characterList.filter(c => c.startsWith(text));
        setSuggestions(matches);
        const rect = node.getBoundingClientRect();
        setSuggestionPos({ x: rect.left, y: rect.bottom + 10 });
      } else {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }

    onUpdate({ script: editorRef.current?.innerHTML });
  };

  const selectSuggestion = (name: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const node = selection.getRangeAt(0).startContainer.parentElement;
    if (node && node.classList.contains('character-name')) {
      node.innerText = name;
      setSuggestions([]);
      playSound('bell');
      
      const newRange = document.createRange();
      newRange.selectNodeContents(node);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      onUpdate({ script: editorRef.current?.innerHTML });
    }
  };

  const insertElement = (className: string, placeholder: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const div = document.createElement('div');
    div.className = className;
    div.innerHTML = placeholder;
    editor.appendChild(div);
    
    const range = document.createRange();
    range.selectNodeContents(div);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    playSound('bell');
    editor.focus();
  };

  return (
    <div className="h-full flex flex-col bg-[#020617] items-center overflow-hidden">
      <div className="shrink-0 w-full flex justify-center py-4 bg-[#0f172a] border-b border-slate-800 gap-2 z-40 shadow-xl">
        <button onClick={() => insertElement('scene-header', 'INT. LIEU - JOUR')} className="px-4 py-2 bg-slate-800 text-[9px] font-black uppercase rounded-full hover:bg-slate-700 transition-all border border-slate-700">Scène</button>
        <button onClick={() => insertElement('narrative-description', 'Action...')} className="px-4 py-2 bg-slate-800 text-[9px] font-black uppercase rounded-full hover:bg-slate-700 transition-all border border-slate-700">Action</button>
        <button onClick={() => insertElement('character-name', 'PERSONNAGE')} className="px-4 py-2 bg-amber-600 text-[9px] font-black uppercase rounded-full hover:bg-amber-500 transition-all shadow-lg">Perso</button>
        <button onClick={() => insertElement('dialogue', 'Dialogue...')} className="px-4 py-2 bg-slate-800 text-[9px] font-black uppercase rounded-full hover:bg-slate-700 transition-all border border-slate-700">Dialogue</button>
      </div>

      <div className="flex-grow w-full overflow-y-auto custom-scrollbar flex flex-col items-center pt-8 pb-40">
        <div 
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={() => playSound('key')}
          className="max-w-4xl w-full bg-[#fdfdfb] shadow-[0_40px_100px_rgba(0,0,0,0.6)] min-h-[1200px] p-[1.5in] paper-texture text-black rounded-sm outline-none font-['Courier_Prime'] text-[12pt] leading-[1.2] screenplay-container"
          suppressContentEditableWarning
        />
      </div>

      {suggestions.length > 0 && (
        <div 
          className="fixed z-[100] bg-white border border-slate-300 shadow-2xl rounded overflow-hidden min-w-[180px]"
          style={{ left: suggestionPos.x, top: suggestionPos.y }}
        >
          <div className="bg-slate-50 px-2 py-1 text-[7px] font-black uppercase tracking-widest text-slate-400 border-b">Suggestions (Entrée)</div>
          {suggestions.map(s => (
            <button key={s} onMouseDown={() => selectSuggestion(s)} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase hover:bg-amber-50 text-slate-900 border-b border-slate-100 last:border-0">{s}</button>
          ))}
        </div>
      )}

      <style>{`
        .screenplay-container div { margin: 0; padding: 0; min-height: 1.2em; white-space: pre-wrap; }
        .scene-header { font-weight: bold; text-transform: uppercase; margin-top: 25pt !important; margin-bottom: 12pt !important; }
        .character-name { text-align: center; margin-top: 22pt !important; margin-bottom: 2pt !important; font-weight: bold; text-transform: uppercase; width: 50% !important; margin-left: auto !important; margin-right: auto !important; }
        .dialogue { text-align: center; width: 60% !important; margin-left: auto !important; margin-right: auto !important; margin-bottom: 12pt !important; }
        .narrative-description { margin-top: 12pt !important; margin-bottom: 12pt !important; }
      `}</style>
    </div>
  );
};