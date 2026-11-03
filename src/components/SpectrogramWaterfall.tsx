import React, { useEffect, useRef, useState } from 'react';
import { phytoAudio } from '../audio/phytoAcoustics';
import { Activity, Radio, Volume2, Sparkles } from 'lucide-react';

interface SpectrogramProps {
  onProbeFrequency?: (freqKHz: number) => void;
}

export const SpectrogramWaterfall: React.FC<SpectrogramProps> = ({ onProbeFrequency }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentPeakKHz, setCurrentPeakKHz] = useState<number>(54.2);
  const [pulseCount, setPulseCount] = useState<number>(0);
  const [lastMode, setLastMode] = useState<string>('IDLE_MONITORING');
  const pulsesQueue = useRef<{ freq: number; type: string; intensity: number; x: number; life: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const unsubscribe = phytoAudio.onAcousticEmission((freqHz, type, intensity) => {
      const freqKHz = freqHz / 1000;
      setCurrentPeakKHz(parseFloat(freqKHz.toFixed(1)));
      setPulseCount(prev => prev + 1);
      setLastMode(type);

      // Map frequency (20kHz to 100kHz) to Y coordinate
      pulsesQueue.current.push({
        freq: freqKHz,
        type,
        intensity,
        x: canvas.width - 2,
        life: 1.0,
      });
    });

    // Render loop
    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Shift existing canvas to the left by 1.5 pixels (waterfall effect)
      ctx.drawImage(canvas, -1.5, 0);

      // Dark background fill on the rightmost column
      ctx.fillStyle = '#050c08';
      ctx.fillRect(w - 2, 0, 2, h);

      // Faint horizontal frequency grid lines
      ctx.strokeStyle = 'rgba(46, 204, 113, 0.08)';
      ctx.lineWidth = 1;
      const freqs = [30, 45, 60, 75, 90];
      freqs.forEach(f => {
        const y = h - ((f - 20) / 80) * h;
        ctx.beginPath();
        ctx.moveTo(w - 2, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      });

      // Background ambient ultrasonic noise (stomata transpiration micro-flicker)
      const ambientY = h - ((35 + Math.sin(Date.now() * 0.003) * 15 - 20) / 80) * h;
      ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
      ctx.fillRect(w - 2, ambientY - 2, 2, 4);

      // Draw active pulses
      for (let i = pulsesQueue.current.length - 1; i >= 0; i--) {
        const p = pulsesQueue.current[i];
        const y = h - ((p.freq - 20) / 80) * h;

        let color = 'rgba(0, 229, 255, 0.9)'; // Cyan
        if (p.type === 'CAVITATION') color = 'rgba(255, 107, 107, 0.95)'; // Reddish/Orange pop
        if (p.type === 'SOMATIC_EMBRYOGENESIS' || p.type === 'SHAKE') color = 'rgba(171, 71, 188, 0.95)'; // Violet
        if (p.type === 'STOMATA' || p.type === 'HARMONIC') color = 'rgba(0, 255, 128, 0.95)'; // Neon Green

        ctx.fillStyle = color;
        const barHeight = Math.max(3, p.intensity * 8);
        ctx.fillRect(w - 3, y - barHeight / 2, 3, barHeight);

        // Glow spread
        ctx.fillStyle = color.replace('0.9', '0.3').replace('0.95', '0.3');
        ctx.fillRect(w - 4, y - barHeight, 4, barHeight * 2);

        pulsesQueue.current.splice(i, 1);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      unsubscribe();
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const h = rect.height;

    // Convert click Y to frequency between 20 and 100 kHz
    const normalized = 1 - clickY / h;
    const freqKHz = Math.round((20 + normalized * 80) * 10) / 10;
    phytoAudio.playProbeTransmission(freqKHz);
    if (onProbeFrequency) {
      onProbeFrequency(freqKHz);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full bg-black/60 border border-emerald-900/60 rounded-xl p-2.5 backdrop-blur-md shadow-lg">
      <div className="flex items-center justify-between text-xs text-emerald-400 font-mono pb-1 border-b border-emerald-950">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="font-semibold tracking-wider uppercase text-[10px]">Acoustic Spectrogram</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-zinc-400 font-mono">Range: 20-100 kHz</span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-700/50">
            {currentPeakKHz.toFixed(1)} kHz
          </span>
        </div>
      </div>

      <div className="relative w-full h-16 bg-[#030805] rounded-lg overflow-hidden border border-emerald-950 cursor-crosshair group">
        <canvas
          ref={canvasRef}
          width={320}
          height={64}
          onClick={handleCanvasClick}
          className="w-full h-full block"
          title="Click anywhere to transmit an ultrasonic probe pulse at that frequency"
        />

        {/* Frequency labels overlaid on the left */}
        <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-between text-[8px] font-mono text-emerald-500/60 pointer-events-none select-none py-0.5">
          <span>100k</span>
          <span>80k</span>
          <span>60k</span>
          <span>40k</span>
          <span>20k</span>
        </div>

        {/* Hover tip */}
        <div className="absolute right-2 bottom-1 text-[8px] font-mono text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-cyan-400" /> Click to emit probe tone
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-0.5">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-emerald-400" />
          <span className="text-zinc-300">{lastMode}</span>
        </div>
        <div className="text-zinc-500">
          Pulses: <span className="text-emerald-300 font-bold">{pulseCount}</span>
        </div>
      </div>
    </div>
  );
};
