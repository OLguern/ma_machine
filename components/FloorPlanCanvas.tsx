import React, { useState, useRef, useEffect } from 'react';
import { FloorPlanItem, BezierNode, TechnicalShot, TechnicalColumn } from '../types';

interface Props {
  shots: TechnicalShot[];
  columns: TechnicalColumn[];
  floorPlans: Record<string, FloorPlanItem[]>;
  onUpdate: (floorPlans: Record<string, FloorPlanItem[]>) => void;
}

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#f97316', '#10b981', '#f59e0b', '#a855f7', '#6366f1', '#ec4899', '#ffffff', '#71717a'
];

const getCubicPoint = (t: number, p0: number, p1: number, p2: number, p3: number) => {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
};

const getCubicTangent = (t: number, p0: number, p1: number, p2: number, p3: number) => {
  const mt = 1 - t;
  return 3 * mt * mt * (p1 - p0) + 6 * mt * t * (p2 - p1) + 3 * t * t * (p3 - p2);
};

const BlueprintShape = ({ item }: { item: FloorPlanItem }) => {
  const color = item.color || '#ffffff';
  const bw = item.borderWidth || 2;
  const fov = item.fov || 40; 
  const range = item.range || 120;

  if (item.type === 'bezier_curve' && item.nodes && item.nodes.length > 1) {
    const paths = [];
    const rungs = [];
    for (let i = 0; i < item.nodes.length - 1; i++) {
      const n1 = item.nodes[i];
      const n2 = item.nodes[i+1];
      const p0 = { x: n1.x, y: n1.y };
      const p1 = { x: n1.x + n1.cp2x, y: n1.y + n1.cp2y };
      const p2 = { x: n2.x + n2.cp1x, y: n2.y + n2.cp1y };
      const p3 = { x: n2.x, y: n2.y };
      paths.push(<path key={`p-${i}`} d={`M ${p0.x} ${p0.y} C ${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y}`} fill="none" stroke={color} strokeWidth={bw} strokeLinecap="round" />);
      if (item.asRail) {
        const steps = 10;
        for (let j = 0; j <= steps; j++) {
          const t = j / steps;
          const x = getCubicPoint(t, p0.x, p1.x, p2.x, p3.x);
          const y = getCubicPoint(t, p0.y, p1.y, p2.y, p3.y);
          const tx = getCubicTangent(t, p0.x, p1.x, p2.x, p3.x);
          const ty = getCubicTangent(t, p0.y, p1.y, p2.y, p3.y);
          const angle = Math.atan2(ty, tx) + Math.PI / 2;
          const length = 12;
          const x1 = x + Math.cos(angle) * length;
          const y1 = y + Math.sin(angle) * length;
          const x2 = x - Math.cos(angle) * length;
          const y2 = y - Math.sin(angle) * length;
          rungs.push(<line key={`r-${i}-${j}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={bw/2} strokeOpacity="0.5" />);
          if (j < steps) {
            const nt = (j + 1) / steps;
            const nx = getCubicPoint(nt, p0.x, p1.x, p2.x, p3.x);
            const ny = getCubicPoint(nt, p0.y, p1.y, p2.y, p3.y);
            const ntx = getCubicTangent(nt, p0.x, p1.x, p2.x, p3.x);
            const nty = getCubicTangent(nt, p0.y, p1.y, p2.y, p3.y);
            const na = Math.atan2(nty, ntx) + Math.PI / 2;
            const nx1 = nx + Math.cos(na) * length; const ny1 = ny + Math.sin(na) * length;
            const nx2 = nx - Math.cos(na) * length; const ny2 = ny - Math.sin(na) * length;
            rungs.push(<line key={`rl-${i}-${j}`} x1={x1} y1={y1} x2={nx1} y2={ny1} stroke={color} strokeWidth={bw} />);
            rungs.push(<line key={`rr-${i}-${j}`} x1={x2} y1={y2} x2={nx2} y2={ny2} stroke={color} strokeWidth={bw} />);
          }
        }
      }
    }
    return <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">{item.asRail ? rungs : paths}</svg>;
  }

  switch (item.type) {
    case 'text':
      return <div className="w-full h-full flex items-center justify-center font-bold text-center leading-tight whitespace-pre-wrap px-2" style={{ color, fontSize: `${(item.fontSize || 12) * (item.scale || 1)}px` }}>{item.label}</div>;
    case 'arrow':
      const curv = item.curvature || 0;
      const arrowAngle = Math.atan2(-40, -curv) * (180 / Math.PI);
      const rotationAdjustment = arrowAngle + 90;
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <path d={`M 50 90 Q ${50 + curv} 50 50 10`} fill="none" stroke={color} strokeWidth={bw * 2} strokeLinecap="round" />
          <g transform={`translate(50, 10) rotate(${rotationAdjustment}) translate(-50, -10)`}><path d="M 40 25 L 50 10 L 60 25" fill="none" stroke={color} strokeWidth={bw * 2} strokeLinecap="round" strokeLinejoin="round" /></g>
        </svg>
      );
    case 'camera':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <path d={`M 50 50 L ${50 - fov} ${50 - range} L ${50 + fov} ${50 - range} Z`} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1" />
          <rect x="35" y="45" width="30" height="20" fill="none" stroke={color} strokeWidth={bw} rx="2" />
          <rect x="65" y="50" width="10" height="10" fill={color} transform="translate(0, -5)" />
          <circle cx="42" cy="40" r="5" fill="none" stroke={color} strokeWidth={bw} />
          <circle cx="58" cy="40" r="5" fill="none" stroke={color} strokeWidth={bw} />
        </svg>
      );
    case 'light':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <path d={`M 50 50 L ${50 - fov} ${50 - range} L ${50 + fov} ${50 - range} Z`} fill={color} fillOpacity="0.05" stroke={color} strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="50" cy="50" r="12" stroke={color} strokeWidth={bw} fill="none" />
          <line x1="50" y1="35" x2="50" y2="25" stroke={color} strokeWidth={bw} />
          <line x1="62" y1="42" x2="68" y2="36" stroke={color} strokeWidth={bw} />
          <line x1="38" y1="42" x2="32" y2="36" stroke={color} strokeWidth={bw} />
          <line x1="62" y1="58" x2="68" y2="64" stroke={color} strokeWidth={bw} />
          <line x1="38" y1="58" x2="32" y2="64" stroke={color} strokeWidth={bw} />
          <circle cx="50" cy="50" r="3" fill={color} />
        </svg>
      );
    case 'actor':
      return <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible"><circle cx="50" cy="50" r="25" stroke={color} strokeWidth={bw} fill={color} fillOpacity="0.1" /><path d="M 50 25 L 55 15 L 45 15 Z" fill={color} /></svg>;
    case 'dolly':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
           <line x1="35" y1="10" x2="35" y2="90" stroke={color} strokeWidth={bw} />
           <line x1="65" y1="10" x2="65" y2="90" stroke={color} strokeWidth={bw} />
           {[20, 40, 60, 80].map(y => <line key={y} x1="35" y1={y} x2="65" y2={y} stroke={color} strokeWidth={bw/2} strokeOpacity="0.5" />)}
        </svg>
      );
    case 'prop':
      return (
        <div 
          className={`w-full h-full border-dashed flex items-center justify-center transition-all ${item.shape === 'square' ? 'rounded-sm' : 'rounded-full'}`} 
          style={{ borderColor: color, borderWidth: bw, backgroundColor: `${color}1A` }}
        >
          <div className="border opacity-20 w-1/2 h-1/2" style={{ borderColor: color, borderRadius: item.shape === 'square' ? '0' : '999px' }}></div>
        </div>
      );
    default: return null;
  }
};

export const FloorPlanCanvas: React.FC<Props> = ({ shots = [], columns = [], floorPlans = {}, onUpdate }) => {
  const [activeShotId, setActiveShotId] = useState<string>(shots[0]?.id || "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, itemId: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeShotId && shots.length > 0) setActiveShotId(shots[0].id);
  }, [shots, activeShotId]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const safeFloorPlans = floorPlans || {};
  const currentItems = activeShotId ? (safeFloorPlans[activeShotId] || []) : [];

  const updateCurrentItems = (newItems: FloorPlanItem[]) => {
    if (!activeShotId) return;
    onUpdate({ ...safeFloorPlans, [activeShotId]: newItems });
  };

  const updateItem = (id: string, updates: Partial<FloorPlanItem>) => {
    updateCurrentItems(currentItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const addItem = (type: FloorPlanItem['type'], shape: 'square' | 'circle' = 'square') => {
    if (!activeShotId) {
      alert("Créez d'abord un plan dans le découpage.");
      return;
    }
    const newItem: FloorPlanItem = {
      id: crypto.randomUUID(), type, x: 250, y: 200, rotation: 0, label: type.toUpperCase(), color: PRESET_COLORS[0],
      width: type === 'bezier_curve' ? 200 : 100, height: type === 'bezier_curve' ? 200 : 100,
      borderWidth: 2, shape, curvature: 0, fov: 40, range: 120
    };
    updateCurrentItems([...currentItems, newItem]);
    setSelectedId(newItem.id);
  };

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSelectedId(id);
    const startX = e.clientX; const startY = e.clientY;
    const item = currentItems.find(i => i.id === id);
    if (!item) return;
    const initialX = item.x; const initialY = item.y;
    const onMouseMove = (moveEvent: MouseEvent) => updateItem(id, { x: initialX + (moveEvent.clientX - startX), y: initialY + (moveEvent.clientY - startY) });
    const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleResize = (id: string, handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = currentItems.find(i => i.id === id);
    if (!item) return;
    const startX = e.clientX; const startY = e.clientY;
    const initialWidth = item.width || 100; const initialHeight = item.height || 100;
    const initialX = item.x; const initialY = item.y;
    const onMouseMove = (moveEvent: MouseEvent) => {
      let nw = initialWidth + (moveEvent.clientX - startX) * (handle.includes('w') ? -1 : 1);
      let nh = initialHeight + (moveEvent.clientY - startY) * (handle.includes('n') ? -1 : 1);
      updateItem(id, { 
        width: Math.max(20, nw), height: Math.max(20, nh), 
        x: handle.includes('w') ? initialX - (Math.max(20, nw) - initialWidth) : initialX, 
        y: handle.includes('n') ? initialY - (Math.max(20, nh) - initialHeight) : initialY 
      });
    };
    const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const selectedItem = currentItems.find(i => i.id === selectedId);

  return (
    <div className="flex flex-col h-full bg-[#151515] overflow-hidden select-none">
      <nav className="h-14 border-b border-stone-800 bg-[#1a1a1a] flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Plan au sol pour :</div>
          <select 
            value={activeShotId}
            onChange={(e) => { setActiveShotId(e.target.value); setSelectedId(null); }}
            className="bg-[#252525] border border-stone-700 text-amber-500 text-[10px] font-bold uppercase py-2 px-4 rounded outline-none min-w-[300px]"
          >
            {shots.map((s, idx) => <option key={s.id} value={s.id}>PLAN {idx + 1} - {s.values['lieu_moment'] || 'NON IDENTIFIÉ'}</option>)}
          </select>
        </div>
      </nav>

      <div className="flex flex-grow overflow-hidden">
        <aside className="w-16 border-r border-stone-800 flex flex-col items-center py-6 gap-6 bg-[#1a1a1a] shrink-0 z-30">
          <button onClick={() => addItem('camera')} className="w-10 h-10 rounded border border-stone-700 hover:bg-stone-800 flex items-center justify-center transition-all" title="Caméra">🎥</button>
          <button onClick={() => addItem('actor')} className="w-10 h-10 rounded border border-stone-700 hover:bg-stone-800 flex items-center justify-center transition-all" title="Acteur">👤</button>
          <button onClick={() => addItem('light')} className="w-10 h-10 rounded border border-stone-700 hover:bg-stone-800 flex items-center justify-center transition-all" title="Lumière">💡</button>
          <button onClick={() => addItem('dolly')} className="w-10 h-10 rounded border border-stone-700 hover:bg-stone-800 flex items-center justify-center transition-all" title="Rails / Dolly">🛤️</button>
          <div className="w-8 h-px bg-stone-800" />
          <button onClick={() => addItem('prop', 'square')} className="w-10 h-10 rounded border border-stone-700 hover:bg-stone-800 flex items-center justify-center transition-all" title="Objet Carré">⬛</button>
          <button onClick={() => addItem('prop', 'circle')} className="w-10 h-10 rounded border border-stone-700 hover:bg-stone-800 flex items-center justify-center transition-all" title="Objet Rond">⚪</button>
          <button onClick={() => addItem('arrow')} className="w-10 h-10 rounded border border-stone-700 hover:bg-stone-800 flex items-center justify-center transition-all" title="Flèche">↗️</button>
          <button onClick={() => addItem('text')} className="w-10 h-10 rounded border border-stone-700 hover:bg-stone-800 flex items-center justify-center transition-all font-bold text-stone-500" title="Texte">A</button>
        </aside>

        <main ref={canvasRef} className="flex-grow relative overflow-hidden bg-[#111]" style={{ backgroundImage: 'radial-gradient(circle, #222 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          {currentItems.map(item => {
            const isSelected = selectedId === item.id;
            return (
              <div
                key={item.id}
                onMouseDown={(e) => handleMouseDown(item.id, e)}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedId(item.id); setContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id }); }}
                style={{ left: item.x, top: item.y, width: item.width, height: item.height, transform: `rotate(${item.rotation}deg)`, zIndex: isSelected ? 100 : 10 }}
                className={`absolute flex items-center justify-center cursor-move transition-all ${isSelected ? 'ring-1 ring-amber-500/50' : ''}`}
              >
                <BlueprintShape item={item} />
                {isSelected && (
                  <>
                    <div onMouseDown={(e) => handleResize(item.id, 'nw', e)} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-amber-600 cursor-nw-resize rounded-full z-50" />
                    <div onMouseDown={(e) => handleResize(item.id, 'ne', e)} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-amber-600 cursor-ne-resize rounded-full z-50" />
                    <div onMouseDown={(e) => handleResize(item.id, 'sw', e)} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-amber-600 cursor-sw-resize rounded-full z-50" />
                    <div onMouseDown={(e) => handleResize(item.id, 'se', e)} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-amber-600 cursor-se-resize rounded-full z-50" />
                  </>
                )}
              </div>
            );
          })}
        </main>

        <aside className="w-72 border-l border-stone-800 flex flex-col shrink-0 z-40 p-6 space-y-8 bg-[#1e1e1e] overflow-y-auto custom-scrollbar">
          <div className="p-2 bg-[#252525] border border-stone-800 text-center rounded">
            <h3 className="text-[9px] font-bold uppercase tracking-[0.4em] text-stone-500">Propriétés</h3>
          </div>

          {selectedItem ? (
            <div className="space-y-6">
              <div className="space-y-4">
                 <h4 className="text-[9px] font-bold uppercase tracking-widest text-stone-600">Couleur</h4>
                 <div className="grid grid-cols-5 gap-2">
                   {PRESET_COLORS.map(c => (
                     <button key={c} onClick={() => updateItem(selectedId!, { color: c })} className={`w-full aspect-square rounded-full border-2 ${(selectedItem.color === c) ? 'border-amber-500 scale-110 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                   ))}
                 </div>
              </div>

              <div className="space-y-4 bg-stone-900/50 p-4 rounded-lg">
                <div className="flex justify-between text-[8px] font-bold text-stone-500 uppercase"><span>Rotation</span><span className="text-amber-500">{selectedItem.rotation || 0}°</span></div>
                <input type="range" min="0" max="360" value={selectedItem.rotation || 0} onChange={(e) => updateItem(selectedId!, { rotation: parseInt(e.target.value) })} className="w-full accent-amber-500" />
                
                {(selectedItem.type === 'camera' || selectedItem.type === 'light') && (
                  <>
                    <div className="flex justify-between text-[8px] font-bold text-stone-500 uppercase"><span>Ouverture (FOV)</span><span className="text-amber-500">{selectedItem.fov}°</span></div>
                    <input type="range" min="10" max="120" value={selectedItem.fov || 40} onChange={(e) => updateItem(selectedId!, { fov: parseInt(e.target.value) })} className="w-full accent-amber-500" />
                    <div className="flex justify-between text-[8px] font-bold text-stone-500 uppercase"><span>Portée</span><span className="text-amber-500">{selectedItem.range}px</span></div>
                    <input type="range" min="20" max="500" value={selectedItem.range || 120} onChange={(e) => updateItem(selectedId!, { range: parseInt(e.target.value) })} className="w-full accent-amber-500" />
                  </>
                )}

                {selectedItem.type === 'arrow' && (
                  <>
                    <div className="flex justify-between text-[8px] font-bold text-stone-500 uppercase"><span>Courbure</span><span className="text-amber-500">{selectedItem.curvature}</span></div>
                    <input type="range" min="-100" max="100" value={selectedItem.curvature || 0} onChange={(e) => updateItem(selectedId!, { curvature: parseInt(e.target.value) })} className="w-full accent-amber-500" />
                  </>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-bold uppercase tracking-widest text-stone-600">Étiquette</label>
                <input value={selectedItem.label || ""} onChange={(e) => updateItem(selectedId!, { label: e.target.value.toUpperCase() })} className="w-full bg-[#111] border border-stone-800 p-2 text-[10px] text-stone-300 rounded outline-none" />
              </div>

              <button onClick={() => { updateCurrentItems(currentItems.filter(i => i.id !== selectedId)); setSelectedId(null); }} className="w-full py-3 bg-red-900/10 border border-red-900/50 text-red-500 text-[9px] font-bold uppercase tracking-widest hover:bg-red-900/20">Supprimer l'élément</button>
            </div>
          ) : (
            <div className="pt-20 text-center opacity-20 text-[9px] font-bold uppercase tracking-widest px-4">Sélectionnez un élément.</div>
          )}
        </aside>
      </div>

      {contextMenu && (
        <div className="fixed z-[200] bg-[#252525] border border-stone-700 shadow-2xl py-1 rounded min-w-[200px]" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button onClick={() => { updateCurrentItems(currentItems.filter(i => i.id !== contextMenu.itemId)); setContextMenu(null); setSelectedId(null); }} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-red-500 hover:bg-red-900 hover:text-white transition-colors">🗑️ Supprimer</button>
        </div>
      )}
    </div>
  );
};