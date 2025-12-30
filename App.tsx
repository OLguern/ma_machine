import React, { useState, useEffect, useRef } from 'react';
import { Project, ModuleType, IntentionQuestion, ExportSettings } from './types.ts';
import { APP_STORAGE_KEY } from './constants.tsx';
import { MasterGate } from './components/MasterGate.tsx';
import saveAs from 'file-saver';

// Modules chargés à la demande (Matérialisation)
const TechnicalTable = React.lazy(() => import('./components/TechnicalTable.tsx').then(m => ({ default: m.TechnicalTable })));
const CharacterManager = React.lazy(() => import('./components/CharacterManager.tsx').then(m => ({ default: m.CharacterManager })));
const IntentionModule = React.lazy(() => import('./components/IntentionModule.tsx').then(m => ({ default: m.IntentionModule })));
const PitchModule = React.lazy(() => import('./components/PitchModule.tsx').then(m => ({ default: m.PitchModule })));
const SynopsisModule = React.lazy(() => import('./components/SynopsisModule.tsx').then(m => ({ default: m.SynopsisModule })));
const ContextModule = React.lazy(() => import('./components/ContextModule.tsx').then(m => ({ default: m.ContextModule })));
const SequencerModule = React.lazy(() => import('./components/SequencerModule.tsx').then(m => ({ default: m.SequencerModule })));
const ScriptEditor = React.lazy(() => import('./components/ScriptEditor.tsx').then(m => ({ default: m.ScriptEditor })));
const MetadataModule = React.lazy(() => import('./components/MetadataModule.tsx').then(m => ({ default: m.MetadataModule })));
const StoryboardModule = React.lazy(() => import('./components/StoryboardModule.tsx').then(m => ({ default: m.StoryboardModule })));
const FloorPlanCanvas = React.lazy(() => import('./components/FloorPlanCanvas.tsx').then(m => ({ default: m.FloorPlanCanvas })));
const HelpModal = React.lazy(() => import('./components/HelpModal.tsx').then(m => ({ default: m.HelpModal })));
const PasswordGate = React.lazy(() => import('./components/PasswordGate.tsx').then(m => ({ default: m.PasswordGate })));

const VERSION = "2.1.3";
const getUUID = () => crypto.randomUUID();

