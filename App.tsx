import React, { useState, useEffect, useRef } from 'react';
import { Project, ModuleType, IntentionQuestion } from './types.ts';
import { APP_STORAGE_KEY, LEGACY_STORAGE_KEY } from './constants.tsx';
import { TechnicalTable } from './components/TechnicalTable.tsx';
import { CharacterManager } from './components/CharacterManager.tsx';
import { IntentionModule } from './components/IntentionModule.tsx';
import { PitchModule } from './components/PitchModule.tsx';
import { SynopsisModule } from './components/SynopsisModule.tsx';
import { ContextModule } from './components/ContextModule.tsx';
import { SequencerModule } from './components/SequencerModule.tsx';
import { HelpModal } from './components/HelpModal.tsx';
import { ScriptEditor } from './components/ScriptEditor.tsx';
import { MetadataModule } from './components/MetadataModule.tsx';
import { StoryboardModule } from './components/StoryboardModule.tsx';
import { FloorPlanCanvas } from './components/FloorPlanCanvas.tsx';
import { PasswordGate } from './components/PasswordGate.tsx';
import { MasterGate } from './components/MasterGate.tsx';

const VERSION = "2.0.2";
const getUUID = () => crypto.randomUUID();

const DEFAULT_INTENTION_QUESTIONS: IntentionQuestion[] = [
  { id: 'who', q: "Qui êtes-vous ?", hint: "Votre légitimité, votre regard d'auteur." },
  { id: 'theme', q: "Quel est le thème ?", hint: "L'idée profonde." }
];

