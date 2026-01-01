
import React from 'react';
import { Project } from '../types';

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  onNewProject: () => void;
}

export const MetadataModule: React.FC<Props> = ({ project, onUpdate, onNewProject }) => {
  return (
    <div className="h-full bg-stone-900/50 backdrop-blur p-12 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="border-b border-stone-800 pb-8 flex justify-between items-end">
          <div className="space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-amber-500">Fiche du Manuscrit</h2>
            <input 
              value={project.title}
              onChange={(e) => onUpdate({ title: e.target.value.toUpperCase() })}
              className="bg-transparent border-none text-4xl font-black focus:ring-0 w-full uppercase"
              placeholder="TITRE DU FILM"
            />
          </div>
          <button onClick={onNewProject} className="text-[9px] font-bold uppercase text-red-500 border border-red-900/30 px-3 py-1 hover:bg-red-900/10 transition-colors">Nouveau Projet</button>
        </div>

        <div className="grid grid-cols-2 gap-12">
          <section className="space-y-6">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-stone-500 mb-2 block">Auteur</label>
              <input 
                value={project.meta.author}
                onChange={(e) => onUpdate({ meta: { ...project.meta, author: e.target.value } })}
                className="w-full bg-black/40 border border-stone-800 p-3 rounded text-sm focus:border-amber-600 outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-stone-500 mb-2 block">Format</label>
              <select 
                value={project.meta.footageType}
                onChange={(e) => onUpdate({ meta: { ...project.meta, footageType: e.target.value } })}
                className="w-full bg-black/40 border border-stone-800 p-3 rounded text-sm outline-none"
              >
                <option>Long-métrage</option>
                <option>Court-métrage</option>
                <option>Série</option>
                <option>Animation</option>
              </select>
            </div>
          </section>

          <section className="space-y-6">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-stone-500 mb-2 block">Durée Estimée (min)</label>
              <input 
                type="number"
                value={project.meta.duration}
                onChange={(e) => onUpdate({ meta: { ...project.meta, duration: parseInt(e.target.value) } })}
                className="w-full bg-black/40 border border-stone-800 p-3 rounded text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-stone-500 mb-2 block">Email Contact</label>
              <input 
                value={project.meta.email}
                onChange={(e) => onUpdate({ meta: { ...project.meta, email: e.target.value } })}
                className="w-full bg-black/40 border border-stone-800 p-3 rounded text-sm outline-none"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
