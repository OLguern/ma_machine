
import { AIAction } from './types';

export const APP_STORAGE_KEY = 'le_studio_scenariste_projects';
export const LEGACY_STORAGE_KEY = 'la_machine_a_ecrire_projects';

export const AI_ACTIONS: AIAction[] = [
  {
    label: "Suggérer un Dialogue",
    prompt: "En te basant sur la scène suivante, propose un dialogue percutant et sous-tendu entre les personnages impliqués. Respecte le format de scénario professionnel.",
    icon: "💬"
  },
  {
    label: "Analyser la Dramaturgie",
    prompt: "Analyse les enjeux dramatiques de ce passage. Y a-t-il assez de conflit ? Comment augmenter la tension ou l'ironie dramatique ?",
    icon: "🎭"
  },
  {
    label: "Trouver un Rebondissement",
    prompt: "Propose 3 idées de rebondissements (plot twists) inattendus qui pourraient survenir juste après ce passage, en restant cohérent avec le ton.",
    icon: "⚡"
  },
  {
    label: "Affiner le Style",
    prompt: "Réécris les descriptions d'action pour les rendre plus visuelles et dynamiques (écriture à l'os), comme dans un script de cinéma moderne.",
    icon: "🎥"
  }
];