const App: React.FC = () => {
  const [isMasterAuthorized, setIsMasterAuthorized] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.ProjectInfo);
  const [project, setProject] = useState<Project | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<'IDLE' | 'SAVING' | 'ERROR'>('IDLE');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const bootstrap = () => {
      try {
        const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
        const currentRaw = localStorage.getItem(APP_STORAGE_KEY);

        // PRIORITÉ TITANIUM : Si on trouve "La Machine à Écrire", on la restaure en premier
        if (legacyRaw) {
          const parsed = JSON.parse(legacyRaw);
          const p = Array.isArray(parsed) ? parsed[0] : parsed;
          if (p && (p.script || p.sequencier || p.title)) {
            setProject({ ...p, title: p.title || "LA MACHINE À ÉCRIRE (RESTAURÉ)" });
            setIsUnlocked(true);
            setLastSaved("Machine à Écrire trouvée");
            return;
          }
        }

        if (currentRaw) {
          const parsed = JSON.parse(currentRaw);
          const p = Array.isArray(parsed) ? parsed[0] : parsed;
          if (p && p.id) {
            setProject(p);
            setIsUnlocked(!p.password);
            setLastSaved(new Date(p.lastModified || Date.now()).toLocaleTimeString());
            return;
          }
        }

        createNewProject();
      } catch (e) {
        console.error("Bootstrap error:", e);
        createNewProject();
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (project) {
      setAutoSaveStatus('SAVING');
      const timer = setTimeout(() => {
        try {
          localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(project));
          setLastSaved(new Date().toLocaleTimeString());
          setAutoSaveStatus('IDLE');
        } catch (e) {
          setAutoSaveStatus('ERROR');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [project]);

  const createNewProject = () => {
    const newProj: Project = {
      id: getUUID(), title: "NOUVEAU MANUSCRIT",
      meta: { author: "", address: "", city: "", email: "", phone: "", productionType: "Drame", footageType: "Long-métrage", duration: 90, version: VERSION },
      noteIntention: "", intentionQuestions: [...DEFAULT_INTENTION_QUESTIONS], intentionAnswers: {}, pitch: "", pitchQuestions: [], pitchAnswers: {}, synopsis: "", synopsisQuestions: [], synopsisAnswers: {},
      sceneContext: { lumieres: ["INT.", "EXT."], lieux: ["STUDIO"], temps: ["JOUR"], transitions: ["COUPE"], plans: ["GP"], eclairages: ["NATL"] },
      writingPreferences: { autoHeaderSpacing: true, autoBlockSpacing: true }, sequencier: "", script: "", characters: [], technicalColumns: [], technicalBreakdown: [], floorPlans: {}, storyboard: [], lastModified: Date.now()
    };
    setProject(newProj);
    setIsUnlocked(true);
  };

  const handleSaveMac = () => {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(project.title || 'Manuscrit').replace(/[^a-z0-9]/gi, '_')}.mac`;
    link.click();
    URL.revokeObjectURL(url);
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
      } catch (err) {
        alert("Fichier non reconnu.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (!isMasterAuthorized) return <MasterGate onAuthorized={() => setIsMasterAuthorized(true)} />;
  if (!project) return null;
  if (project.password && !isUnlocked) return <PasswordGate correctPassword={project.password} onUnlock={() => setIsUnlocked(true)} />;

  const navItems = [
    { type: ModuleType.ProjectInfo, label: "Fiche", icon: "🏢" },
    { type: ModuleType.Intention, label: "Intention", icon: "📝" },
    { type: ModuleType.Pitch, label: "Pitch", icon: "⚡" },
    { type: ModuleType.Synopsis, label: "Synopsis", icon: "📖" },
    { type: ModuleType.Context, label: "Context", icon: "⚙️" },
    { type: ModuleType.Characters, label: "Cast", icon: "👥" },
    { type: ModuleType.Sequencer, label: "Séquences", icon: "🎞️" },
    { type: ModuleType.Script, label: "Script", icon: "📽️" },
    { type: ModuleType.Storyboard, label: "Board", icon: "🎨" },
    { type: ModuleType.Technical, label: "Découpage", icon: "📊" },
    { type: ModuleType.FloorPlan, label: "Plan Sol", icon: "📐" },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-slate-300 overflow-hidden font-sans border-[10px] border-[#0f172a]">
      <header className="h-14 bg-[#0a0a0f] border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-slate-700 rounded-sm flex items-center justify-center font-bold text-white text-lg">C</div>
          <div className="flex flex-col">
            <h1 className="font-bold text-[9px] tracking-[0.5em] uppercase text-slate-400">
              {project.title}
            </h1>
            <div className="flex items-center gap-2">
               <span className={`w-1 h-1 rounded-full ${autoSaveStatus === 'SAVING' ? 'bg-slate-400 animate-pulse' : 'bg-slate-900'}`}></span>
               <span className="text-[7px] font-bold uppercase tracking-widest text-slate-600">
                 {autoSaveStatus === 'SAVING' ? 'MÉMORISATION...' : 'COHÉRENCE_TITANIUM'}
               </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={handleImportMac} accept=".mac,.json" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-[#1a1a1a] border border-slate-800 text-slate-500 rounded text-[8px] font-bold uppercase tracking-widest transition-all">Ouvrir .MAC</button>
          <button onClick={handleSaveMac} className="px-4 py-1.5 bg-slate-800/40 border border-slate-700 text-slate-300 rounded text-[8px] font-bold uppercase tracking-widest transition-colors">Exporter</button>
          <button onClick={() => setIsHelpOpen(true)} className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] border border-slate-800 text-slate-600 rounded hover:text-white transition-colors">?</button>
        </div>
      </header>

      <nav className="h-10 bg-[#050505] border-b border-slate-800 flex items-center px-4 gap-1 shrink-0 overflow-x-auto no-scrollbar">
        {navItems.map(item => (
          <button
            key={item.type}
            onClick={() => setActiveModule(item.type)}
            className={`h-full flex items-center gap-2 px-4 text-[8px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
              activeModule === item.type ? 'text-slate-100 border-slate-400 bg-slate-800/20' : 'text-slate-600 border-transparent hover:text-slate-400'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-grow overflow-hidden relative bg-[#050505]">
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
      </main>

      <footer className="h-8 bg-[#0a0a0f] border-t border-slate-800 flex items-center justify-between px-6 shrink-0 text-[7px] font-bold uppercase text-slate-700 tracking-[0.4em]">
          <div>DERNIER ÉTAT : {lastSaved}</div>
          <div className="font-mono italic">CARBON STUDIO TITANIUM v{VERSION}</div>
      </footer>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default App;