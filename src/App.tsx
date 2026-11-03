import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plant,
  PlantletAttached,
  SoilPlantlet,
  ChatMessage,
  CamPhase,
  BioSimState,
} from './types/botany';
import { phytoAudio } from './audio/phytoAcoustics';
import { BotanicalCanvas } from './components/BotanicalCanvas';
import { ColonyOverviewBar } from './components/ColonyOverviewBar';
import { LabControlsPanel } from './components/LabControlsPanel';
import { UltrasoundChatPanel } from './components/UltrasoundChatPanel';
import { MicroscopeModal } from './components/MicroscopeModal';
import { DossierModal } from './components/DossierModal';
import { CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'mother_plant_sim_save_v2';

// Helper to create the initial majestic Mother Plant
function createInitialPlant(xPosition: number = window.innerWidth / 2): Plant {
  const leaves = [
    { angle: -Math.PI / 4, length: 130, notches: 8, curvature: 0.25, side: 'left' as const, mottleSeed: 1 },
    { angle: Math.PI / 4, length: 130, notches: 8, curvature: 0.25, side: 'right' as const, mottleSeed: 2 },
    { angle: -Math.PI / 6, length: 95, notches: 6, curvature: 0.2, side: 'left' as const, mottleSeed: 3 },
    { angle: Math.PI / 6, length: 95, notches: 6, curvature: 0.2, side: 'right' as const, mottleSeed: 4 },
  ];

  const plantlets: PlantletAttached[] = [];
  leaves.forEach((leaf, lIdx) => {
    for (let nIdx = 0; nIdx < leaf.notches; nIdx++) {
      const progress = 0.3 + Math.random() * 0.7;
      plantlets.push({
        id: `init_p_${lIdx}_${nIdx}`,
        leafIndex: lIdx,
        notchIndex: nIdx,
        progress,
        mature: progress > 0.65,
        rootLength: progress > 0.55 ? 3 + Math.random() * 8 : 1,
        angleOffset: (Math.random() - 0.5) * 0.2,
      });
    }
  });

  return {
    id: 'mother_root_1',
    x: xPosition,
    scale: 1.0,
    age: 1.0,
    leaves,
    plantlets,
    health: 98,
    swayPhase: 0,
  };
}

export default function App() {
  // Botanical Simulation State
  const [plants, setPlants] = useState<Plant[]>(() => [createInitialPlant(typeof window !== 'undefined' ? window.innerWidth / 2 : 400)]);
  const [soilPlantlets, setSoilPlantlets] = useState<SoilPlantlet[]>([
    { id: 'soil_init_1', x: 220, y: 0, age: 0.5, scale: 0.9, stage: 'rooted_juvenile', leavesCount: 2 },
    { id: 'soil_init_2', x: 580, y: 0, age: 0.3, scale: 0.75, stage: 'seedling', leavesCount: 2 },
  ]);

  const [soilMoisture, setSoilMoisture] = useState<number>(65);
  const [windFactor, setWindFactor] = useState<number>(1.0);
  const [timeWarp, setTimeWarp] = useState<number>(1);
  const [dayNightTime, setDayNightTime] = useState<number>(14); // 2:00 PM
  const [autoSave, setAutoSave] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals & Inspection
  const [isMicroscopeOpen, setIsMicroscopeOpen] = useState<boolean>(false);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);
  const [probeFreq, setProbeFreq] = useState<number | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Phyto-Acoustic Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_msg',
      sender: 'Mother Collective',
      text: 'We are the Kalanchoe collective. Send acoustic queries in English to commune with our cellular network.',
      frequencyKHz: 54.8,
      waveformType: 'HARMONIC_OSCILLATION',
      acousticMode: 'ACOUSTIC_HARMONY',
      timestamp: '14:00:00',
    },
  ]);

  // Derived CAM metabolic phase based on circadian hour
  const camPhase: CamPhase = useMemo(() => {
    if (dayNightTime >= 21 || dayNightTime < 5) return 'PHASE_I_NOCTURNAL_ACIDIFICATION';
    if (dayNightTime >= 5 && dayNightTime < 8) return 'PHASE_II_DAWN_BURST';
    if (dayNightTime >= 8 && dayNightTime < 18) return 'PHASE_III_SOLAR_DECARBOXYLATION';
    return 'PHASE_IV_DUSK_CONDUCTANCE';
  }, [dayNightTime]);

  // Calculate turgor pressure based on soil moisture and photoperiod
  const turgor = useMemo(() => {
    const base = Math.min(100, Math.max(10, soilMoisture * 0.95));
    return Math.round(base);
  }, [soilMoisture]);

  const totalAttachedPlantlets = useMemo(() => {
    return plants.reduce((sum, p) => sum + p.plantlets.length, 0);
  }, [plants]);

  // Toggle Audio Mute
  const handleToggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    phytoAudio.setMuted(next);
  }, [isMuted]);

  // Save Simulation
  const handleSaveSimulation = useCallback(() => {
    const state: BioSimState = {
      plants,
      soilPlantlets,
      soilMoisture,
      windFactor,
      timeWarp,
      dayNightTime,
      isPaused: false,
      soundEnabled: !isMuted,
      heterodynePitch: 50,
      autoSave,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      showToast('Simulation state saved to browser storage.');
      setMessages(prev => [
        ...prev,
        {
          id: 'sys_' + Date.now(),
          sender: 'System',
          text: 'Simulation state successfully saved to local storage.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e) {
      console.error(e);
    }
  }, [plants, soilPlantlets, soilMoisture, windFactor, timeWarp, dayNightTime, isMuted, autoSave]);

  // Load Simulation
  const handleLoadSimulation = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('mother_plant_sim_save');
      if (!raw) {
        showToast('No saved simulation data found.');
        return;
      }
      const data = JSON.parse(raw);
      if (data.plants && Array.isArray(data.plants)) {
        setPlants(data.plants);
      }
      if (data.soilPlantlets && Array.isArray(data.soilPlantlets)) {
        setSoilPlantlets(data.soilPlantlets);
      }
      if (typeof data.soilMoisture === 'number') setSoilMoisture(data.soilMoisture);
      if (typeof data.windFactor === 'number') setWindFactor(data.windFactor);
      if (typeof data.dayNightTime === 'number') setDayNightTime(data.dayNightTime);
      showToast('Saved simulation state successfully loaded!');
    } catch (err) {
      console.error(err);
      showToast('Error loading saved simulation state.');
    }
  }, []);

  // Export JSON
  const handleExportJSON = useCallback(() => {
    const state = {
      plants,
      soilPlantlets,
      soilMoisture,
      windFactor,
      timeWarp,
      dayNightTime,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kalanchoe_mother_thousands_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Simulation state exported as JSON file.');
  }, [plants, soilPlantlets, soilMoisture, windFactor, timeWarp, dayNightTime]);

  // Import JSON
  const handleImportJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.plants) setPlants(parsed.plants);
        if (parsed.soilPlantlets) setSoilPlantlets(parsed.soilPlantlets);
        if (typeof parsed.soilMoisture === 'number') setSoilMoisture(parsed.soilMoisture);
        if (typeof parsed.windFactor === 'number') setWindFactor(parsed.windFactor);
        if (typeof parsed.dayNightTime === 'number') setDayNightTime(parsed.dayNightTime);
        showToast('Imported simulation file successfully loaded!');
      } catch (err) {
        console.error(err);
        showToast('Invalid JSON save file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // Reset Simulation
  const handleResetSimulation = useCallback(() => {
    setPlants([createInitialPlant(window.innerWidth / 2)]);
    setSoilPlantlets([
      { id: 'soil_r_1', x: 200, y: 0, age: 0.4, scale: 0.85, stage: 'rooted_juvenile', leavesCount: 2 },
      { id: 'soil_r_2', x: 600, y: 0, age: 0.2, scale: 0.7, stage: 'seedling', leavesCount: 2 },
    ]);
    setSoilMoisture(65);
    setWindFactor(1.0);
    setTimeWarp(1);
    setDayNightTime(14);
    showToast('Simulation reset to initial botanical state.');
  }, []);

  // Periodic Auto-Save
  useEffect(() => {
    if (!autoSave) return;
    const interval = setInterval(() => {
      handleSaveSimulation();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoSave, handleSaveSimulation]);

  // Circadian Day/Night Time Progression
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setDayNightTime(prev => {
        const next = (prev + 0.05 * timeWarp) % 24;
        return parseFloat(next.toFixed(2));
      });
    }, 1000);
    return () => clearInterval(cycleInterval);
  }, [timeWarp]);

  // Execute recommended actions from AI plant translation
  const handleExecuteRecommendedAction = useCallback((action: string) => {
    if (action === 'WATER_SOIL') {
      if (typeof (window as any).__triggerRain === 'function') {
        (window as any).__triggerRain();
      }
      setSoilMoisture(prev => Math.min(100, prev + 20));
      showToast('Ultrasound triggered: Rain storm hydration commenced.');
    } else if (action === 'SHAKE_STEM') {
      if (typeof (window as any).__triggerStemShake === 'function') {
        (window as any).__triggerStemShake();
      }
      showToast('Ultrasound resonance: Ripe plantlets detached!');
    } else if (action === 'BOOST_LIGHT') {
      setDayNightTime(12);
      showToast('Circadian cycle aligned to solar zenith (12:00h).');
    } else if (action === 'INCREASE_WIND') {
      setWindFactor(prev => Math.min(3.0, prev + 0.5));
      showToast('Wind sway resonance increased.');
    } else if (action === 'PROPAGATE_CLONES') {
      if (typeof (window as any).__triggerStemShake === 'function') {
        (window as any).__triggerStemShake();
      }
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans text-white select-none">
      {/* Botanical Living Canvas Background */}
      <BotanicalCanvas
        plants={plants}
        setPlants={setPlants}
        soilPlantlets={soilPlantlets}
        setSoilPlantlets={setSoilPlantlets}
        soilMoisture={soilMoisture}
        setSoilMoisture={setSoilMoisture}
        windFactor={windFactor}
        timeWarp={timeWarp}
        dayNightTime={dayNightTime}
        camPhase={camPhase}
        onSelectPlantletForMicroscope={() => setIsMicroscopeOpen(true)}
        onDetachedPropagules={count => {
          showToast(`${count} asexual plantlets detached into soil!`);
        }}
      />

      {/* Top HUD Overview Bar */}
      <ColonyOverviewBar
        plantsCount={plants.length}
        attachedCount={totalAttachedPlantlets}
        soilClonesCount={soilPlantlets.length}
        soilMoisture={soilMoisture}
        turgor={turgor}
        camPhase={camPhase}
        dayNightTime={dayNightTime}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenDossier={() => setIsDossierOpen(true)}
        onOpenMicroscope={() => setIsMicroscopeOpen(true)}
      />

      {/* Left Laboratory Controls Panel */}
      <div className="absolute top-20 left-3 z-30 pointer-events-auto">
        <LabControlsPanel
          plants={plants}
          setPlants={setPlants}
          soilPlantlets={soilPlantlets}
          setSoilPlantlets={setSoilPlantlets}
          soilMoisture={soilMoisture}
          setSoilMoisture={setSoilMoisture}
          windFactor={windFactor}
          setWindFactor={setWindFactor}
          timeWarp={timeWarp}
          setTimeWarp={setTimeWarp}
          dayNightTime={dayNightTime}
          setDayNightTime={setDayNightTime}
          camPhase={camPhase}
          autoSave={autoSave}
          setAutoSave={setAutoSave}
          onSave={handleSaveSimulation}
          onLoad={handleLoadSimulation}
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportJSON}
          onReset={handleResetSimulation}
          onOpenDossier={() => setIsDossierOpen(true)}
          onProbeFrequency={freq => {
            setProbeFreq(freq);
            showToast(`Ultrasonic probe emitted at ${freq} kHz`);
          }}
        />
      </div>

      {/* Right / Bottom Ultrasound Language Translator Panel */}
      <div className="absolute bottom-3 right-3 top-20 w-96 max-w-[calc(100vw-24px)] z-30 pointer-events-auto">
        <UltrasoundChatPanel
          messages={messages}
          setMessages={setMessages}
          context={{
            soilMoisture,
            windFactor,
            plantsCount: plants.length,
            attachedPlantlets: totalAttachedPlantlets,
            soilClones: soilPlantlets.length,
            camPhase,
            turgor,
            lightHours: Math.round(dayNightTime),
          }}
          onExecuteRecommendedAction={handleExecuteRecommendedAction}
          probeFreq={probeFreq}
        />
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/85 border border-emerald-500/70 text-emerald-300 text-xs font-mono shadow-2xl backdrop-blur-md animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 100x Microscope Inspection Modal */}
      <MicroscopeModal
        isOpen={isMicroscopeOpen}
        onClose={() => setIsMicroscopeOpen(false)}
        soilMoisture={soilMoisture}
      />

      {/* Botanical Science Dossier Modal */}
      <DossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
      />
    </div>
  );
}
