import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Project, ModuleType } from './types.ts';
import { APP_STORAGE_KEY } from './constants.tsx';
import { MasterGate } from './components/MasterGate.tsx';
import saveAs from 'file-saver';

// Chargement différé des modules pour une performance optimale
const CharacterManager = lazy(() => import('./components/CharacterManager.tsx').then(m => ({ default: m.CharacterManager })));
const IntentionModule = lazy(() => import('./components/IntentionModule.tsx').then(m => ({ default: m.IntentionModule })));
const PitchModule = lazy(() => import('./components/PitchModule.tsx').then(m => ({ default: m.PitchModule })));
const SynopsisModule = lazy(() => import('./components/SynopsisModule.tsx').then(m => ({ default: m.SynopsisModule })));
const ContextModule = lazy(() => import('./components/ContextModule.tsx').then(m => ({ default: m.ContextModule })));
const SequencerModule = lazy(() => import('./components/SequencerModule.tsx').then(m => ({ default: m.SequencerModule })));
const ScriptEditor = lazy(() => import('./components/ScriptEditor.tsx').then(m => ({ default: m.ScriptEditor })));
const MetadataModule = lazy(() => import('./components/MetadataModule.tsx').then(m => ({ default: m.MetadataModule })));
const StoryboardModule = lazy(() => import('./components/StoryboardModule.tsx').then(m => ({ default: m.StoryboardModule })));
const TechnicalTable = lazy(() => import('./components/TechnicalTable.tsx').then(m => ({ default: m.TechnicalTable })));
const FloorPlanCanvas = lazy(() => import('./components/FloorPlanCanvas.tsx').then(m => ({ default: m.FloorPlanCanvas })));
const HelpModal = lazy(() => import('./components/HelpModal.tsx').then(m => ({ default: m.HelpModal })));

const VERSION = "2.1.6";

