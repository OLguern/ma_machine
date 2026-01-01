
export interface AIAction {
  label: string;
  prompt: string;
  icon: string;
}

export enum EditorTab {
  Script = 'SCRIPT',
  Characters = 'CHARACTERS',
  Structure = 'STRUCTURE'
}

export interface BezierNode {
  id: string;
  x: number;
  y: number;
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
}

export interface FloorPlanItem {
  id: string;
  type: 'actor' | 'camera' | 'light' | 'led' | 'prop' | 'arrow' | 'text' | 'dolly' | 'bezier_curve';
  x: number;
  y: number;
  rotation: number;
  label: string;
  color?: string;
  scale?: number;
  width?: number;
  height?: number;
  fov?: number;
  range?: number;
  shape?: 'circle' | 'square';
  fontSize?: number;
  borderWidth?: number;
  nodes?: BezierNode[];
  asRail?: boolean;
  curvature?: number;
}

export interface IntentionQuestion {
  id: string;
  q: string;
  hint: string;
}

export interface PitchQuestion {
  id: string;
  q: string;
  hint: string;
}

export interface SynopsisQuestion {
  id: string;
  q: string;
  hint: string;
}

export interface TechnicalColumn {
  id: string;
  label: string;
}

export interface TechnicalShot {
  id: string;
  values: Record<string, string>;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  answers: Record<string, string>;
}

export interface StoryboardFrame {
  id: string;
  image: string;
  notes: string;
  shotType: string;
}

export interface SceneContext {
  lumieres: string[];
  lieux: string[];
  temps: string[];
  transitions: string[];
  plans: string[];
  eclairages: string[];
}

export interface WritingPreferences {
  autoHeaderSpacing: boolean;
  autoBlockSpacing: boolean;
}

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
  fontFamily: 'Arial' | 'Times New Roman' | 'Courier Prime' | 'Special Elite';
  fontSize: 12 | 14;
  titleColor: string;
  titleFontSize: 14 | 16;
}

export interface Project {
  id: string;
  title: string;
  password?: string;
  meta: {
    author: string;
    address: string;
    city: string;
    email: string;
    phone: string;
    productionType: string;
    footageType: string;
    duration: number;
    version: string;
  };
  noteIntention: string;
  intentionQuestions: IntentionQuestion[];
  intentionAnswers: Record<string, string>;
  pitch: string;
  pitchQuestions: PitchQuestion[];
  pitchAnswers: Record<string, string>;
  synopsis: string;
  synopsisQuestions: SynopsisQuestion[];
  synopsisAnswers: Record<string, string>;
  sceneContext: SceneContext;
  writingPreferences: WritingPreferences;
  sequencier: string;
  script: string;
  characters: Character[];
  technicalColumns: TechnicalColumn[];
  technicalBreakdown: TechnicalShot[];
  floorPlans: Record<string, FloorPlanItem[]>;
  storyboard: StoryboardFrame[];
  lastModified: number;
}

export enum ModuleType {
  ProjectInfo = 'PROJECT_INFO',
  Intention = 'INTENTION',
  Pitch = 'PITCH',
  Synopsis = 'SYNOPSIS',
  Characters = 'CHARACTERS',
  Context = 'CONTEXT',
  Sequencer = 'SEQUENCER',
  Script = 'SCRIPT',
  Storyboard = 'STORYBOARD',
  Technical = 'TECHNICAL',
  FloorPlan = 'FLOOR_PLAN',
}