const App: React.FC = () => {
  const [isMasterAuthorized, setIsMasterAuthorized] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.Script);
  const [project, setProject] = useState<Project | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    version: "1.0",
    includeIntention: true, includePitch: true, includeSynopsis: true,
    includeCharacters: true, includeSequencer: true, includeScript: true,
    includeStoryboard: true, includeTechnical: true, includeFloorPlan: true,
    fontFamily: 'Courier Prime', fontSize: 12, titleColor: '#000000', titleFontSize: 16
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const bootstrap = () => {
      try {
        const currentRaw = localStorage.getItem(APP_STORAGE_KEY);
        if (currentRaw) {
          const p = JSON.parse(currentRaw);
          setProject(p);
          setIsUnlocked(!p.password);
        } else {
          createNewProject();
        }
      } catch (e) { createNewProject(); }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (project) {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(project));
    }
  }, [project]);

  const handleMasterAuthorized = () => {
    setIsBooting(true);
    setTimeout(() => {
      setIsMasterAuthorized(true);
      setIsBooting(false);
    }, 1200);
  };

  const createNewProject = () => {
    const newProj: Project = {
      id: getUUID(), title: "NOUVEAU MANUSCRIT",
      meta: { author: "", address: "", city: "", email: "", phone: "", productionType: "Drame", footageType: "Long-métrage", duration: 90, version: VERSION },
      noteIntention: "", intentionQuestions: [], intentionAnswers: {}, pitch: "", pitchQuestions: [], pitchAnswers: {}, synopsis: "", synopsisQuestions: [], synopsisAnswers: {},
      sceneContext: { lumieres: ["INT.", "EXT."], lieux: ["STUDIO"], temps: ["JOUR"], transitions: ["COUPE"], plans: ["GP"], eclairages: ["NATL"] },
      writingPreferences: { autoHeaderSpacing: true, autoBlockSpacing: true }, sequencier: "", script: "", characters: [], technicalColumns: [], technicalBreakdown: [], floorPlans: {}, storyboard: [], lastModified: Date.now()
    };
    setProject(newProj);
    setIsUnlocked(true);
  };

  const handleSaveMac = () => {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    saveAs(blob, `${(project.title || 'Manuscrit').replace(/[^a-z0-9]/gi, '_')}.mac`);
  };

  const handleImportMac = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const p = JSON.parse(event.target?.result as string);
        setProject(p);
        setIsUnlocked(!p.password);
      } catch (err) { alert("Fichier .MAC invalide."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (!isMasterAuthorized) {
    if (isBooting) {
      return (
        <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center p-6">
           <div className="w-16 h-1 w-full max-w-[200px] bg-stone-900 rounded overflow-hidden mb-4">
              <div className="h-full bg-amber-600 animate-[loading_1.2s_ease-in-out]"></div>
           </div>
           <div className="text-[8px] text-amber-600 font-bold uppercase tracking-[0.4em]">Matérialisation_Studio...</div>
           <style>{`@keyframes loading { from { width: 0%; } to { width: 100%; } }`}</style>
        </div>
      );
    }
    return <MasterGate onAuthorized={handleMasterAuthorized} />;
  }

  if (!project) return null;
  
  const navItems = [
    { type: ModuleType.ProjectInfo, label: "Fiche", icon: "🏢" },
    { type: ModuleType.Intention, label: "Intention", icon: "📝" },
    { type: ModuleType.Pitch, label: "Pitch", icon: "⚡" },
    { type: ModuleType.Synopsis, label: "Synopsis", icon: "📖" },
    { type: ModuleType.Context, label: "Contexte Scène", icon: "⚙️" },
    { type: ModuleType.Characters, label: "Personnages", icon: "👥" },
    { type: ModuleType.Sequencer, label: "Séquencier", icon: "🎞️" },
    { type: ModuleType.Script, label: "Scenario", icon: "📽️" },
    { type: ModuleType.Storyboard, label: "Storyboard", icon: "🎨" },
    { type: ModuleType.Technical, label: "Découpage", icon: "📊" },
    { type: ModuleType.FloorPlan, label: "Plan Sol", icon: "📐" },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-300 overflow-hidden font-sans border-[1px] border-slate-800">
      <header className="h-14 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-sky-600 rounded-sm flex items-center justify-center font-bold text-white text-lg">M</div>
          <h1 className="font-bold text-[9px] tracking-[0.5em] uppercase text-sky-400">{project.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={handleImportMac} accept=".mac,.json" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-[#1e293b] border border-slate-700 text-slate-400 rounded text-[8px] font-bold uppercase tracking-widest transition-all hover:bg-slate-800">Charger .MAC</button>
          <button onClick={handleSaveMac} className="px-4 py-1.5 bg-sky-900/40 border border-sky-800 text-sky-300 rounded text-[8px] font-bold uppercase tracking-widest transition-colors hover:bg-sky-900/60">Sauver .MAC</button>
          <button onClick={() => setIsHelpOpen(true)} className="w-8 h-8 flex items-center justify-center bg-[#1e293b] border border-slate-700 text-slate-500 rounded hover:text-white transition-colors">?</button>
        </div>
      </header>

      <nav className="h-10 bg-[#020617] border-b border-slate-800 flex items-center px-4 gap-1 shrink-0 overflow-x-auto no-scrollbar">
        {navItems.map(item => (
          <button
            key={item.type}
            onClick={() => setActiveModule(item.type)}
            className={`h-full flex items-center gap-2 px-4 text-[8px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
              activeModule === item.type ? 'text-sky-100 border-sky-400 bg-sky-900/10' : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <span>{item.icon}</span> <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-grow overflow-hidden relative bg-[#020617]">
        <React.Suspense fallback={<div className="h-full flex items-center justify-center text-[10px] uppercase tracking-widest animate-pulse">Chargement Module...</div>}>
          {activeModule === ModuleType.ProjectInfo && <MetadataModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} onNewProject={createNewProject} />}
          {activeModule === ModuleType.Intention && <IntentionModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
          {activeModule === ModuleType.Pitch && <PitchModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
          {activeModule === ModuleType.Synopsis && <SynopsisModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
          {activeModule === ModuleType.Context && <ContextModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
          {activeModule === ModuleType.Characters && <div className="h-full p-8"><CharacterManager characters={project.characters} onUpdate={(chars) => setProject(p => p ? {...p, characters: chars} : null)} /></div>}
          {activeModule === ModuleType.Sequencer && <SequencerModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
          {activeModule === ModuleType.Script && <div className="h-full overflow-hidden"><ScriptEditor project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} /></div>}
          {activeModule === ModuleType.Technical && <div className="h-full overflow-hidden"><TechnicalTable project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} /></div>}
          {activeModule === ModuleType.Storyboard && <div className="h-full overflow-hidden"><StoryboardModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} /></div>}
          {activeModule === ModuleType.FloorPlan && (
            <div className="h-full overflow-hidden">
              <FloorPlanCanvas shots={project.technicalBreakdown} columns={project.technicalColumns} floorPlans={project.floorPlans} onUpdate={(fps) => setProject(p => p ? {...p, floorPlans: fps} : null)} />
            </div>
          )}
        </React.Suspense>
      </main>

      <footer className="h-8 bg-[#0f172a] border-t border-slate-800 flex items-center justify-between px-6 shrink-0 text-[7px] font-bold uppercase text-slate-600 tracking-[0.5em]">
          <div>SIGNAL_STABLE</div>
          <div className="font-mono italic">LA MACHINE À ÉCRIRE OS v{VERSION}</div>
      </footer>
      <React.Suspense fallback={null}>
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </React.Suspense>
    </div>
  );
};

export default App;