const App: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.Script);
  const [project, setProject] = useState<Project | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    // Tenter de charger le projet existant depuis la mémoire du navigateur
    const saved = localStorage.getItem(APP_STORAGE_KEY);
    if (saved) {
      try {
        setProject(JSON.parse(saved));
      } catch (e) {
        console.error("Erreur de lecture des données", e);
        createNewProject();
      }
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
      id: crypto.randomUUID(),
      title: "MON NOUVEAU RÉCIT",
      meta: { author: "", address: "", city: "", email: "", phone: "", productionType: "Drame", footageType: "Long-métrage", duration: 90, version: VERSION },
      noteIntention: "", intentionQuestions: [], intentionAnswers: {},
      pitch: "", pitchQuestions: [], pitchAnswers: {},
      synopsis: "", synopsisQuestions: [], synopsisAnswers: {},
      sceneContext: { lumieres: ["INT.", "EXT."], lieux: ["STUDIO"], temps: ["JOUR"], transitions: ["COUPE"], plans: ["GP"], eclairages: ["NATL"] },
      writingPreferences: { autoHeaderSpacing: true, autoBlockSpacing: true },
      sequencier: "", script: "", characters: [], technicalColumns: [], technicalBreakdown: [], floorPlans: {}, storyboard: [],
      lastModified: Date.now()
    };
    setProject(newProj);
  };

  const handleSaveMac = () => {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    // Note: saveAs vient de file-saver importé via importmap
    const fileName = `${(project.title || 'Manuscrit').replace(/[^a-z0-9]/gi, '_')}.mac`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
  };

  if (!isAuthorized) {
    return <MasterGate onAuthorized={() => setIsAuthorized(true)} />;
  }

  if (!project) return null;

  const navItems = [
    { type: ModuleType.ProjectInfo, label: "Fiche", icon: "🏢" },
    { type: ModuleType.Intention, label: "Intention", icon: "📝" },
    { type: ModuleType.Pitch, label: "Pitch", icon: "⚡" },
    { type: ModuleType.Synopsis, label: "Synopsis", icon: "📖" },
    { type: ModuleType.Context, label: "Paramètres", icon: "⚙️" },
    { type: ModuleType.Characters, label: "Persos", icon: "👥" },
    { type: ModuleType.Sequencer, label: "Séquencier", icon: "🎞️" },
    { type: ModuleType.Script, label: "Scenario", icon: "📽️" },
    { type: ModuleType.Storyboard, label: "Storyboard", icon: "🎨" },
    { type: ModuleType.Technical, label: "Plans", icon: "📊" },
    { type: ModuleType.FloorPlan, label: "Sol", icon: "📐" },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-300 overflow-hidden font-sans">
      {/* BARRE DE TITRE */}
      <header className="h-12 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-amber-600 rounded-sm flex items-center justify-center font-bold text-white text-[10px]">M</div>
          <h1 className="font-bold text-[9px] tracking-[0.4em] uppercase text-amber-500 truncate max-w-[200px]">{project.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSaveMac} className="px-3 py-1 bg-amber-900/20 border border-amber-900/40 text-amber-500 rounded text-[8px] font-bold uppercase tracking-widest hover:bg-amber-900/40 transition-all">Sauvegarder .MAC</button>
          <button onClick={() => setIsHelpOpen(true)} className="w-6 h-6 flex items-center justify-center bg-[#1e293b] border border-slate-700 text-slate-500 rounded hover:text-white">?</button>
        </div>
      </header>

      {/* NAVIGATION PRINCIPALE */}
      <nav className="h-10 bg-[#020617] border-b border-slate-800 flex items-center px-2 gap-1 shrink-0 overflow-x-auto no-scrollbar">
        {navItems.map(item => (
          <button
            key={item.type}
            onClick={() => setActiveModule(item.type)}
            className={`h-full flex items-center gap-2 px-3 text-[8px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
              activeModule === item.type ? 'text-amber-100 border-amber-500 bg-amber-900/10' : 'text-slate-600 border-transparent hover:text-slate-400'
            }`}
          >
            <span>{item.icon}</span> <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* CONTENU DU MODULE ACTIF */}
      <main className="flex-grow overflow-hidden relative">
        <Suspense fallback={<div className="h-full flex items-center justify-center text-[8px] uppercase tracking-[0.5em] animate-pulse text-amber-900">Initialisation du module...</div>}>
          {activeModule === ModuleType.ProjectInfo && <MetadataModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} onNewProject={createNewProject} />}
          {activeModule === ModuleType.Intention && <IntentionModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
          {activeModule === ModuleType.Pitch && <PitchModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
          {activeModule === ModuleType.Synopsis && <SynopsisModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
          {activeModule === ModuleType.Context && <ContextModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
          {activeModule === ModuleType.Characters && <div className="h-full p-4 md:p-8"><CharacterManager characters={project.characters} onUpdate={(chars) => setProject(p => p ? {...p, characters: chars} : null)} /></div>}
          {activeModule === ModuleType.Sequencer && <SequencerModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
          {activeModule === ModuleType.Script && <ScriptEditor project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
          {activeModule === ModuleType.Technical && <TechnicalTable project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
          {activeModule === ModuleType.Storyboard && <StoryboardModule project={project} onUpdate={(u) => setProject(p => p ? {...p, ...u} : null)} />}
          {activeModule === ModuleType.FloorPlan && (
            <div className="h-full">
              <FloorPlanCanvas shots={project.technicalBreakdown} columns={project.technicalColumns} floorPlans={project.floorPlans} onUpdate={(fps) => setProject(p => p ? {...p, floorPlans: fps} : null)} />
            </div>
          )}
        </Suspense>
      </main>

      {/* PIED DE PAGE */}
      <footer className="h-6 bg-[#0f172a] border-t border-slate-800 flex items-center justify-between px-6 shrink-0 text-[6px] font-bold uppercase text-slate-700 tracking-[0.5em]">
          <div>SYSTÈME_ACTIF_SCÉNARIO</div>
          <div className="italic">MACHINE À ÉCRIRE OS v{VERSION}</div>
      </footer>
      
      <Suspense fallback={null}>
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </Suspense>
    </div>
  );
};

export default App;