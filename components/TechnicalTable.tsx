
import React, { useState, useRef, useEffect } from 'react';
import { Project, TechnicalShot, TechnicalColumn } from '../types';

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

const DEFAULT_TECHNICAL_COLUMNS: TechnicalColumn[] = [
  { id: 'seq_plan', label: 'SEQ/PLAN' },
  { id: 'duree', label: 'DURÉE' },
  { id: 'lieu_moment', label: 'LIEU ET MOMENT' },
  { id: 'action', label: 'ACTION' },
  { id: 'image', label: 'IMAGE' },
  { id: 'audio', label: 'AUDIO' },
  { id: 'liaison', label: 'LIAISON' }
];

export const TechnicalTable: React.FC<Props> = ({ project, onUpdate }) => {
  const [showSequencer, setShowSequencer] = useState(true);
  const [focusedCell, setFocusedCell] = useState<{ rowIndex: number; colIndex: number }>({ rowIndex: 0, colIndex: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, rowIndex: number } | null>(null);
  
  const columns = project.technicalColumns || DEFAULT_TECHNICAL_COLUMNS;
  const shots = project.technicalBreakdown || [];

  const tableRef = useRef<HTMLTableElement>(null);

  // Synchronize DOM focus with selected cell
  useEffect(() => {
    if (!isEditing && tableRef.current) {
      const cell = tableRef.current.querySelector(
        `tbody tr:nth-child(${focusedCell.rowIndex + 1}) td:nth-child(${focusedCell.colIndex + 2})`
      ) as HTMLElement;
      if (cell) {
        cell.focus();
      }
    }
  }, [focusedCell, isEditing, shots.length]);

  const updateShotValue = (shotId: string, colId: string, value: string, finalize: boolean = false) => {
    let finalValue = value;
    
    // Auto-format only when finalizing (Enter or Blur)
    if (finalize && colId === 'duree' && value) {
      const numeric = value.replace(/[^0-9.]/g, '');
      if (numeric) {
        finalValue = `${numeric} sec`;
      }
    }

    onUpdate({
      technicalBreakdown: shots.map(s => s.id === shotId ? {
        ...s,
        values: { ...s.values, [colId]: finalValue }
      } : s)
    });
  };

  const addShot = () => {
    const newShot: TechnicalShot = {
      id: crypto.randomUUID(),
      values: columns.reduce((acc, col) => ({ ...acc, [col.id]: "" }), {})
    };
    onUpdate({ technicalBreakdown: [...shots, newShot] });
    setFocusedCell({ rowIndex: shots.length, colIndex: 0 });
  };

  const addShotAt = (index: number) => {
    const newShot: TechnicalShot = {
      id: crypto.randomUUID(),
      values: columns.reduce((acc, col) => ({ ...acc, [col.id]: "" }), {})
    };
    const newShots = [...shots];
    newShots.splice(index + 1, 0, newShot);
    onUpdate({ technicalBreakdown: newShots });
    setFocusedCell({ rowIndex: index + 1, colIndex: 0 });
    setContextMenu(null);
  };

  const removeShotAt = (index: number) => {
    const newShots = [...shots];
    newShots.splice(index, 1);
    onUpdate({ technicalBreakdown: newShots });
    const newRowIndex = Math.max(0, Math.min(index, newShots.length - 1));
    setFocusedCell(prev => ({ ...prev, rowIndex: newRowIndex }));
    setContextMenu(null);
  };

  const addColumn = () => {
    const newCol: TechnicalColumn = { id: crypto.randomUUID(), label: 'NOUVELLE' };
    onUpdate({ technicalColumns: [...columns, newCol] });
  };

  const removeColumn = (id: string) => {
    onUpdate({ technicalColumns: columns.filter(c => c.id !== id) });
  };

  const updateColumnLabel = (id: string, label: string) => {
    onUpdate({
      technicalColumns: columns.map(c => c.id === id ? { ...c, label: label.toUpperCase() } : c)
    });
  };

  const resetToDefault = () => {
    if (confirm("Réinitialiser les colonnes par défaut ?")) {
      onUpdate({ technicalColumns: [...DEFAULT_TECHNICAL_COLUMNS] });
    }
  };

  const handleTableKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) return;

    const { rowIndex, colIndex } = focusedCell;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (rowIndex > 0) setFocusedCell({ ...focusedCell, rowIndex: rowIndex - 1 });
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (rowIndex < shots.length - 1) setFocusedCell({ ...focusedCell, rowIndex: rowIndex + 1 });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (colIndex > 0) setFocusedCell({ ...focusedCell, colIndex: colIndex - 1 });
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (colIndex < columns.length - 1) setFocusedCell({ ...focusedCell, colIndex: colIndex + 1 });
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (colIndex > 0) setFocusedCell({ ...focusedCell, colIndex: colIndex - 1 });
          else if (rowIndex > 0) setFocusedCell({ rowIndex: rowIndex - 1, colIndex: columns.length - 1 });
        } else {
          if (colIndex < columns.length - 1) setFocusedCell({ ...focusedCell, colIndex: colIndex + 1 });
          else if (rowIndex < shots.length - 1) setFocusedCell({ rowIndex: rowIndex + 1, colIndex: 0 });
        }
        break;
      case 'Enter':
        e.preventDefault();
        setIsEditing(true);
        break;
      case 'Backspace':
      case 'Delete':
        e.preventDefault();
        const s = shots[rowIndex];
        const c = columns[colIndex];
        if (s && c) updateShotValue(s.id, c.id, "");
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          setIsEditing(true);
        }
        break;
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent, shotId: string, colId: string, currentVal: string) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      updateShotValue(shotId, colId, currentVal, true); // Finalize with formatting
      setIsEditing(false);
      
      if (colId === 'seq_plan' && !currentVal.includes('/')) {
        updateShotValue(shotId, colId, currentVal + '/', false);
        setIsEditing(true);
      } else if (focusedCell.colIndex < columns.length - 1) {
        setFocusedCell({ ...focusedCell, colIndex: focusedCell.colIndex + 1 });
      } else if (focusedCell.rowIndex < shots.length - 1) {
        setFocusedCell({ rowIndex: focusedCell.rowIndex + 1, colIndex: 0 });
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      updateShotValue(shotId, colId, currentVal, true);
      setIsEditing(false);
    }
  };

  const handleSequencerClick = (text: string) => {
    const shot = shots[focusedCell.rowIndex];
    const col = columns[focusedCell.colIndex];
    if (shot && col) {
      updateShotValue(shot.id, col.id, text.trim().toUpperCase());
    }
  };

  const importFromSequencer = () => {
    const lines = project.sequencier.split('\n').filter(l => l.trim());
    const newShots: TechnicalShot[] = [];
    let currentHeader = "";
    lines.forEach(line => {
      const isHeader = line.toUpperCase().match(/^(\d+\.\s*)?(INT\.|EXT\.)/i);
      if (isHeader) {
        currentHeader = line.trim().toUpperCase();
      } else if (currentHeader) {
        newShots.push({
          id: crypto.randomUUID(),
          values: columns.reduce((acc, col) => ({
            ...acc,
            [col.id]: col.id === 'lieu_moment' ? currentHeader : (col.id === 'action' ? line.trim() : "")
          }), {})
        });
      }
    });
    if (newShots.length > 0) onUpdate({ technicalBreakdown: [...shots, ...newShots] });
  };

  const onContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setFocusedCell(prev => ({ ...prev, rowIndex: index }));
    setContextMenu({ x: e.clientX, y: e.clientY, rowIndex: index });
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  return (
    <div className="flex h-full overflow-hidden bg-[#151515]">
      {showSequencer && (
        <aside className="w-80 border-r border-stone-800 flex flex-col bg-[#1e1e1e] shrink-0 animate-in slide-in-from-left duration-300">
          <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-[#252525]">
            <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-500">Séquencier Source</h3>
            <button onClick={() => setShowSequencer(false)} className="text-stone-600 hover:text-white transition-colors">←</button>
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar bg-[#111]">
            {project.sequencier.split('\n').filter(l => l.trim()).map((line, idx) => {
              const isHeader = line.toUpperCase().match(/^(\d+\.\s*)?(INT\.|EXT\.)/i);
              return (
                <div 
                  key={idx}
                  onClick={() => handleSequencerClick(line)}
                  className={`p-3 rounded text-[9px] cursor-pointer transition-all border ${
                    isHeader 
                      ? 'bg-amber-900/10 border-amber-900/30 text-amber-500 font-bold uppercase' 
                      : 'bg-[#1a1a1a] border-stone-800 text-stone-400 hover:bg-[#252525] hover:border-stone-700'
                  }`}
                >
                  {line}
                </div>
              );
            })}
          </div>
        </aside>
      )}

      <main className="flex-grow flex flex-col overflow-hidden relative">
        {!showSequencer && (
          <button onClick={() => setShowSequencer(true)} className="absolute left-4 top-4 z-20 w-8 h-8 rounded-full bg-stone-800 text-stone-400 border border-stone-700 flex items-center justify-center hover:text-white transition-all shadow-xl">→</button>
        )}

        <div className="p-6 bg-[#1e1e1e] border-b border-stone-800 flex justify-between items-end shrink-0">
          <div className="space-y-1">
            <h2 className="text-[11px] font-bold uppercase text-stone-500 tracking-[0.4em]">Découpage Technique</h2>
            <p className="text-[8px] text-stone-600 uppercase tracking-widest italic">Navigation Flèches • Enter pour éditer • Durée auto-formatée (X sec).</p>
          </div>
          <div className="flex gap-2">
            <button onClick={importFromSequencer} className="px-4 py-2 border border-stone-700 hover:bg-stone-800 text-stone-400 rounded text-[9px] font-bold uppercase tracking-widest transition-all">Importer Séquencier</button>
            <button onClick={addColumn} className="px-4 py-2 border border-stone-700 hover:bg-stone-800 text-stone-400 rounded text-[9px] font-bold uppercase tracking-widest transition-all">Ajouter Colonne</button>
            <button onClick={resetToDefault} className="px-4 py-2 border border-stone-700 hover:bg-stone-800 text-stone-400 rounded text-[9px] font-bold uppercase tracking-widest transition-all">Entêtes Défaut</button>
            <button onClick={addShot} className="px-6 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded text-[9px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95">+ Nouveau Plan</button>
          </div>
        </div>

        <div className="flex-grow overflow-auto custom-scrollbar bg-[#151515]">
          <table 
            ref={tableRef} 
            className="w-full border-collapse table-fixed min-w-[1200px]"
            onKeyDown={handleTableKeyDown}
          >
            <thead className="sticky top-0 z-10 bg-[#1e1e1e] shadow-md border-b border-stone-800">
              <tr>
                <th className="w-16 border-r border-stone-800 bg-[#252525]"></th>
                {columns.map(col => (
                  <th key={col.id} className="group relative border-r border-stone-800 p-0 text-center">
                    <input 
                      value={col.label}
                      onChange={(e) => updateColumnLabel(col.id, e.target.value)}
                      className="w-full bg-transparent border-none text-[9px] font-bold text-stone-500 uppercase tracking-[0.2em] p-4 text-center focus:bg-[#2a2a2a] outline-none"
                    />
                    <button onClick={() => removeColumn(col.id)} className="absolute right-1 top-1 text-[10px] text-stone-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  </th>
                ))}
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {shots.map((shot, rIdx) => (
                <tr key={shot.id} className="border-b border-stone-800 group transition-colors">
                  <td 
                    className={`text-center text-[10px] font-mono bg-[#1a1a1a] border-r border-stone-800 font-bold cursor-context-menu transition-colors ${focusedCell.rowIndex === rIdx ? 'text-amber-500 bg-amber-900/10' : 'text-stone-700'}`}
                    onContextMenu={(e) => onContextMenu(e, rIdx)}
                    onClick={() => setFocusedCell(prev => ({ ...prev, rowIndex: rIdx }))}
                  >
                    {rIdx + 1}
                  </td>
                  {columns.map((col, cIdx) => {
                    const isCellFocused = focusedCell.rowIndex === rIdx && focusedCell.colIndex === cIdx;
                    const isDureeCol = col.id === 'duree';
                    return (
                      <td 
                        key={col.id} 
                        tabIndex={0}
                        onFocus={() => { if (!isEditing) setFocusedCell({ rowIndex: rIdx, colIndex: cIdx }); }}
                        onClick={() => { setFocusedCell({ rowIndex: rIdx, colIndex: cIdx }); setIsEditing(true); }}
                        className={`p-0 border-r border-stone-800 relative outline-none min-h-[48px] ${
                          isCellFocused ? 'ring-2 ring-inset ring-amber-600 bg-amber-900/5' : ''
                        }`}
                      >
                        {isCellFocused && isEditing ? (
                          <textarea 
                            autoFocus
                            value={shot.values[col.id] || ""}
                            onChange={e => updateShotValue(shot.id, col.id, e.target.value, false)}
                            onKeyDown={e => handleInputKeyDown(e, shot.id, col.id, shot.values[col.id] || "")}
                            onBlur={() => {
                              updateShotValue(shot.id, col.id, shot.values[col.id] || "", true);
                              setIsEditing(false);
                            }}
                            className={`w-full h-full min-h-[48px] bg-[#252525] border-none focus:ring-0 text-[10px] text-stone-100 p-3 leading-relaxed resize-none overflow-y-auto ${isDureeCol ? 'text-center font-bold text-amber-500' : ''}`}
                          />
                        ) : (
                          <div className={`w-full min-h-[48px] p-3 text-[10px] leading-relaxed break-words ${isDureeCol ? 'text-center font-bold text-amber-500' : ''} ${shot.values[col.id] ? 'text-stone-300' : 'text-stone-700 italic'}`}>
                            {shot.values[col.id] || "—"}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center">
                    <button onClick={() => removeShotAt(rIdx)} className="text-stone-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xl">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {contextMenu && (
          <div 
            className="fixed z-[100] bg-[#252525] border border-stone-700 rounded shadow-2xl py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button onClick={() => addShotAt(contextMenu.rowIndex)} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-stone-300 hover:bg-amber-700 hover:text-white flex items-center gap-3">
              <span className="text-sm">➕</span> Ajouter dessous
            </button>
            <div className="h-px bg-stone-700 my-1 mx-2"></div>
            <button onClick={() => removeShotAt(contextMenu.rowIndex)} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-900 hover:text-white flex items-center gap-3">
              <span className="text-sm">🗑️</span> Supprimer ce plan
            </button>
          </div>
        )}

        <footer className="h-10 bg-[#1a1a1a] border-t border-stone-800 px-6 flex items-center justify-between text-[8px] uppercase font-bold tracking-widest text-stone-600 italic shrink-0">
          <div className="flex gap-6">
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Flèches / Tab pour naviguer</span>
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Clic-droit sur n° pour options</span>
          </div>
          <div>{shots.length} Plans découpés</div>
        </footer>
      </main>
    </div>
  );
};
