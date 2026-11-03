export interface PlantletAttached {
  id: string;
  leafIndex: number;
  notchIndex: number;
  progress: number; // 0.1 to 1.0 (growth maturation)
  mature: boolean;
  rootLength: number; // 0 to 14 px
  angleOffset: number;
}

export interface Leaf {
  angle: number;
  length: number;
  curvature: number;
  notches: number;
  side: 'left' | 'right';
  mottleSeed: number;
}

export interface Plant {
  id: string;
  x: number;
  scale: number;
  age: number;
  leaves: Leaf[];
  plantlets: PlantletAttached[];
  health: number; // 0-100
  swayPhase: number;
}

export interface FallingPropagule {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  scale: number;
  roots: number;
}

export interface SoilPlantlet {
  id: string;
  x: number;
  y: number;
  age: number;
  scale: number;
  stage: 'sprout' | 'seedling' | 'rooted_juvenile' | 'mature_mother';
  leavesCount: number;
}

export interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
}

export interface UltrasoundAcousticEvent {
  id: string;
  frequencyKHz: number;
  timestamp: number;
  intensity: number;
  type: 'CAVITATION' | 'STOMATA_HUM' | 'TRANSLATION' | 'PROBE' | 'RAIN' | 'SHAKE';
  label: string;
}

export interface ChatMessage {
  id: string;
  sender: 'You' | 'Mother Collective' | 'System';
  text: string;
  frequencyKHz?: number;
  waveformType?: string;
  acousticMode?: string;
  timestamp: string;
  isAudioPlaying?: boolean;
}

export type CamPhase =
  | 'PHASE_I_NOCTURNAL_ACIDIFICATION'
  | 'PHASE_II_DAWN_BURST'
  | 'PHASE_III_SOLAR_DECARBOXYLATION'
  | 'PHASE_IV_DUSK_CONDUCTANCE';

export interface BioSimState {
  plants: Plant[];
  soilPlantlets: SoilPlantlet[];
  soilMoisture: number; // 0-100%
  windFactor: number; // 0-3x
  timeWarp: number; // 1-10x
  dayNightTime: number; // 0-24 hours
  isPaused: boolean;
  soundEnabled: boolean;
  heterodynePitch: number; // downshift factor (default 50)
  autoSave: boolean;
}
