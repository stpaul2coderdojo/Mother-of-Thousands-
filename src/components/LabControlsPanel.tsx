import React, { useRef } from 'react';
import { SpectrogramWaterfall } from './SpectrogramWaterfall';
import {
  Plant,
  SoilPlantlet,
  CamPhase,
  BioSimState,
} from '../types/botany';
import {
  Save,
  FolderOpen,
  Download,
  Upload,
  Wind,
  Droplets,
  Zap,
  Clock,
  Sparkles,
  Scissors,
  Sprout,
  Sun,
  Moon,
  Info,
  RotateCcw,
} from 'lucide-react';

interface LabControlsPanelProps {
  plants: Plant[];
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>;
  soilPlantlets: SoilPlantlet[];
  setSoilPlantlets: React.Dispatch<React.SetStateAction<SoilPlantlet[]>>;
  soilMoisture: number;
  setSoilMoisture: React.Dispatch<React.SetStateAction<number>>;
  windFactor: number;
  setWindFactor: React.Dispatch<React.SetStateAction<number>>;
  timeWarp: number;
  setTimeWarp: React.Dispatch<React.SetStateAction<number>>;
  dayNightTime: number;
  setDayNightTime: React.Dispatch<React.SetStateAction<number>>;
  camPhase: CamPhase;
  autoSave: boolean;
  setAutoSave: React.Dispatch<React.SetStateAction<boolean>>;
  onSave: () => void;
  onLoad: () => void;
  onExportJSON: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  onOpenDossier: () => void;
  onProbeFrequency?: (freqKHz: number) => void;
}

