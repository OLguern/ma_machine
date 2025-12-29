
import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';

interface ScriptEditorProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ project, onUpdate }) => {
  const [showSequencerRef, setShowSequencerRef] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cursorPos, setCursorPos] = useState(0);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const lastProjectScript = useRef(project.script);
  const isTyping = useRef(false);
  const audioCtx = useRef<AudioContext | null>(null);

  const sequencerLines = project.sequencier.split('\n');
  const sequencerHeaders = sequencerLines
    .map(line => line.trim())
    .filter(line => line.match(/^(\d+\.\s*)?(INT\.|EXT\.)/i));
  
  useEffect(() => {
    if (editorRef.current && !isTyping.current) {
      if (project.script !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = project.script || "";
        if (project.script && !project.script.includes('class=')) {
          applyFormatting(true);
        }
      }
    }
    lastProjectScript.current = project.script;
  }, [project.script]);

  // Synthétiseur de bruit mécanique avancé
  const playTypewriterSound = (isReturn = false) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtx.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isReturn ? 300 : 700 + Math.random() * 600, now);
      filter.Q.setValueAtTime(15, now);

      osc1.type = 'square';
      osc1.frequency.setValueAtTime(isReturn ? 110 : 180 + Math.random() * 80, now);
      
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(isReturn ? 220 : 350 + Math.random() * 150, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isReturn ? 0.3 : 0.05));

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + (isReturn ? 0.3 : 0.05));
      osc2.stop(now + (isReturn ? 0.3 : 0.05));

      if (isReturn) {
        const bell = ctx.createOscillator();
        const bGain = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(1400, now + 0.15);
        bGain.gain.setValueAtTime(0, now);
        bGain.gain.linearRampToValueAtTime(0.04, now + 0.17);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        bell.connect(bGain);
        bGain.connect(ctx.destination);
        bell.start(now + 0.15);
        bell.stop(now + 0.6);
      }
    } catch (e) { console.warn("Audio Context Error", e); }
  };

  const applyFormatting = (shouldSave = true) => {
    if (!editorRef.current) return;
    
    let changed = false;
    const children = Array.from(editorRef.current.querySelectorAll('div, p')) as HTMLElement[];
    let sceneCount = 0;

    children.forEach((child) => {
      const text = child.innerText.trim().toUpperCase();
      const isHeaderLine = text.startsWith('INT.') || text.startsWith('EXT.') || /^\d+\.\s*(INT\.|EXT\.)/.test(text);
      
      if (isHeaderLine) {
        sceneCount++;
        if (!child.classList.contains('scene-header')) {
          child.className = 'scene-header';
          changed = true;
        }
        const cleanContent = text.replace(/^(\d+\.\s*)+/, ""); 
        const targetText = `${sceneCount}. ${cleanContent}`;
        if (child.innerText.trim().toUpperCase() !== targetText) {
          child.innerText = targetText;
          changed = true;
        }
      }
    });

    if (shouldSave && changed) {
      saveToProject();
    }
    return changed;
  };

  const saveToProject = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (html !== lastProjectScript.current) {
        lastProjectScript.current = html;
        onUpdate({ script: html });
      }
    }
    isTyping.current = false;
  };

  const insertElement = (type: 'header' | 'narrative' | 'character' | 'dialogue' | 'parenthetical' | 'sound') => {
    const editor = editorRef.current;
    if (!editor) return;

    let html = "";
    let placeholder = "";

    switch (type) {
      case 'header':
        const existingHeaders = (Array.from(editor.querySelectorAll('.scene-header')) as HTMLElement[]).map(h => h.innerText.replace(/^(\d+\.\s*)+/, "").trim().toUpperCase());
        let headerText = "INT. NOUVELLE SCÈNE - JOUR";
        for (const sHeader of sequencerHeaders) {
          const cleanSHeader = sHeader.replace(/^(\d+\.\s*)+/, "").trim().toUpperCase();
          if (!existingHeaders.includes(cleanSHeader)) {
            headerText = cleanSHeader;
            break;
          }
        }
        html = `<div class="scene-header">${headerText.toUpperCase()}</div>`;
        break;
      case 'narrative':
        placeholder = "DESCRIPTION";
        html = `<div class="narrative-description">${placeholder}</div>`;
        break;
      case 'character':
        placeholder = "NOM DU PERSONNAGE";
        html = `<div class="character-name">${placeholder}</div>`;
        break;
      case 'parenthetical':
        placeholder = "didascalie";
        html = `<div class="parenthetical">(${placeholder})</div>`;
        break;
      case 'dialogue':
        placeholder = "Dialogue...";
        html = `<div class="dialogue">${placeholder}</div>`;
        break;
      case 'sound':
        placeholder = "BRUIT";
        html = `<div class="sound-effect">(BRUIT : ${placeholder})</div>`;
        break;
    }

    editor.focus();
    const selection = window.getSelection();
    if (!selection) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const newNode = wrapper.firstChild as HTMLElement;

    let range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    let inserted = false;

    if (range) {
      let container = range.commonAncestorContainer;
      while (container && container !== editor && container.parentNode !== editor) {
        container = container.parentNode!;
      }
      if (container && container !== editor) {
        (container as ChildNode).after(newNode);
        inserted = true;
      }
    }

    if (!inserted) {
      editor.appendChild(newNode);
    }

    const newRange = document.createRange();
    if (placeholder) {
      let targetNode: Node = newNode;
      while(targetNode.firstChild) targetNode = targetNode.firstChild;
      const fullText = newNode.innerText;
      const start = fullText.indexOf(placeholder);
      newRange.setStart(targetNode, start);
      newRange.setEnd(targetNode, start + placeholder.length);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      newRange.selectNodeContents(newNode);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    newNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    playTypewriterSound(true);
    applyFormatting(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
       playTypewriterSound(false);
       if (editorRef.current) {
          const shake = (Math.random() - 0.5) * 1.5;
          editorRef.current.style.transform = `translate(${shake}px, ${shake}px)`;
          setTimeout(() => { if(editorRef.current) editorRef.current.style.transform = ''; }, 30);
       }
    } else if (e.key === 'Enter') {
       playTypewriterSound(true);
    }

    if (e.altKey) {
      switch (e.key.toLowerCase()) {
        case 'n': e.preventDefault(); insertElement('header'); break;
        case 'a': e.preventDefault(); insertElement('narrative'); break;
        case 'p': e.preventDefault(); insertElement('character'); break;
        case 'd': e.preventDefault(); insertElement('dialogue'); break;
        case 'i': e.preventDefault(); insertElement('parenthetical'); break;
        case 'b': e.preventDefault(); insertElement('sound'); break;
      }
    }
  };

  const updateCursorPosition = () => {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;
    
    const node = selection.anchorNode;
    const offset = selection.anchorOffset;
    if (node.nodeType === Node.TEXT_NODE) {
      setCursorPos(offset % 80); // Simulation simple de position de chariot
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    isTyping.current = true;
    lastProjectScript.current = editorRef.current?.innerHTML || "";
    updateCursorPosition();
  };

  const handleBlur = () => {
    applyFormatting(true);
    saveToProject();
  };

  return (
    <div className="flex h-full overflow-hidden bg-[#1a1a1a]">
      {showSequencerRef && (
        <aside className="w-80 bg-[#141414] border-r border-stone-800 flex flex-col shrink-0 z-30 shadow-2xl">
          <div className="p-4 bg-[#0a0a0a] border-b border-stone-900 flex justify-between items-center">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-600">Séquencier</h3>
            <button onClick={() => setShowSequencerRef(false)} className="text-stone-700 hover:text-white transition-colors">←</button>
          </div>
          <div className="p-3 overflow-y-auto custom-scrollbar flex-grow bg-[#0f0f0f]">
            <div className="space-y-1">
              {sequencerLines.length > 0 && sequencerLines.some(l => l.trim()) ? (
                sequencerLines.map((line, idx) => {
                  const isHeader = line.trim().match(/^(\d+\.\s*)?(INT\.|EXT\.)/i);
                  return (
                    <div key={idx} className={`transition-all duration-300 rounded px-3 py-2 ${isHeader ? 'bg-amber-900/10 border-l-2 border-amber-600/50 my-2' : 'opacity-10'}`}>
                      <p className={`leading-tight ${isHeader ? 'font-bold uppercase text-[9px] tracking-wider text-stone-300' : 'text-[10px] text-stone-700 font-serif italic'}`}>
                        {line}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center text-stone-900 text-[11px] uppercase font-bold tracking-[0.4em]">Papier vide.</div>
              )}
            </div>
          </div>
        </aside>
      )}

      <main className="flex-grow flex flex-col items-center overflow-y-auto custom-scrollbar p-12 bg-[#1c1c1c] relative">
        {/* Typewriter Carriage Mechanism */}
        <div className="w-full max-w-4xl flex flex-col items-center sticky top-0 z-50 pointer-events-none">
            {/* The Metal Scale (Ruler) */}
            <div className="w-full h-10 bg-gradient-to-b from-stone-700 to-stone-900 rounded-t-xl shadow-2xl relative border-b border-black flex flex-col justify-end px-12 pb-1">
                <div className="absolute -left-6 top-0 w-12 h-10 bg-stone-800 rounded-full shadow-lg border-2 border-stone-700"></div>
                <div className="absolute -right-6 top-0 w-12 h-10 bg-stone-800 rounded-full shadow-lg border-2 border-stone-700"></div>
                
                {/* Scale Markings */}
                <div className="w-full h-4 border-t border-stone-600 flex justify-between items-start pt-0.5 relative">
                    {Array.from({length: 81}).map((_, i) => (
                        <div key={i} className={`bg-stone-500 ${i % 10 === 0 ? 'h-3 w-px' : i % 5 === 0 ? 'h-2 w-px' : 'h-1 w-px'}`}>
                            {i % 10 === 0 && <span className="absolute text-[6px] text-stone-500 -top-3 -translate-x-1/2">{i}</span>}
                        </div>
                    ))}
                    {/* Red indicator */}
                    <div 
                        className="absolute bottom-0 h-4 w-0.5 bg-red-600 shadow-[0_0_5px_red] transition-all duration-75 ease-out"
                        style={{ left: `${(cursorPos / 80) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>

        <div className="mt-8 mb-8 flex gap-2 bg-[#2a2a2a]/90 p-2 rounded-full border border-stone-700 shadow-2xl sticky top-14 z-40 backdrop-blur-lg">
          <button onClick={() => insertElement('header')} className="px-5 py-2 bg-amber-800 hover:bg-amber-700 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-xl">+ NV Scène</button>
          <div className="w-px h-5 bg-stone-700 self-center mx-1"></div>
          <button onClick={() => insertElement('narrative')} className="px-4 py-2 hover:bg-stone-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-white transition-colors">Description</button>
          <button onClick={() => insertElement('character')} className="px-4 py-2 hover:bg-stone-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-white transition-colors">Perso</button>
          <button onClick={() => insertElement('parenthetical')} className="px-4 py-2 hover:bg-stone-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-white transition-colors">Didascalie</button>
          <button onClick={() => insertElement('dialogue')} className="px-4 py-2 hover:bg-stone-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-white transition-colors">Dialogue</button>
          <div className="w-px h-5 bg-stone-700 self-center mx-1"></div>
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all ${soundEnabled ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-900/50' : 'bg-stone-800 text-stone-600'}`}
          >
            {soundEnabled ? '🔊 SON' : '🔇 MUET'}
          </button>
          <button onClick={() => applyFormatting(true)} className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded-full text-[10px] font-bold uppercase transition-all border border-stone-700 shadow-xl">Indexer</button>
        </div>

        {/* Paper Sheet Wrapper */}
        <div className="max-w-4xl w-full bg-[#fdfdfb] shadow-[0_60px_120px_rgba(0,0,0,0.6)] min-h-[1400px] p-[1.5in] paper-texture text-black rounded-sm relative mb-40 font-['Courier_Prime'] border-x border-stone-300 transition-all duration-75 ease-out screenplay-container">
          <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-stone-300/40 to-transparent pointer-events-none"></div>
          
          <div className="text-center mb-32 mt-6 pt-10 pb-16">
             <div className="text-5xl font-bold uppercase tracking-[0.5em] typewriter-font mb-6 text-stone-900 opacity-90">
                {project.title || "TITRE DU RÉCIT"}
             </div>
             {(!project.script || project.script === "") && (
                 <div className="text-stone-300 italic text-sm animate-pulse mt-20 uppercase tracking-[0.4em]">
                    Insérez une scène pour charger le papier...
                 </div>
             )}
          </div>
          
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onClick={updateCursorPosition}
            suppressContentEditableWarning={true}
            className="outline-none text-[12pt] leading-[1.2] min-h-[1100px] screenplay-editor"
          />
        </div>

        {/* Foot Control */}
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 px-10 py-3 bg-black/80 rounded-full border border-stone-800 text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500 shadow-2xl backdrop-blur-md z-50">
           <div className="flex items-center gap-2">
              <span className="text-stone-700">POSITION :</span>
              <span className="text-amber-500 font-mono">{cursorPos}</span>
           </div>
           <div className="w-px h-4 bg-stone-800"></div>
           <div className="flex items-center gap-2">
              <span className="text-stone-700">MACHINE :</span>
              <span className="text-stone-400">CARBON v1.6.1</span>
           </div>
        </div>
      </main>

      <style>{`
        .screenplay-editor div, .screenplay-editor p { min-height: 1.2em; white-space: pre-wrap; outline: none; margin: 0; padding: 0; }
        .scene-header { font-weight: bold; text-transform: uppercase; margin-top: 25pt !important; margin-bottom: 12pt !important; text-align: left; }
        .character-name { text-align: center; margin-top: 20pt !important; text-transform: uppercase; }
        .dialogue { text-align: center; width: 62% !important; margin: 0 auto 12pt !important; }
        .parenthetical { text-align: center; width: 45% !important; margin: 0 auto !important; font-style: italic; }
        .narrative-description { text-align: left; margin: 15pt 0 !important; }
        .sound-effect { text-align: center; font-weight: bold; margin: 10pt 0 !important; }
        .screenplay-editor ::selection { background: #f59e0b; color: white; }
        .paper-texture { 
            background-color: #fdfdfb;
            background-image: 
                radial-gradient(#e0e0e0 0.8px, transparent 0.8px),
                linear-gradient(to bottom, transparent 96%, rgba(0,0,0,0.03) 100%);
            background-size: 25px 25px, 100% 1.2em;
        }
        .screenplay-container { transition: transform 0.04s ease-out; }
        .typewriter-font { font-family: 'Courier Prime', monospace; }
      `}</style>
    </div>
  );
};
