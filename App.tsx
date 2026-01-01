
import React, { useState, useEffect, useRef } from 'react';
import { Project, ModuleType } from './types.ts';
import { APP_STORAGE_KEY } from './constants.tsx';
import { MasterGate } from './components/MasterGate.tsx';
import saveAs from 'file-saver';

// Modules
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

const VERSION = "2.1.3";
const getUUID = () => crypto.randomUUID();

const App: React.FC = () => {
  const [isMasterAuthorized, setIsMasterAuthorized] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.Script);
  const [project, setProject] = useState<Project | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentRaw = localStorage.getItem(APP_STORAGE_KEY);
    if (currentRaw) {
      try {
        setProject(JSON.parse(currentRaw));
      } catch (e) { createNewProject(); }
    } else {
      createNewProject();
    }
  }, []);

  useEffect(() => {
    if (project) {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(project));
    }
  }, [project]);

  const createNewProject = () => {
    const newProj: Project = {
      id: getUUID(), title: "NOUVEAU MANUSCRIT",
      meta: { author: "", address: "", city: "", email: "", phone: "", productionType: "Drame", footageType: "Long-métrage", duration: 90, version: VERSION },
      noteIntention: "", intentionQuestions: [], intentionAnswers: {}, pitch: "", pitchQuestions: [], pitchAnswers: {}, synopsis: "", synopsisQuestions: [], synopsisAnswers: {},
      sceneContext: { lumieres: ["INT.", "EXT."], lieux: ["STUDIO"], temps: ["JOUR"], transitions: ["COUPE"], plans: ["GP"], eclairages: ["NATL"] },
      writingPreferences: { autoHeaderSpacing: true, autoBlockSpacing: true }, sequencier: "", script: "", characters: [], technicalColumns: [], technicalBreakdown: [], floorPlans: {}, storyboard: [], lastModified: Date.now()
    };
    setProject(newProj);
  };

  const handleSaveMac = () => {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    saveAs(blob, `${project.title.replace(/[^a-z0-9]/gi, '_')}.mac`);
  };

  const handleImportMac = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setProject(JSON.parse(event.target?.result as string));
      } catch (err) { alert("Fichier invalide."); }
    };
    reader.readAsText(file);
  };

  if (!isMasterAuthorized) return <MasterGate onAuthorized={() => setIsMasterAuthorized(true)} />;
  if (!project) return null;

  const navItems = [
    { type: ModuleType.ProjectInfo, label: "Fiche", icon: "🏢" },
    { type: ModuleType.Intention, label: "Intention", icon: "📝" },
    { type: ModuleType.Pitch, label: "Pitch", icon: "⚡" },
    { type: ModuleType.Synopsis, label: "Synopsis", icon: "📖" },
    { type: ModuleType.Context, label: "Contexte", icon: "⚙️" },
    { type: ModuleType.Characters, label: "Personnages", icon: "👥" },
    { type: ModuleType.Sequencer, label: "Séquencier", icon: "🎞️" },
    { type: ModuleType.Script, label: "Scenario", icon: "📽️" },
    { type: ModuleType.Storyboard, label: "Storyboard", icon: "🎨" },
    { type: ModuleType.Technical, label: "Découpage", icon: "📊" },
    { type: ModuleType.FloorPlan, label: "Plan Sol", icon: "📐" },
  ];

  return (
    <div className="flex flex-col h-screen text-slate-300 bg-[#1a1a1a] font-sans overflow-hidden">
      <header className="h-14 bg-black border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-amber-600 rounded flex items-center justify-center font-bold text-black">M</div>
          <h1 className="font-bold text-[10px] tracking-[0.5em] uppercase text-amber-500">{project.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={handleImportMac} accept=".mac" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-white/5 border border-white/20 text-stone-200 rounded text-[9px] font-bold uppercase tracking-widest">Charger</button>
          <button onClick={handleSaveMac} className="px-4 py-1.5 bg-amber-900 border border-amber-600 text-amber-400 rounded text-[9px] font-bold uppercase tracking-widest">Sauver</button>
          <button onClick={() => setIsHelpOpen(true)} className="w-8 h-8 bg-white/5 border border-white/20 rounded">?</button>
        </div>
      </header>

      <nav className="h-10 bg-black/50 border-b border-white/10 flex items-center px-4 gap-1 shrink-0 overflow-x-auto">
        {navItems.map(item => (
          <button
            key={item.type}
            onClick={() => setActiveModule(item.type)}
            className={`h-full px-4 text-[9px] font-bold uppercase tracking-widest border-b-2 whitespace-nowrap ${
              activeModule === item.type ? 'text-amber-500 border-amber-500 bg-amber-500/10' : 'text-stone-500 border-transparent'
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>

      <main className="flex-grow overflow-hidden p-4 relative">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <img src="scene_theatre.png" alt="" className="w-full h-full object-cover" />
        </div>
        
        <div className="h-full relative z-10">
          <React.Suspense fallback={<div className="h-full flex items-center justify-center">Chargement...</div>}>
            {activeModule === ModuleType.ProjectInfo && <MetadataModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} onNewProject={createNewProject} />}
            {activeModule === ModuleType.Intention && <IntentionModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
            {activeModule === ModuleType.Pitch && <PitchModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
            {activeModule === ModuleType.Synopsis && <SynopsisModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
            {activeModule === ModuleType.Context && <ContextModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
            {activeModule === ModuleType.Characters && <CharacterManager characters={project.characters} onUpdate={(chars) => setProject(p => p ? {...p, characters: chars} : null)} />}
            {activeModule === ModuleType.Sequencer && <SequencerModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
            {activeModule === ModuleType.Script && <ScriptEditor project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
            {activeModule === ModuleType.Technical && <TechnicalTable project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
            {activeModule === ModuleType.Storyboard && <StoryboardModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
            {activeModule === ModuleType.FloorPlan && (
              <FloorPlanCanvas shots={project.technicalBreakdown} columns={project.technicalColumns} floorPlans={project.floorPlans} onUpdate={(fps) => setProject(p => p ? {...p, floorPlans: fps} : null)} />
            )}
          </React.Suspense>
        </div>
      </main>

      <footer className="h-8 bg-black border-t border-white/10 flex items-center justify-between px-6 shrink-0 text-[8px] font-bold uppercase text-stone-600 tracking-[0.5em]">
          <div>SIGNAL_ACTIF</div>
          <div>LA MACHINE À ÉCRIRE v{VERSION}</div>
      </footer>
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default App;