export const LabControlsPanel: React.FC<LabControlsPanelProps> = ({
  plants,
  setPlants,
  soilPlantlets,
  setSoilPlantlets,
  soilMoisture,
  setSoilMoisture,
  windFactor,
  setWindFactor,
  timeWarp,
  setTimeWarp,
  dayNightTime,
  setDayNightTime,
  camPhase,
  autoSave,
  setAutoSave,
  onSave,
  onLoad,
  onExportJSON,
  onImportJSON,
  onReset,
  onOpenDossier,
  onProbeFrequency,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleShake = () => {
    if (typeof (window as any).__triggerStemShake === 'function') {
      (window as any).__triggerStemShake();
    }
  };

  const handleWater = () => {
    if (typeof (window as any).__triggerRain === 'function') {
      (window as any).__triggerRain();
    }
    setSoilMoisture(prev => Math.min(100, prev + 15));
  };

  // Sow extra miniature plantlets onto soil
  const handleSowClones = () => {
    const newClones: SoilPlantlet[] = [];
    const canvasWidth = window.innerWidth;
    for (let i = 0; i < 4; i++) {
      newClones.push({
        id: 'sown_' + Math.random(),
        x: 60 + Math.random() * (canvasWidth - 120),
        y: 0,
        age: 0.2,
        scale: 0.8 + Math.random() * 0.4,
        stage: 'rooted_juvenile',
        leavesCount: 2,
      });
    }
    setSoilPlantlets(prev => [...prev, ...newClones]);
  };

  // Promote a rooted soil clone into a full adult mother plant
  const handlePromoteDaughterPlant = () => {
    if (soilPlantlets.length === 0) return;
    const oldest = soilPlantlets[0];
    setSoilPlantlets(prev => prev.slice(1));

    const newPlant: Plant = {
      id: 'daughter_plant_' + Date.now(),
      x: oldest.x,
      scale: 0.75,
      age: 1,
      health: 100,
      swayPhase: Math.random() * Math.PI * 2,
      leaves: [
        { angle: -Math.PI / 4, length: 90, notches: 6, curvature: 0.2, side: 'left', mottleSeed: Math.random() },
        { angle: Math.PI / 4, length: 90, notches: 6, curvature: 0.2, side: 'right', mottleSeed: Math.random() },
        { angle: -Math.PI / 6, length: 70, notches: 5, curvature: 0.15, side: 'left', mottleSeed: Math.random() },
        { angle: Math.PI / 6, length: 70, notches: 5, curvature: 0.15, side: 'right', mottleSeed: Math.random() },
      ],
      plantlets: [],
    };

    setPlants(prev => [...prev, newPlant]);
  };

  return (
    <div className="flex flex-col gap-3 w-80 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-950 p-3 bg-[#07130b]/90 border border-emerald-800/40 rounded-2xl shadow-2xl backdrop-blur-xl text-xs select-none">
      {/* Title & Species Header */}
      <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
        <div>
          <h2 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5 text-cyan-400" />
            Bio-Lab Simulator
          </h2>
          <p className="text-[10px] text-zinc-400 font-serif italic">Kalanchoe daigremontiana</p>
        </div>

        <button
          onClick={onOpenDossier}
          className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition-colors"
          title="Botanical Species Dossier & Ultrasound Science"
        >
          <Info className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </div>

      {/* Save & Load Options */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Save & Load State</span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onSave}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-800/40 text-[11px] font-medium transition-all active:scale-95"
          >
            <Save className="w-3 h-3 text-cyan-400" /> Save Local
          </button>
          <button
            onClick={onLoad}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-800/40 text-[11px] font-medium transition-all active:scale-95"
          >
            <FolderOpen className="w-3 h-3 text-emerald-400" /> Load Local
          </button>
          <button
            onClick={onExportJSON}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-800/40 text-[11px] font-medium transition-all active:scale-95"
          >
            <Download className="w-3 h-3 text-purple-400" /> Export JSON
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-800/40 text-[11px] font-medium transition-all active:scale-95"
          >
            <Upload className="w-3 h-3 text-yellow-400" /> Import JSON
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImportJSON}
          accept=".json"
          className="hidden"
        />

        {/* Auto-Save & Reset Row */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={e => setAutoSave(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span>Auto-Save (15s)</span>
          </label>

          <button
            onClick={onReset}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-red-400 transition-colors"
            title="Reset simulation to default state"
          >
            <RotateCcw className="w-2.5 h-2.5" /> Reset
          </button>
        </div>
      </div>

      {/* Botanical Actions */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-emerald-950">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Botanical Interventions</span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={handleShake}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-800/40 text-[11px] font-medium transition-all active:scale-95"
          >
            <Scissors className="w-3 h-3 text-purple-400" /> Shake Stem
          </button>
          <button
            onClick={handleWater}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-800/40 text-[11px] font-medium transition-all active:scale-95"
          >
            <Droplets className="w-3 h-3 text-cyan-400" /> Water Soil
          </button>
          <button
            onClick={handleSowClones}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-800/40 text-[11px] font-medium transition-all active:scale-95"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" /> Sow Clones
          </button>
          <button
            onClick={handlePromoteDaughterPlant}
            disabled={soilPlantlets.length === 0}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-950/60 hover:bg-teal-900/80 text-teal-200 border border-teal-800/40 text-[11px] font-medium transition-all active:scale-95 disabled:opacity-40"
            title="Grow a mature soil seedling into a full adult mother plant"
          >
            <Sprout className="w-3 h-3 text-teal-400" /> Root Daughter
          </button>
        </div>
      </div>

      {/* Environmental Sliders */}
      <div className="flex flex-col gap-2 pt-1 border-t border-emerald-950">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Environmental Biometrics</span>

        {/* Wind Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-300">
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-cyan-400" /> Wind Sway
            </span>
            <span className="font-mono text-cyan-400">{windFactor.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={windFactor}
            onChange={e => setWindFactor(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-black/60 rounded-lg cursor-pointer"
          />
        </div>

        {/* Soil Moisture Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-300">
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-400" /> Soil Moisture
            </span>
            <span className="font-mono text-blue-400">{soilMoisture}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={soilMoisture}
            onChange={e => setSoilMoisture(parseInt(e.target.value))}
            className="w-full accent-blue-400 h-1.5 bg-black/60 rounded-lg cursor-pointer"
          />
        </div>

        {/* Time Warp Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-300">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" /> Time Warp
            </span>
            <span className="font-mono text-emerald-400">{timeWarp}x</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={timeWarp}
            onChange={e => setTimeWarp(parseInt(e.target.value))}
            className="w-full accent-emerald-400 h-1.5 bg-black/60 rounded-lg cursor-pointer"
          />
        </div>

        {/* Daylight / CAM Circadian Cycle Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-300">
            <span className="flex items-center gap-1">
              {dayNightTime >= 6 && dayNightTime <= 18 ? (
                <Sun className="w-3 h-3 text-yellow-400" />
              ) : (
                <Moon className="w-3 h-3 text-indigo-400" />
              )}
              Circadian Hour
            </span>
            <span className="font-mono text-yellow-300">
              {Math.floor(dayNightTime).toString().padStart(2, '0')}:00h
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="24"
            step="0.5"
            value={dayNightTime}
            onChange={e => setDayNightTime(parseFloat(e.target.value))}
            className="w-full accent-yellow-400 h-1.5 bg-black/60 rounded-lg cursor-pointer"
          />
          <div className="text-[9px] font-mono text-zinc-400 text-right">
            {dayNightTime >= 21 || dayNightTime < 5
              ? 'Phase I: Nocturnal Stomata Open / Acid Storage'
              : dayNightTime >= 5 && dayNightTime < 8
              ? 'Phase II: Dawn Burst'
              : dayNightTime >= 8 && dayNightTime < 17
              ? 'Phase III: Solar Decarboxylation / Stomata Closed'
              : 'Phase IV: Dusk Stomatal Opening'}
          </div>
        </div>
      </div>

      {/* Ultrasound Spectrogram Module */}
      <div className="pt-1 border-t border-emerald-950">
        <SpectrogramWaterfall onProbeFrequency={onProbeFrequency} />
      </div>
    </div>
  );
};
