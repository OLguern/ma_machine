import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';

interface ScriptEditorProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

type SoundType = 'KEY' | 'SPACE' | 'BELL';

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ project, onUpdate }) => {
  const [showSequencerRef, setShowSequencerRef] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(-1);
  const [characterSuggestions, setCharacterSuggestions] = useState<string[]>([]);
  const [isCharacterFieldFocused, setIsCharacterFieldFocused] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const lastProjectScript = useRef(project.script);
  const isTyping = useRef(false);
  const audioCtx = useRef<AudioContext | null>(null);
  const noiseBuffer = useRef<AudioBuffer | null>(null);

  const sequencerLines = project.sequencier.split('\n');
  const sequencerHeaders = sequencerLines
    .map(line => line.trim())
    .filter(line => line.match(/^(\d+\.\s*)?(INT\.|EXT\.)/i));
  
  const knownCharacters = project.characters.map(c => c.name.toUpperCase());

  useEffect(() => {
    const initAudio = () => {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const bufferSize = audioCtx.current.sampleRate * 0.25; // 250ms de bruit
        const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        noiseBuffer.current = buffer;
      }
    };
    window.addEventListener('mousedown', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!editorRef.current) return;
      const headers = Array.from(editorRef.current.querySelectorAll('.scene-header')) as HTMLElement[];
      let currentIdx = -1;
      for (let i = 0; i < headers.length; i++) {
        const rect = headers[i].getBoundingClientRect();
        if (rect.top < 350) currentIdx = i; else break;
      }
      if (currentIdx !== activeSceneIdx) {
        setActiveSceneIdx(currentIdx);
        if (sidebarRef.current && currentIdx >= 0) {
            const activeEl = sidebarRef.current.querySelector(`[data-scene-idx="${currentIdx}"]`);
            if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };
    const container = editorRef.current?.parentElement;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [activeSceneIdx]);

  useEffect(() => {
    if (editorRef.current && !isTyping.current) {
      if (project.script !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = project.script || "";
        applyFormatting(true);
      }
    }
    lastProjectScript.current = project.script;
  }, [project.script]);

  const playTypewriterSound = (type: SoundType) => {
    if (!soundEnabled || !audioCtx.current || !noiseBuffer.current) return;
    try {
      const ctx = audioCtx.current;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;

      if (type === 'BELL') {
        const bell = ctx.createOscillator();
        const bGain = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(1400, now);
        bGain.gain.setValueAtTime(0, now);
        bGain.gain.linearRampToValueAtTime(0.04, now + 0.02);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        bell.connect(bGain);
        bGain.connect(ctx.destination);
        bell.start(now);
        bell.stop(now + 0.5);
        return;
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer.current;
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      if (type === 'SPACE') {
        // Son SOURD (Thump) imitant la barre d'espace lourde
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      } else {
        // Son SEC et MÉTALLIQUE imitant la frappe standard
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3200, now);
        filter.Q.setValueAtTime(4, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
      }

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(now);
    } catch (e) { }
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
        if (!child.classList.contains('scene-header')) { child.className = 'scene-header'; changed = true; }
        const cleanContent = text.replace(/^(\d+\.\s*)+/, ""); 
        const targetText = `${sceneCount}. ${cleanContent}`;
        if (child.innerText.trim().toUpperCase() !== targetText) { child.innerText = targetText; changed = true; }
      }
    });
    if (shouldSave && changed) saveToProject();
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
    let html = ""; let placeholder = "";
    switch (type) {
      case 'header':
        const existingHeaders = (Array.from(editor.querySelectorAll('.scene-header')) as HTMLElement[]).map(h => h.innerText.replace(/^(\d+\.\s*)+/, "").trim().toUpperCase());
        let headerText = "INT. NOUVELLE SCÈNE - JOUR";
        for (const sHeader of sequencerHeaders) {
          const cleanSHeader = sHeader.replace(/^(\d+\.\s*)?(INT\.|EXT\.)/.test(sHeader) ? sHeader : "").trim().toUpperCase();
          if (cleanSHeader && !existingHeaders.includes(cleanSHeader)) { headerText = cleanSHeader; break; }
        }
        html = `<div class="scene-header">${headerText.toUpperCase()}</div>`;
        break;
      case 'narrative': placeholder = "DESCRIPTION"; html = `<div class="narrative-description">${placeholder}</div>`; break;
      case 'character': placeholder = "PERSONNAGE"; html = `<div class="character-name">${placeholder}</div>`; break;
      case 'parenthetical': placeholder = "didascalie"; html = `<div class="parenthetical">(${placeholder})</div>`; break;
      case 'dialogue': placeholder = "Dialogue..."; html = `<div class="dialogue">${placeholder}</div>`; break;
      case 'sound': placeholder = "BRUIT"; html = `<div class="sound-effect">(BRUIT : ${placeholder})</div>`; break;
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
      while (container && container !== editor && container.parentNode !== editor) container = container.parentNode!;
      if (container && container !== editor) { (container as ChildNode).after(newNode); inserted = true; }
    }
    if (!inserted) editor.appendChild(newNode);
    const newRange = document.createRange();
    if (placeholder) {
      let targetNode: Node = newNode;
      while(targetNode.firstChild) targetNode = targetNode.firstChild;
      const start = newNode.innerText.indexOf(placeholder);
      newRange.setStart(targetNode, start);
      newRange.setEnd(targetNode, start + placeholder.length);
      selection.removeAllRanges(); selection.addRange(newRange);
    } else {
      newRange.selectNodeContents(newNode); newRange.collapse(false);
      selection.removeAllRanges(); selection.addRange(newRange);
    }
    newNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    playTypewriterSound('BELL'); applyFormatting(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      playTypewriterSound('SPACE');
    } else if (e.key === 'Enter') {
      if (isCharacterFieldFocused && characterSuggestions.length === 1) {
        e.preventDefault();
        selectCharacterSuggestion(characterSuggestions[0]);
        return;
      }
      playTypewriterSound('BELL');
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      playTypewriterSound('KEY');
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

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    isTyping.current = true;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        let node = selection.anchorNode;
        while (node && node.parentNode !== editorRef.current) node = node.parentNode;
        if (node && (node as HTMLElement).classList?.contains('character-name')) {
            setIsCharacterFieldFocused(true);
            const val = (node as HTMLElement).innerText.trim().toUpperCase();
            if (val.length > 0 && val !== 'PERSONNAGE') {
                const matches = knownCharacters.filter(c => c.startsWith(val));
                if (matches.length === 1) {
                    setCharacterSuggestions(matches);
                } else {
                    setCharacterSuggestions([]);
                }
            } else { setCharacterSuggestions([]); }
        } else { setIsCharacterFieldFocused(false); }
    }
    lastProjectScript.current = editorRef.current?.innerHTML || "";
  };

  const selectCharacterSuggestion = (name: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        let node = selection.anchorNode;
        while (node && node.parentNode !== editorRef.current) node = node.parentNode;
        if (node && (node as HTMLElement).classList?.contains('character-name')) {
            (node as HTMLElement).innerText = name;
            setIsCharacterFieldFocused(false);
            const range = document.createRange();
            range.selectNodeContents(node); range.collapse(false);
            selection.removeAllRanges(); selection.addRange(range);
            applyFormatting(true); 
            playTypewriterSound('BELL');
        }
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-[#020617]">
      {showSequencerRef && (
        <aside className="w-80 bg-[#0f172a] border-r border-slate-800 flex flex-col shrink-0 z-30 shadow-2xl relative">
          <div className="p-4 bg-[#0a0a0a] border-b border-slate-900 flex justify-between items-center h-12">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Séquencier Actif</h3>
            <button onClick={() => setShowSequencerRef(false)} className="text-slate-700 hover:text-white transition-colors">←</button>
          </div>
          <div ref={sidebarRef} className="p-4 overflow-y-auto custom-scrollbar flex-grow bg-[#020617] space-y-4">
              {sequencerLines.length > 0 && sequencerLines.some(l => l.trim()) ? (
                sequencerLines.map((line, idx) => {
                  const isHeader = line.trim().match(/^(\d+\.\s*)?(INT\.|EXT\.)/i);
                  const currentHeadersBefore = sequencerLines.slice(0, idx + 1).filter(l => l.match(/^(\d+\.\s*)?(INT\.|EXT\.)/i)).length - 1;
                  const isActive = activeSceneIdx === currentHeadersBefore && isHeader;
                  return (
                    <div key={idx} data-scene-idx={isHeader ? currentHeadersBefore : undefined} className={`transition-all duration-500 rounded ${isHeader ? (isActive ? 'bg-amber-500/20 border-y border-amber-500 scale-[1.02] shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-amber-900/10 border-y border-amber-600/30 my-4 py-3 px-4') : 'px-4 opacity-40'}`}>
                      <p className={`leading-tight ${isHeader ? (isActive ? 'text-amber-400 font-black' : 'font-bold uppercase text-[9px] tracking-[0.2em] text-amber-500') : 'text-[10px] text-slate-400 font-serif italic'}`}>{line}</p>
                    </div>
                  );
                })
              ) : ( <div className="py-20 text-center text-slate-800 text-[10px] uppercase font-bold tracking-[0.4em]">Séquencier vide.</div> )}
          </div>
        </aside>
      )}

      <main className="flex-grow flex flex-col items-center overflow-hidden relative bg-[#020617] h-full">
        <div className="shrink-0 w-full flex justify-center py-6 bg-[#020617] border-b border-slate-900 z-50 shadow-lg">
          <div className="flex gap-2 bg-[#1e293b] p-2 rounded-full border border-slate-700 shadow-2xl backdrop-blur-lg">
            {!showSequencerRef && <button onClick={() => setShowSequencerRef(true)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center hover:text-white transition-all shadow-lg">→</button>}
            
            <button onClick={() => insertElement('header')} className="group flex flex-col items-center px-5 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-full transition-all shadow-xl" title="Nouvelle Scène (Alt+N)">
               <span className="text-[10px] font-bold uppercase tracking-[0.2em]">+ Scène</span>
               <span className="text-[7px] opacity-40 font-mono mt-0.5">ALT+N</span>
            </button>
            <div className="w-px h-5 bg-slate-700 self-center mx-1"></div>
            <button onClick={() => insertElement('narrative')} className="group flex flex-col items-center px-4 py-2 hover:bg-slate-800 rounded-full transition-colors" title="Action (Alt+A)">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white">Action</span>
               <span className="text-[7px] opacity-40 font-mono text-slate-500">ALT+A</span>
            </button>
            <button onClick={() => insertElement('character')} className="group flex flex-col items-center px-4 py-2 hover:bg-slate-800 rounded-full transition-colors" title="Nom de Personnage (Alt+P)">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white">Nom Perso</span>
               <span className="text-[7px] opacity-40 font-mono text-slate-500">ALT+P</span>
            </button>
            <button onClick={() => insertElement('parenthetical')} className="group flex flex-col items-center px-4 py-2 hover:bg-slate-800 rounded-full transition-colors" title="Didascalie (Alt+I)">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white">Didascalie</span>
               <span className="text-[7px] opacity-40 font-mono text-slate-500">ALT+I</span>
            </button>
            <button onClick={() => insertElement('dialogue')} className="group flex flex-col items-center px-4 py-2 hover:bg-slate-800 rounded-full transition-colors" title="Dialogue (Alt+D)">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white">Dialogue</span>
               <span className="text-[7px] opacity-40 font-mono text-slate-500">ALT+D</span>
            </button>
            <button onClick={() => insertElement('sound')} className="group flex flex-col items-center px-4 py-2 hover:bg-slate-800 rounded-full transition-colors" title="Effet Sonore (Alt+B)">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white">Son</span>
               <span className="text-[7px] opacity-40 font-mono text-slate-500">ALT+B</span>
            </button>
            <div className="w-px h-5 bg-slate-700 self-center mx-1"></div>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all ${soundEnabled ? 'bg-sky-900/50 text-sky-400' : 'bg-slate-800 text-slate-600'}`}>
              {soundEnabled ? '🔊 SON' : '🔇 MUET'}
            </button>
          </div>
        </div>

        <div className="flex-grow w-full overflow-y-auto custom-scrollbar no-scrollbar flex flex-col items-center pt-10 pb-40">
          {isCharacterFieldFocused && characterSuggestions.length === 1 && (
             <div className="fixed top-[180px] z-[100] bg-white border border-slate-300 shadow-2xl p-2 rounded-lg flex flex-col min-w-[200px] animate-in slide-in-from-top-2">
                <div className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-2 border-b border-slate-100 pb-1">Confirmation (Entrée)</div>
                {characterSuggestions.map(name => (
                    <button key={name} onMouseDown={() => selectCharacterSuggestion(name)} className="text-left px-3 py-1.5 hover:bg-sky-50 text-[11px] font-bold uppercase typewriter-font text-slate-900 rounded flex justify-between">
                        <span>{name}</span> <span className="text-[8px] text-slate-400 mt-1">⏎</span>
                    </button>
                ))}
             </div>
          )}

          <div className="max-w-4xl w-full bg-[#fdfdfb] shadow-[0_60px_120px_rgba(0,0,0,0.6)] min-h-[1400px] p-[1.5in] paper-texture text-black rounded-sm relative font-['Courier_Prime'] border-x border-slate-300 screenplay-container">
            <div className="text-center mb-32 mt-12 pt-10 pb-16">
               <div className="text-xl font-bold uppercase tracking-[1em] typewriter-font mb-6 text-slate-900 opacity-90 border-b-2 border-slate-900/20 pb-6 inline-block">
                  {project.title || "TITRE DU RÉCIT"}
               </div>
            </div>
            <div ref={editorRef} contentEditable onInput={handleInput} onKeyDown={handleKeyDown} onBlur={() => setTimeout(() => setIsCharacterFieldFocused(false), 250)} suppressContentEditableWarning={true} className="outline-none text-[12pt] leading-[1.2] min-h-[1100px] screenplay-editor" />
          </div>
        </div>
      </main>

      <style>{`
        .screenplay-editor div, .screenplay-editor p { min-height: 1.2em; white-space: pre-wrap; outline: none; margin: 0; padding: 0; }
        .scene-header { font-weight: bold; text-transform: uppercase; margin-top: 25pt !important; margin-bottom: 12pt !important; text-align: left; }
        .character-name { text-align: center !important; margin-top: 22pt !important; margin-bottom: 2pt !important; text-transform: uppercase; font-weight: bold; }
        .dialogue { text-align: center; width: 62% !important; margin: 0 auto 12pt !important; }
        .parenthetical { text-align: center; width: 45% !important; margin: 0 auto !important; font-style: italic; }
        .narrative-description { text-align: left; margin: 15pt 0 !important; }
        .sound-effect { text-align: center; font-weight: bold; margin: 10pt 0 !important; }
        .paper-texture { background-color: #fdfdfb; background-image: radial-gradient(#e0e0e0 0.8px, transparent 0.8px); background-size: 30px 30px; }
        .typewriter-font { font-family: 'Courier Prime', monospace; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};