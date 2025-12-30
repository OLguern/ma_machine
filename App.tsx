import React, { useState, useEffect } from 'react';
import { ModuleType, Project } from './types.ts';
import { MasterGate } from './components/MasterGate.tsx';
import { MetadataModule } from './components/MetadataModule.tsx';
import { ScriptEditor } from './components/ScriptEditor.tsx';
import { CharacterManager } from './components/CharacterManager.tsx';
import { IntentionModule } from './components/IntentionModule.tsx';
import { PitchModule } from './components/PitchModule.tsx';
import { SynopsisModule } from './components/SynopsisModule.tsx';
import { SequencerModule } from './components/SequencerModule.tsx';
import { StoryboardModule } from './components/StoryboardModule.tsx';
import { TechnicalTable } from './components/TechnicalTable.tsx';
import { FloorPlanCanvas } from './components/FloorPlanCanvas.tsx';
import { generateProductionBook } from './services/docxExportService.ts';
import saveAs from 'file-saver';

const STORAGE_KEY = 'machine_a_ecrire_v2_session';

const DEFAULT_PROJECT: Project = {
  id: '1',
  title: 'NOUVEAU RÉCIT',
  meta: { author: '', version: '1.0', productionType: 'Long-métrage', footageType: 'Fiction', duration: 90 },
  noteIntention: '', pitch: '', synopsis: '', sequencier: '', script: '',
  characters: [], floorPlans: {}, storyboard: [], technicalBreakdown: [],
  lastModified: Date.now()
};

const App: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.Scenario);
  const [project, setProject] = useState<Project>(DEFAULT_PROJECT);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setProject(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    }
  }, [project, isAuthorized]);

  const updateProject = (updates: Partial<Project>) => {
    setProject(prev => ({ ...prev, ...updates, lastModified: Date.now() }));
  };

  const handleExportMac = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    saveAs(blob, `${project.title.replace(/\s+/g, '_')}.mac`);
  };

  const handleImportMac = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mac';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          setProject(imported);
        } catch (err) { alert("Fichier .MAC invalide."); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportDocx = async () => {
    setIsExporting(true);
    try {
      const blob = await generateProductionBook(project, {
        version: project.meta.version,
        includeIntention: true, includePitch: true, includeSynopsis: true,
        includeCharacters: true, includeSequencer: true, includeScript: true,
        includeStoryboard: true, includeTechnical: true, includeFloorPlan: true,
        fontFamily: 'Courier Prime', fontSize: 12, titleColor: '#000000', titleFontSize: 16
      });
      saveAs(blob, `${project.title}.docx`);
    } catch (e) { alert("Erreur d'exportation DOCX"); }
    finally { setIsExporting(false); }
  };

  if (!isAuthorized) return <MasterGate onAuthorized={() => setIsAuthorized(true)} />;

  const renderModule = () => {
    switch (activeModule) {
      case ModuleType.Projet: return <MetadataModule project={project} onUpdate={updateProject} onNewProject={() => setProject(DEFAULT_PROJECT)} />;
      case ModuleType.Scenario: return <ScriptEditor project={project} onUpdate={updateProject} />;
      case ModuleType.Personnages: return <CharacterManager characters={project.characters} onUpdate={(chars) => updateProject({ characters: chars })} />;
      case ModuleType.Intention: return <IntentionModule project={project} onUpdate={updateProject} />;
      case ModuleType.Pitch: return <PitchModule project={project} onUpdate={updateProject} />;
      case ModuleType.Synopsis: return <SynopsisModule project={project} onUpdate={updateProject} />;
      case ModuleType.Sequencier: return <SequencerModule project={project} onUpdate={updateProject} />;
      case ModuleType.Storyboard: return <StoryboardModule project={project} onUpdate={updateProject} />;
      case ModuleType.Technique: return <TechnicalTable project={project} onUpdate={updateProject} />;
      case ModuleType.PlanSol: return <FloorPlanCanvas shots={project.technicalBreakdown} columns={[]} floorPlans={project.floorPlans} onUpdate={(fps) => updateProject({ floorPlans: fps })} />;
      default: return <ScriptEditor project={project} onUpdate={updateProject} />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#020617] text-slate-200">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-[#0f172a] px-6 z-50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 flex items-center justify-center bg-amber-600 rounded text-white font-black text-xl">M</div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.3em]">Machine à Écrire</h1>
            <p className="text-[8px] font-bold text-slate-500 tracking-widest uppercase">Studio Carbone v2.1.3</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {Object.values(ModuleType).map((m) => (
            <button
              key={m}
              onClick={() => setActiveModule(m)}
              className={`px-3 py-2 text-[9px] font-bold uppercase tracking-widest transition-all rounded ${activeModule === m ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
           <button onClick={handleImportMac} className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-white border border-slate-800 rounded">Ouvrir .MAC</button>
           <button onClick={handleExportMac} className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-amber-500 border border-amber-900/30 rounded">Sauver .MAC</button>
           <button onClick={handleExportDocx} disabled={isExporting} className="px-4 py-2 bg-slate-100 text-slate-900 text-[10px] font-black uppercase rounded hover:bg-white transition-all">DOCX</button>
        </div>
      </header>

      <main className="flex-grow relative overflow-hidden bg-[#020617]">
        {renderModule()}
      </main>

      <footer className="h-8 border-t border-slate-800 bg-[#0f172a] flex items-center justify-between px-6 text-[8px] font-bold uppercase tracking-widest text-slate-500">
        <div className="flex gap-6">
          <span>PROJET : <span className="text-amber-500">{project.title}</span></span>
          <span>AUTEUR : {project.meta.author || 'NON IDENTIFIÉ'}</span>
        </div>
        <div className="flex gap-4">
          <span className="text-emerald-500 animate-pulse">● CANAL SÉCURISÉ</span>
          <span>v2.1.3-PRO</span>
        </div>
      </footer>
    </div>
  );
};

export default App;