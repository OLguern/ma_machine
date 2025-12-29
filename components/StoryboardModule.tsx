
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Project, StoryboardFrame } from '../types';

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

type Tool = 'pencil' | 'brush' | 'eraser';

export const StoryboardModule: React.FC<Props> = ({ project, onUpdate }) => {
  const frames = project.storyboard || [];
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(frames[0]?.id || null);
  
  // Drawing state
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [lightness, setLightness] = useState(0);
  const [tool, setTool] = useState<Tool>('pencil');
  const [size, setSize] = useState(5);
  const [opacity, setOpacity] = useState(100);
  const [isDrawing, setIsDrawing] = useState(false);

  // Unified History State
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const tempContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedFrame = frames.find(f => f.id === selectedFrameId) || frames[0];
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  // --- INITIALIZATION ---
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      // Fixed pixel dimensions (integers only)
      const w = Math.floor(rect.width * 2);
      const h = Math.floor(rect.height * 2);

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        contextRef.current = ctx;
      }

      const tCanvas = document.createElement('canvas');
      tCanvas.width = w;
      tCanvas.height = h;
      const tCtx = tCanvas.getContext('2d');
      if (tCtx) {
        tCtx.scale(2, 2);
        tCtx.lineCap = 'round';
        tCtx.lineJoin = 'round';
        tempContextRef.current = tCtx;
      }
      tempCanvasRef.current = tCanvas;

      const oCanvas = document.createElement('canvas');
      oCanvas.width = w;
      oCanvas.height = h;
      offscreenCanvasRef.current = oCanvas;

      if (selectedFrame?.image) {
        loadCanvas(selectedFrame.image, true);
      } else {
        resetCanvas();
      }
    }
  }, [selectedFrameId]);

  const resetCanvas = () => {
    if (!contextRef.current || !canvasRef.current) return;
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    const initialData = canvas.toDataURL();
    setHistory([initialData]);
    setHistoryIndex(0);
  };

  const loadCanvas = (dataUrl: string, isInitial = false) => {
    if (!contextRef.current || !canvasRef.current) return;
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      if (isInitial) {
        setHistory([dataUrl]);
        setHistoryIndex(0);
      }
    };
    img.src = dataUrl;
  };

  // --- HISTORY ---
  const saveToHistory = (dataUrl: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(dataUrl);
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  };

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      loadCanvas(history[newIndex]);
      if (selectedFrameId) updateFrame(selectedFrameId, { image: history[newIndex] });
    }
  }, [historyIndex, history, selectedFrameId]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      loadCanvas(history[newIndex]);
      if (selectedFrameId) updateFrame(selectedFrameId, { image: history[newIndex] });
    }
  }, [historyIndex, history, selectedFrameId]);

  // --- DRAWING ---
  const startDrawing = (e: React.PointerEvent) => {
    if (!contextRef.current || !canvasRef.current || !tempContextRef.current || !offscreenCanvasRef.current) return;
    setIsDrawing(true);
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const oCtx = offscreenCanvasRef.current.getContext('2d');
    if (oCtx) {
      oCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      oCtx.drawImage(canvasRef.current, 0, 0);
    }

    const tCtx = tempContextRef.current;
    const tCanvas = tempCanvasRef.current;
    tCtx.clearRect(0, 0, tCanvas.width, tCanvas.height);
    tCtx.beginPath();
    tCtx.moveTo(x, y);
    
    tCtx.strokeStyle = tool === 'eraser' ? 'white' : color;
    tCtx.lineWidth = tool === 'eraser' ? size * 2 : size;
    // Fixed: Removed redundant 'tool !== eraser' check as 'tool === brush' is sufficient and prevents TS warning
    tCtx.shadowBlur = tool === 'brush' ? size * 0.6 : 0;
    tCtx.shadowColor = tool === 'brush' ? color : 'transparent';
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current || !tempContextRef.current || !offscreenCanvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = contextRef.current;
    const tCtx = tempContextRef.current;
    const tCanvas = tempCanvasRef.current;

    const pressure = e.pressure > 0 ? e.pressure : 1.0;
    tCtx.lineWidth = (tool === 'eraser' ? size * 2 : size) * pressure;
    tCtx.lineTo(x, y);
    tCtx.stroke();

    // CRITICAL FIX: Use setTransform(1,0,0,1,0,0) and internal pixel dimensions (canvas.width/height)
    // to avoid rounding errors that cause the drawing to drift/rotate.
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // 1. Draw backup
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    ctx.drawImage(offscreenCanvasRef.current, 0, 0);
    
    // 2. Draw current stroke with final opacity
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1.0;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = opacity / 100;
    }
    ctx.drawImage(tCanvas, 0, 0);
    ctx.restore();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    tempContextRef.current?.closePath();
    
    if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL();
        saveToHistory(dataUrl);
        if (selectedFrameId) updateFrame(selectedFrameId, { image: dataUrl });
    }
  };

  // --- OTHER ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const addFrame = () => {
    const newFrame: StoryboardFrame = { id: crypto.randomUUID(), image: "", notes: "", shotType: "PM" };
    onUpdate({ storyboard: [...frames, newFrame] });
    setSelectedFrameId(newFrame.id);
  };

  const updateFrame = (id: string, updates: Partial<StoryboardFrame>) => {
    onUpdate({ storyboard: frames.map(f => f.id === id ? { ...f, ...updates } : f) });
  };

  const removeFrame = (id: string) => {
    const newFrames = frames.filter(f => f.id !== id);
    onUpdate({ storyboard: newFrames });
    if (selectedFrameId === id) setSelectedFrameId(newFrames[0]?.id || null);
  };

  return (
    <div className="flex h-full bg-[#151515] overflow-hidden text-stone-300 font-sans">
      <aside className="w-64 border-r border-stone-800 flex flex-col bg-[#1e1e1e] shrink-0">
        <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-[#252525]">
          <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-500">Navigation</h3>
          <button onClick={addFrame} className="w-6 h-6 bg-amber-700 hover:bg-amber-600 rounded text-white flex items-center justify-center font-bold shadow-lg transition-transform active:scale-90">+</button>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {frames.map((frame, index) => (
            <div 
              key={frame.id}
              onClick={() => setSelectedFrameId(frame.id)}
              className={`group cursor-pointer rounded border transition-all duration-200 ${selectedFrameId === frame.id ? 'border-amber-600 ring-1 ring-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.1)]' : 'border-stone-800 hover:border-stone-700'}`}
            >
              <div className="aspect-video bg-white overflow-hidden rounded-t relative">
                {frame.image ? <img src={frame.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] text-stone-300 font-bold opacity-30 uppercase tracking-widest">Plan {index+1}</div>}
              </div>
              <div className="p-2 bg-[#121212] text-[8px] font-bold uppercase flex justify-between items-center text-stone-500">
                <span>{frame.shotType} / #{index + 1}</span>
                <button onClick={(e) => { e.stopPropagation(); removeFrame(frame.id); }} className="opacity-0 group-hover:opacity-100 text-stone-700 hover:text-red-500 transition-opacity">×</button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-grow flex flex-col p-8 items-center justify-center bg-[#111] relative overflow-hidden">
        {selectedFrame ? (
          <div className="w-full max-w-5xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-2">
               <div className="flex gap-3 items-center">
                 <select value={selectedFrame.shotType} onChange={(e) => updateFrame(selectedFrame.id, { shotType: e.target.value })} className="bg-[#252525] border border-stone-800 text-amber-500 rounded text-[10px] font-bold uppercase p-1.5 px-4 outline-none">
                   {["TGP", "GP", "PR", "PT", "PA", "PM", "PE"].map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
                 <div className="h-4 w-px bg-stone-800 mx-1"></div>
                 <div className="flex gap-1">
                    <button onClick={undo} disabled={historyIndex <= 0} className="w-10 h-8 rounded bg-[#252525] border border-stone-800 flex items-center justify-center disabled:opacity-20 hover:bg-stone-800 text-lg">↩</button>
                    <button onClick={redo} disabled={historyIndex >= history.length - 1} className="w-10 h-8 rounded bg-[#252525] border border-stone-800 flex items-center justify-center disabled:opacity-20 hover:bg-stone-800 text-lg">↪</button>
                 </div>
               </div>
               <button onClick={() => { if(confirm("Réinitialiser le dessin ?")) resetCanvas(); }} className="text-[9px] font-bold uppercase text-stone-600 hover:text-red-500 tracking-widest">Réinitialiser</button>
            </div>

            <div className="relative shadow-[0_30px_60px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden border-[12px] border-[#252525] bg-white ring-1 ring-white/5">
              <canvas
                ref={canvasRef}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
                className="w-full aspect-video touch-none cursor-crosshair"
              />
            </div>

            <textarea
              value={selectedFrame.notes}
              onChange={(e) => updateFrame(selectedFrame.id, { notes: e.target.value })}
              placeholder="Notes de mise en scène..."
              className="w-full bg-[#1a1a1a] border border-stone-800 rounded-lg p-5 text-stone-200 text-sm font-serif h-24 resize-none focus:border-amber-900 transition-colors shadow-inner"
            />
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="text-6xl opacity-10">🎬</div>
            <button onClick={addFrame} className="px-10 py-4 bg-amber-700 hover:bg-amber-600 text-white rounded font-bold uppercase tracking-widest shadow-2xl transition-all active:scale-95">Initialiser une séquence</button>
          </div>
        )}
      </main>

      <aside className="w-72 border-l border-stone-800 flex flex-col bg-[#1e1e1e] shrink-0 p-6 space-y-8 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          <h3 className="text-[9px] font-bold uppercase tracking-widest text-stone-500 border-b border-stone-800 pb-2">Couleur</h3>
          <div className="space-y-5 bg-[#121212] p-5 rounded-xl border border-stone-800 shadow-inner">
            <div className="h-16 w-full rounded-lg shadow-2xl border border-white/5 relative overflow-hidden" style={{ backgroundColor: color }}>
               <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[8px] uppercase font-bold text-stone-600"><span>Teinte</span><span>{hue}°</span></div>
              <input type="range" min="0" max="360" value={hue} onChange={(e) => setHue(parseInt(e.target.value))} className="w-full h-1.5 bg-gradient-to-r from-red-500 via-green-500 to-red-500 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[8px] uppercase font-bold text-stone-600"><span>Saturation</span><span>{saturation}%</span></div>
              <input type="range" min="0" max="100" value={saturation} onChange={(e) => setSaturation(parseInt(e.target.value))} className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[8px] uppercase font-bold text-stone-600"><span>Luminosité</span><span>{lightness}%</span></div>
              <input type="range" min="0" max="100" value={lightness} onChange={(e) => setLightness(parseInt(e.target.value))} className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-600" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-[9px] font-bold uppercase tracking-widest text-stone-500 border-b border-stone-800 pb-2">Outils</h3>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setTool('pencil')} className={`py-4 rounded-lg flex flex-col items-center gap-1.5 transition-all border ${tool === 'pencil' ? 'bg-amber-700 border-amber-500 text-white shadow-lg' : 'bg-[#252525] border-stone-800 text-stone-600'}`}>
              <span className="text-lg">✏️</span>
              <span className="text-[7px] font-bold uppercase tracking-widest">Crayon</span>
            </button>
            <button onClick={() => setTool('brush')} className={`py-4 rounded-lg flex flex-col items-center gap-1.5 transition-all border ${tool === 'brush' ? 'bg-amber-700 border-amber-500 text-white shadow-lg' : 'bg-[#252525] border-stone-800 text-stone-600'}`}>
              <span className="text-lg">🖌️</span>
              <span className="text-[7px] font-bold uppercase tracking-widest">Pinceau</span>
            </button>
            <button onClick={() => setTool('eraser')} className={`py-4 rounded-lg flex flex-col items-center gap-1.5 transition-all border ${tool === 'eraser' ? 'bg-amber-700 border-amber-500 text-white shadow-lg' : 'bg-[#252525] border-stone-800 text-stone-600'}`}>
              <span className="text-lg">🧼</span>
              <span className="text-[7px] font-bold uppercase tracking-widest">Gomme</span>
            </button>
          </div>
        </div>

        <div className="space-y-6 pt-2">
          <div className="space-y-3">
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-stone-500"><span>Épaisseur</span><span className="text-amber-600">{size}px</span></div>
            <input type="range" min="1" max="100" value={size} onChange={(e) => setSize(parseInt(e.target.value))} className="w-full accent-amber-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-stone-500"><span>Opacité Finale</span><span className="text-amber-600">{opacity}%</span></div>
            <input type="range" min="1" max="100" value={opacity} onChange={(e) => setOpacity(parseInt(e.target.value))} className="w-full accent-amber-600" />
          </div>
        </div>

        <div className="flex-grow"></div>
        <div className="p-4 bg-amber-900/5 rounded-lg border border-amber-900/20 text-[8px] text-stone-600 leading-relaxed font-bold uppercase">
          Système de coordonnées brutes (Integer Matrix) pour éviter le pixel-drift.
        </div>
      </aside>
    </div>
  );
};
