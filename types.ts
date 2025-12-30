
export enum ModuleType {
  Projet = 'PROJET',
  Intention = 'INTENTION',
  Pitch = 'PITCH',
  Synopsis = 'SYNOPSIS',
  Personnages = 'PERSONNAGES',
  Sequencier = 'SÉQUENCIER',
  Scenario = 'SCÉNARIO',
  Storyboard = 'STORYBOARD',
  Technique = 'TECHNIQUE',
  PlanSol = 'PLAN_SOL'
}

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  answers: Record<string, string>;
}

// Added missing AIAction interface
export interface AIAction {
  label: string;
  prompt: string;
  icon: string;
}

// Added missing TechnicalColumn interface
export interface TechnicalColumn {
  id: string;
  label: string;
}

// Added missing TechnicalShot interface
export interface TechnicalShot {
  id: string;
  values: Record<string, string>;
}

// Added missing BezierNode interface
export interface BezierNode {
  x: number;
  y: number;
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
}

// Added missing FloorPlanItem interface
export interface FloorPlanItem {
  id: string;
  type: 'camera' | 'actor' | 'light' | 'dolly' | 'prop' | 'arrow' | 'text' | 'bezier_curve';
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  label: string;
  color: string;
  borderWidth?: number;
  shape?: 'square' | 'circle';
  fov?: number;
  range?: number;
  curvature?: number;
  fontSize?: number;
  scale?: number;
  nodes?: BezierNode[];
  asRail?: boolean;
}

// Added missing IntentionQuestion interface
export interface IntentionQuestion {
  id: string;
  q: string;
  hint: string;
}

// Added missing PitchQuestion interface
export interface PitchQuestion {
  id: string;
  q: string;
  hint: string;
}

// Added missing SynopsisQuestion interface
export interface SynopsisQuestion {
  id: string;
  q: string;
  hint: string;
}

// Added missing SceneContext interface
export interface SceneContext {
  lumieres: string[];
  lieux: string[];
  temps: string[];
  transitions: string[];
  plans: string[];
  eclairages: string[];
}

// Added missing StoryboardFrame interface
export interface StoryboardFrame {
  id: string;
  image: string;
  notes: string;
  shotType: string;
}

// Added missing ExportSettings interface
export interface ExportSettings {
  version: string;
  includeIntention: boolean;
  includePitch: boolean;
  includeSynopsis: boolean;
  includeCharacters: boolean;
  includeSequencer: boolean;
  includeScript: boolean;
  includeStoryboard: boolean;
  includeTechnical: boolean;
  includeFloorPlan: boolean;
  fontFamily: string;
  fontSize: number;
  titleColor: string;
  titleFontSize: number;
}

// Added missing WritingPreferences interface
export interface WritingPreferences {
  autoHeaderSpacing: boolean;
  autoBlockSpacing: boolean;
}

export interface Project {
  id: string;
  title: string;
  password?: string;
  meta: {
    author: string;
    version: string;
    productionType: string;
    footageType: string;
    duration: number;
  };
  noteIntention: string;
  pitch: string;
  synopsis: string;
  sequencier: string;
  script: string;
  characters: Character[];
  lastModified: number;
  // Updated type for floorPlans, storyboard and technicalBreakdown
  floorPlans: Record<string, FloorPlanItem[]>;
  storyboard: StoryboardFrame[];
  technicalBreakdown: TechnicalShot[];
  // Added missing optional fields required by various modules
  technicalColumns?: TechnicalColumn[];
  intentionQuestions?: IntentionQuestion[];
  intentionAnswers?: Record<string, string>;
  pitchQuestions?: PitchQuestion[];
  pitchAnswers?: Record<string, string>;
  synopsisQuestions?: SynopsisQuestion[];
  synopsisAnswers?: Record<string, string>;
  sceneContext?: SceneContext;
  writingPreferences?: WritingPreferences;
}
