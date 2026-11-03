import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Activity, Radio, Sparkles, Droplets } from 'lucide-react';
import { phytoAudio } from '../audio/phytoAcoustics';

interface MicroscopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  soilMoisture: number;
}

export const MicroscopeModal: React.FC<MicroscopeModalProps> = ({
  isOpen,
  onClose,
  soilMoisture,
}) => {
  const [zoomLevel, setZoomLevel] = useState<100 | 400>(100);
  const [stomataOpen, setStomataOpen] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.03;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Dark microscope circular viewport background
      ctx.fillStyle = '#060f0a';
      ctx.fillRect(0, 0, w, h);

      // Microscope optical reticle circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(cx, cy) - 20, 0, Math.PI * 2);
      ctx.clip();

      // Deep green cell background
      const bioGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, cx);
      bioGrad.addColorStop(0, '#12301c');
      bioGrad.addColorStop(0.7, '#0a2013');
      bioGrad.addColorStop(1, '#040d07');
      ctx.fillStyle = bioGrad;
      ctx.fillRect(0, 0, w, h);

      // Polygonal Epidermal Plant Cells (Cellular Pavement)
      ctx.strokeStyle = 'rgba(76, 175, 80, 0.35)';
      ctx.lineWidth = 1.5;
      const cellSize = zoomLevel === 100 ? 32 : 55;
      for (let x = 0; x < w; x += cellSize) {
        for (let y = 0; y < h; y += cellSize) {
          const ox = Math.sin(x * 0.1 + y * 0.05) * 6;
          const oy = Math.cos(y * 0.1 + x * 0.05) * 6;
          ctx.strokeRect(x + ox, y + oy, cellSize - 2, cellSize - 2);

          // Chloroplast granules inside cells
          ctx.fillStyle = 'rgba(0, 230, 118, 0.2)';
          ctx.beginPath();
          ctx.arc(x + ox + cellSize * 0.5, y + oy + cellSize * 0.5, cellSize * 0.15, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (zoomLevel === 100) {
        // --- 100x View: Leaf Notch & Epiphyllous Meristem ---
        // Serrated Leaf Notch Edge
        ctx.strokeStyle = '#81c784';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(40, cy - 120);
        ctx.quadraticCurveTo(cx - 30, cy, 40, cy + 120);
        ctx.stroke();

        // Notch Meristem vascular supply line
        ctx.strokeStyle = 'rgba(129, 199, 132, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(cx - 25, cy);
        ctx.lineTo(cx + 80, cy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Emerging Epiphyllous Plantlet Rosette in the notch
        ctx.save();
        ctx.translate(cx + 10, cy);

        // Adventitious rootlet primordium
        ctx.strokeStyle = '#d7ccc8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-5, 5);
        ctx.quadraticCurveTo(-15, 25, -10 + Math.sin(t * 2) * 3, 50);
        ctx.stroke();

        // 2 Miniature Succulent Cotyledons
        ctx.fillStyle = '#66bb6a';
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 2;

        // Upper Cotyledon
        ctx.beginPath();
        ctx.ellipse(25, -18, 28, 16, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Lower Cotyledon
        ctx.beginPath();
        ctx.ellipse(25, 18, 28, 16, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Center Meristematic Dome
        ctx.fillStyle = '#b9f6ca';
        ctx.beginPath();
        ctx.arc(5, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Label Tag
        ctx.fillStyle = '#a5d6a7';
        ctx.font = '11px monospace';
        ctx.fillText('Asexual Meristem', 15, -40);
        ctx.fillText('Adventitious Root', -35, 70);

        ctx.restore();
      } else {
        // --- 400x View: Stomata Guard Cells & Cavitation Conduit ---
        // Stomatal Complex (Pair of kidney-shaped guard cells)
        const stomataY = cy - 20;
        const poreAperture = stomataOpen ? 12 + Math.sin(t * 2) * 2 : 2;

        ctx.save();
        ctx.translate(cx - 60, stomataY);

        // Left Guard Cell
        ctx.fillStyle = '#388e3c';
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(-poreAperture, 0, 16, 38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right Guard Cell
        ctx.beginPath();
        ctx.ellipse(poreAperture, 0, 16, 38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Stomatal Aperture (The Pore)
        ctx.fillStyle = stomataOpen ? '#040d07' : '#2e7d32';
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(1, poreAperture * 0.7), 28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Transpiration vapor micro-particles
        if (stomataOpen) {
          ctx.fillStyle = 'rgba(0, 229, 255, 0.7)';
          for (let p = 0; p < 8; p++) {
            const vy = -30 - ((t * 40 + p * 15) % 60);
            const vx = Math.sin(t * 3 + p) * 10;
            ctx.beginPath();
            ctx.arc(vx, vy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.fillStyle = '#81c784';
        ctx.font = '12px monospace';
        ctx.fillText('CAM Stomatal Pore', -60, -50);
        ctx.restore();

        // Xylem Vascular Conduit (Micro-tube with water column)
        ctx.save();
        ctx.translate(cx + 80, cy);
        ctx.strokeStyle = '#29b6f6';
        ctx.lineWidth = 3;

        // Spiral lignin thickening of tracheids
        ctx.strokeRect(-20, -100, 40, 200);
        for (let l = -90; l < 90; l += 15) {
          ctx.beginPath();
          ctx.moveTo(-20, l);
          ctx.lineTo(20, l + 8);
          ctx.stroke();
        }

        // Cavitation bubble (acoustic snap generator)
        const bubbleY = Math.sin(t * 2) * 50;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(0, bubbleY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4fc3f7';
        ctx.font = '11px monospace';
        ctx.fillText('Xylem Conduit', -35, -110);
        ctx.fillText('Cavitation Bubble', -45, 115);
        ctx.restore();
      }

      // Optical Crosshairs & Scale Bar
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy); ctx.lineTo(cx + 30, cy);
      ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy + 30);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore(); // Restore circular clip

      // Circular reticle border ring
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(cx, cy) - 20, 0, Math.PI * 2);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, zoomLevel, stomataOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#07130b] border border-emerald-700/60 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold font-mono text-emerald-300 uppercase tracking-wider">
                Digital Micro-Spectroscopy Lab
              </h3>
              <p className="text-[11px] text-zinc-400 font-serif italic">
                Epiphyllous Notch Meristem & Stomatal Cavitation Analysis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Canvas */}
        <div className="relative w-full h-80 bg-black rounded-2xl overflow-hidden border border-emerald-900 flex items-center justify-center shadow-inner">
          <canvas
            ref={canvasRef}
            width={580}
            height={320}
            className="w-full h-full block"
          />

          {/* Optical Zoom Switcher */}
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/70 p-1 rounded-xl border border-emerald-800/60 font-mono text-xs">
            <button
              onClick={() => setZoomLevel(100)}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                zoomLevel === 100
                  ? 'bg-emerald-600 text-black font-bold'
                  : 'text-zinc-400 hover:text-emerald-300'
              }`}
            >
              100x Notch
            </button>
            <button
              onClick={() => setZoomLevel(400)}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                zoomLevel === 400
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'text-zinc-400 hover:text-cyan-300'
              }`}
            >
              400x Stomata
            </button>
          </div>

          {/* Test Cavitation Audio Trigger */}
          <button
            onClick={() => {
              phytoAudio.playUltrasoundPulse(68.5, 0.18, 'CAVITATION');
            }}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-xs font-mono text-cyan-300 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sample Acoustic Emission</span>
          </button>
        </div>

        {/* Scientific Annotations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-black/40 p-3 rounded-2xl border border-emerald-950 font-mono">
          <div>
            <span className="text-cyan-400 font-semibold block mb-0.5">Somatic Embryogenesis:</span>
            <span className="text-zinc-400 leading-relaxed text-[11px]">
              Unlike most angiosperms, Kalanchoe daigremontiana maintains active meristematic cell pockets in every leaf notch, pre-forming adventitious rootlet primordia ready for autonomous detachment.
            </span>
          </div>

          <div>
            <span className="text-emerald-400 font-semibold block mb-0.5">Acoustic Cavitation (20-100 kHz):</span>
            <span className="text-zinc-400 leading-relaxed text-[11px]">
              Microscopic tension snaps inside the xylem water column generate high-frequency ultrasonic clicks, translated here via heterodyne demodulation.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
