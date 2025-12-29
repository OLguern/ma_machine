
import React from 'react';
import { Project } from '../types';
import { Button } from './Button';

interface ProjectListProps {
  projects: Project[];
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelect, onNew, onDelete }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-stone-300 pb-4">
        <div>
          <h2 className="text-xl font-bold typewriter-font text-stone-700">Mes Archives</h2>
          <p className="text-stone-500 text-sm">Où repose votre travail sur "la machine à écrire".</p>
        </div>
        <Button onClick={onNew}>
          <span>+</span> Nouveau Manuscrit
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="py