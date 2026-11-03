import React from 'react';
import { CamPhase } from '../types/botany';
import {
  Sprout,
  Activity,
  Layers,
  Leaf,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  BookOpen,
  ZoomIn,
} from 'lucide-react';

interface ColonyOverviewBarProps {
  plantsCount: number;
  attachedCount: number;
  soilClonesCount: number;
  soilMoisture: number;
  turgor: number;
  camPhase: CamPhase;
  dayNightTime: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenDossier: () => void;
  onOpenMicroscope: () => void;
}

export const ColonyOverviewBar: React.FC<ColonyOverviewBarProps> = ({
  plantsCount,
  attachedCount,
  soilClonesCount,
  soilMoisture,
  turgor,
  camPhase,
  dayNightTime,
  isMuted,
  onToggleMute,
  onOpenDossier,
  onOpenMicroscope,
}) => {
  const isNight = dayNightTime < 6 || dayNightTime > 18;

  const getCamLabel = (phase: CamPhase) => {
    switch (phase) {
      case 'PHASE_I_NOCTURNAL_ACIDIFICATION':
        return 'CAM I: Nocturnal Stomata Open';
      case 'PHASE_II_DAWN_BURST':
        return 'CAM II: Dawn Transition';
      case 'PHASE_III_SOLAR_DECARBOXYLATION':
        return 'CAM III: Sun Stomata Sealed';
      case 'PHASE_IV_DUSK_CONDUCTANCE':
        return 'CAM IV: Dusk Respiration';
    }
  };

  return (
    <header className="absolute top-3 left-3 right-3 z-30 h-14 bg-[#07130b]/85 border border-emerald-800/40 rounded-2xl px-4 flex items-center justify-between shadow-2xl backdrop-blur-xl select-none">
      {/* Title & Scientific Branding */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-950/90 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shadow-inner">
          <Sprout className="w-4 h-4 text-emerald-400 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xs sm:text-sm font-bold tracking-wider text-emerald-300 uppercase font-mono flex items-center gap-2">
            <span>Mother of Thousands</span>
            <span className="hidden md:inline-block px-1.5 py-0.5 rounded bg-emerald-950/80 text-[10px] font-mono text-cyan-400 border border-emerald-800/60">
              BIO-SIMULATOR
            </span>
          </h1>
          <p className="text-[10px] text-zinc-400 font-serif italic hidden sm:block">
            Kalanchoe daigremontiana • Phyto-Acoustic Translation
          </p>
        </div>
      </div>

      {/* Vital Colony Biometrics */}
      <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-xl border border-emerald-900/60">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-zinc-400 hidden sm:inline">Colony:</span>
          <span className="text-emerald-300 font-bold">{plantsCount}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-xl border border-emerald-900/60">
          <Leaf className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-zinc-400 hidden sm:inline">Attached Clones:</span>
          <span className="text-cyan-300 font-bold">{attachedCount}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-xl border border-emerald-900/60">
          <Sprout className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-zinc-400 hidden sm:inline">Soil Clones:</span>
          <span className="text-purple-300 font-bold">{soilClonesCount}</span>
        </div>

        {/* CAM Metabolic Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-xl border border-emerald-900/60 text-[11px]">
          {isNight ? (
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-yellow-400" />
          )}
          <span className="text-zinc-300">{getCamLabel(camPhase)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onOpenMicroscope}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 text-purple-200 border border-purple-800/40 text-xs font-medium transition-all active:scale-95 shadow-md"
          title="Inspect Leaf Notch Meristem & Stomata under 100x Microscope"
        >
          <ZoomIn className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Microscope</span>
        </button>

        <button
          onClick={onOpenDossier}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-800/40 text-xs font-medium transition-all active:scale-95 shadow-md"
          title="Botanical Science Dossier & Ultrasound Emission Guide"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Dossier</span>
        </button>

        <button
          onClick={onToggleMute}
          className={`p-2 rounded-xl border transition-colors ${
            isMuted
              ? 'bg-red-950/40 border-red-800/50 text-red-400'
              : 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900'
          }`}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
