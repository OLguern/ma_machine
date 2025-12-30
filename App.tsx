import React, { useState, useEffect, useRef } from 'react';
import { Project, ModuleType, IntentionQuestion, ExportSettings } from './types.ts';
import { APP_STORAGE_KEY } from './constants.tsx';
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
import { generateProductionBook } from './services/docxExportService.ts';
import saveAs from 'file-saver';

const VERSION = "2.1.0";
const getUUID = () => crypto.randomUUID();

const App: React.FC = () => {
  const [isMasterAuthorized, setIsMasterAuthorized] = useState(false);
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

  const runExport = async () => {
    if (!project) return;
    try {
      const blob = await generateProductionBook(project, exportSettings);
      saveAs(blob, `${project.title || 'Manuscrit'}_v${exportSettings.version}.docx`);
      setIsExportModalOpen(false);
    } catch (err) { alert("Erreur d'exportation"); }
  };

  if (!isMasterAuthorized) return <MasterGate onAuthorized={() => setIsMasterAuthorized(true)} />;
  if (!project) return null;
  if (project.password && !isUnlocked) return <PasswordGate correctPassword={project.password} onUnlock={() => setIsUnlocked(true)} />;

  const navItems = [
    { type: ModuleType.ProjectInfo, label: "Fiche", icon: "🏢" },
    { type: ModuleType.Intention, label: "Intention", icon: "📝" },
    { type: ModuleType.Pitch, label: "Pitch", icon: "⚡" },
    { type: ModuleType.Synopsis, label: "Synopsis", icon: "📖" },
    { type: ModuleType.Context, label: "Contexte Scène", icon: "⚙️" },
    { type: ModuleType.Characters, label: "Caractérisation des personnages", icon: "👥" },
    { type: ModuleType.Sequencer, label: "Séquencier", icon: "🎞️" },
    { type: ModuleType.Script, label: "Continuité Dialoguée", icon: "📽️" },
    { type: ModuleType.Storyboard, label: "Scénarimage", icon: "🎨" },
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
          <button onClick={() => setIsExportModalOpen(true)} className="px-4 py-1.5 bg-emerald-900/40 border border-emerald-800 text-emerald-300 rounded text-[8px] font-bold uppercase tracking-widest transition-colors hover:bg-emerald-900/60">Exporter DOCX</button>
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

      {isExportModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#1e293b] border border-slate-700 rounded-lg w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-[12px] font-bold uppercase tracking-[0.3em] text-emerald-400">Exportation DOCX</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-500 hover:text-white">×</button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-[9px] font-bold uppercase text-slate-500 mb-2 block tracking-widest">Version du Manuscrit</label>
                <input 
                  type="text" 
                  value={exportSettings.version} 
                  onChange={(e) => setExportSettings({...exportSettings, version: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="ex: 1.0 (Commission CNC)"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-bold uppercase text-slate-500 mb-2 block tracking-widest">Éléments à inclure dans le dossier</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'includeIntention', label: 'Note d\'Intention' },
                    { key: 'includePitch', label: 'Pitch Dramatique' },
                    { key: 'includeSynopsis', label: 'Synopsis Complet' },
                    { key: 'includeCharacters', label: 'Fiches Personnages' },
                    { key: 'includeSequencer', label: 'Séquencier' },
                    { key: 'includeScript', label: 'Scénario (Script)' },
                    { key: 'includeStoryboard', label: 'Scénarimage' },
                    { key: 'includeTechnical', label: 'Découpage Technique' },
                    { key: 'includeFloorPlan', label: 'Plans au Sol' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={(exportSettings as any)[item.key]} 
                        onChange={() => setExportSettings({...exportSettings, [item.key]: !(exportSettings as any)[item.key]})}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                      />
                      <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-white transition-colors">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white">Annuler</button>
              <button onClick={runExport} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase tracking-widest transition-all">Générer le Document</button>
            </div>
          </div>
        </div>
      )}

      <footer className="h-8 bg-[#0f172a] border-t border-slate-800 flex items-center justify-between px-6 shrink-0 text-[7px] font-bold uppercase text-slate-600 tracking-[0.5em]">
          <div>SIGNAL_STABLE</div>
          <div className="font-mono italic">LA MACHINE À ÉCRIRE OS v{VERSION}</div>
      </footer>
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default App;