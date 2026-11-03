import React, { useEffect, useRef, useState } from 'react';
import {
  Plant,
  FallingPropagule,
  SoilPlantlet,
  RainDrop,
  CamPhase,
} from '../types/botany';
import { phytoAudio } from '../audio/phytoAcoustics';
import confetti from 'canvas-confetti';
import { Sparkles, ZoomIn, RefreshCw, Scissors } from 'lucide-react';

interface BotanicalCanvasProps {
  plants: Plant[];
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>;
  soilPlantlets: SoilPlantlet[];
  setSoilPlantlets: React.Dispatch<React.SetStateAction<SoilPlantlet[]>>;
  soilMoisture: number;
  setSoilMoisture: React.Dispatch<React.SetStateAction<number>>;
  windFactor: number;
  timeWarp: number;
  dayNightTime: number; // 0 to 24
  camPhase: CamPhase;
  onSelectPlantletForMicroscope?: (plantletInfo: { type: string; mature: boolean }) => void;
  onDetachedPropagules?: (count: number) => void;
}

export const BotanicalCanvas: React.FC<BotanicalCanvasProps> = ({
  plants,
  setPlants,
  soilPlantlets,
  setSoilPlantlets,
  soilMoisture,
  setSoilMoisture,
  windFactor,
  timeWarp,
  dayNightTime,
  camPhase,
  onSelectPlantletForMicroscope,
  onDetachedPropagules,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic simulation references for 60fps loop
  const fallingPropagulesRef = useRef<FallingPropagule[]>([]);
  const rainDropsRef = useRef<RainDrop[]>([]);
  const acousticRingsRef = useRef<{ x: number; y: number; r: number; maxR: number; alpha: number; color: string }[]>([]);
  const shakeImpulseRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const [hoveredNotch, setHoveredNotch] = useState<string | null>(null);

  // Initialize or handle rain
  const triggerRainEffect = () => {
    for (let i = 0; i < 45; i++) {
      rainDropsRef.current.push({
        x: Math.random() * (canvasRef.current?.width || window.innerWidth),
        y: -Math.random() * 200,
        speed: 10 + Math.random() * 8,
        length: 12 + Math.random() * 10,
      });
    }
  };

  // Shake stem action with physics
  const triggerStemShake = () => {
    shakeImpulseRef.current = 28;
    phytoAudio.playPlantletDetachment(6);

    // Add acoustic emission ring
    if (plants.length > 0 && canvasRef.current) {
      const p = plants[0];
      acousticRingsRef.current.push({
        x: p.x,
        y: canvasRef.current.height - 180,
        r: 10,
        maxR: 90,
        alpha: 1.0,
        color: '#ab47bc',
      });
    }

    // Detach mature plantlets
    let detachedCount = 0;
    setPlants(prev =>
      prev.map(plant => {
        const remainingPlantlets = [];
        for (const p of plant.plantlets) {
          // Detachment chance based on progress
          const detachThreshold = p.mature ? 0.35 : 0.85;
          if (Math.random() > detachThreshold) {
            detachedCount++;
            // Calculate approximate leaf tip position
            const leaf = plant.leaves[p.leafIndex];
            const canvasH = canvasRef.current?.height || 600;
            const stemHeight = 240 * plant.scale;
            const attachRatio = p.leafIndex < 2 ? 0.6 : 0.82;
            const lx = plant.x;
            const ly = canvasH - 45 - stemHeight * attachRatio;
            const step = leaf.length / (leaf.notches + 1);
            const dist = step * (p.notchIndex + 1);
            const px = lx + Math.cos(leaf.angle) * dist;
            const py = ly + Math.sin(leaf.angle) * dist;

            fallingPropagulesRef.current.push({
              id: 'prop_' + Math.random(),
              x: px + (Math.random() * 16 - 8),
              y: py,
              vx: (Math.random() - 0.5) * 3.5,
              vy: -Math.random() * 2,
              rotation: Math.random() * Math.PI * 2,
              vRot: (Math.random() - 0.5) * 0.15,
              scale: plant.scale * (0.8 + p.progress * 0.4),
              roots: p.progress > 0.6 ? 2 : 0,
            });
          } else {
            remainingPlantlets.push(p);
          }
        }
        return { ...plant, plantlets: remainingPlantlets };
      })
    );

    if (detachedCount > 0 && onDetachedPropagules) {
      onDetachedPropagules(detachedCount);
    }
  };

  // Expose shake to parent/global
  useEffect(() => {
    (window as any).__triggerStemShake = triggerStemShake;
    (window as any).__triggerRain = () => {
      triggerRainEffect();
      phytoAudio.playHydrationSound();
    };
    return () => {
      delete (window as any).__triggerStemShake;
      delete (window as any).__triggerRain;
    };
  }, [plants]);

  // Main canvas animation and physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Render loop
    const loop = () => {
      timeRef.current += 0.02 * timeWarp;
      const t = timeRef.current;
      const w = canvas.width;
      const h = canvas.height;

      // Dampen shake impulse
      if (shakeImpulseRef.current > 0.1) {
        shakeImpulseRef.current *= 0.94;
      } else {
        shakeImpulseRef.current = 0;
      }

      // Calculate Day/Night Ambient Color
      // dayNightTime: 0 (midnight) to 12 (noon) to 24 (midnight)
      const dayProgress = Math.sin(((dayNightTime - 6) / 24) * Math.PI * 2);
      const isNight = dayProgress < 0;

      // Background Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (dayProgress > 0.3) {
        // Daytime: warm green-tinted greenhouse glasshouse atmosphere
        skyGrad.addColorStop(0, '#0a1d13');
        skyGrad.addColorStop(0.5, '#0e261a');
        skyGrad.addColorStop(1, '#06130b');
      } else if (dayProgress > -0.2) {
        // Twilight / Dawn / Dusk
        skyGrad.addColorStop(0, '#151324');
        skyGrad.addColorStop(0.5, '#0c1b18');
        skyGrad.addColorStop(1, '#050f0a');
      } else {
        // Deep Nocturnal CAM mode: starry deep blue-emerald
        skyGrad.addColorStop(0, '#04090d');
        skyGrad.addColorStop(0.6, '#051210');
        skyGrad.addColorStop(1, '#020705');
      }

      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Distant bio-luminescent particles or stars
      if (isNight) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let s = 0; s < 35; s++) {
          const sx = (Math.sin(s * 99 + 1) * 0.5 + 0.5) * w;
          const sy = (Math.cos(s * 53 + 2) * 0.5 + 0.5) * (h * 0.65);
          const flicker = Math.sin(t * 3 + s) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(sx, sy, 0.8 + flicker * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Soil Substrate Layer (Rich volcanic succulent potting mix: pumice, bark, perlite)
      const soilH = 50;
      const soilY = h - soilH;

      // Soil moisture affects ground color
      const moistureFactor = soilMoisture / 100;
      const soilColorTop = moistureFactor > 0.5 ? '#24170f' : '#332319';
      const soilColorBottom = moistureFactor > 0.5 ? '#120b07' : '#1b120c';

      const soilGrad = ctx.createLinearGradient(0, soilY, 0, h);
      soilGrad.addColorStop(0, soilColorTop);
      soilGrad.addColorStop(1, soilColorBottom);
      ctx.fillStyle = soilGrad;
      ctx.fillRect(0, soilY, w, soilH);

      // Top Soil Horizon rim line
      ctx.strokeStyle = moistureFactor > 0.5 ? '#3e2719' : '#4e3321';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, soilY);
      ctx.lineTo(w, soilY);
      ctx.stroke();

      // Perlite and pumice specks in soil
      ctx.fillStyle = 'rgba(240, 240, 230, 0.25)';
      for (let p = 0; p < w; p += 28) {
        const px = p + Math.sin(p) * 12;
        const py = soilY + 8 + (Math.cos(p) * 15 + 15);
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Acoustic Propagation Rings
      for (let i = acousticRingsRef.current.length - 1; i >= 0; i--) {
        const ring = acousticRingsRef.current[i];
        ring.r += 2.5 * timeWarp;
        ring.alpha -= 0.025 * timeWarp;

        if (ring.alpha <= 0 || ring.r >= ring.maxR) {
          acousticRingsRef.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.strokeStyle = ring.color;
          ctx.globalAlpha = Math.max(0, ring.alpha);
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Draw Adult Mother Plants
      plants.forEach(plant => {
        const stemBaseX = plant.x;
        const stemBaseY = soilY;
        const stemHeight = 240 * plant.scale;

        // Dynamic sway physics: Natural wind oscillation + manual shake resonance
        const naturalSway = Math.sin(t * 1.5 + plant.swayPhase) * 16 * windFactor;
        const shakeSway = Math.sin(t * 22) * shakeImpulseRef.current;
        const totalSway = naturalSway + shakeSway;

        const tipX = stemBaseX + totalSway;
        const tipY = stemBaseY - stemHeight;

        // 1. Draw Succulent Stem
        ctx.save();
        const stemGrad = ctx.createLinearGradient(stemBaseX, stemBaseY, tipX, tipY);
        stemGrad.addColorStop(0, '#1c3e1e');
        stemGrad.addColorStop(0.6, '#28582b');
        stemGrad.addColorStop(1, '#3b7a3f');

        ctx.strokeStyle = stemGrad;
        ctx.lineWidth = 14 * plant.scale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(stemBaseX, stemBaseY);
        ctx.quadraticCurveTo(stemBaseX + totalSway * 0.3, stemBaseY - stemHeight * 0.5, tipX, tipY);
        ctx.stroke();

        // Woody stem base texture
        ctx.strokeStyle = 'rgba(92, 51, 23, 0.4)';
        ctx.lineWidth = 10 * plant.scale;
        ctx.beginPath();
        ctx.moveTo(stemBaseX, stemBaseY);
        ctx.lineTo(stemBaseX + totalSway * 0.15, stemBaseY - 45);
        ctx.stroke();
        ctx.restore();

        // 2. Draw Leaves
        plant.leaves.forEach((leaf, leafIdx) => {
          const attachRatio = leafIdx < 2 ? 0.58 : 0.84;
          const lx = stemBaseX + (tipX - stemBaseX) * attachRatio;
          const ly = stemBaseY - stemHeight * attachRatio;

          ctx.save();
          ctx.translate(lx, ly);
          const leafSwayOffset = totalSway * 0.007 * (leaf.side === 'right' ? 1 : -1);
          ctx.rotate(leaf.angle + leafSwayOffset);

          const leafLength = leaf.length;
          const halfWidth = 26 * plant.scale;

          // Succulent Leaf Body Gradient (deep blue-green with jade fleshy rim)
          const leafGrad = ctx.createLinearGradient(0, 0, leafLength, 0);
          leafGrad.addColorStop(0, '#2e6b36');
          leafGrad.addColorStop(0.5, '#388e3c');
          leafGrad.addColorStop(0.85, '#4caf50');
          leafGrad.addColorStop(1, '#81c784');

          ctx.fillStyle = leafGrad;
          ctx.strokeStyle = '#1b5e20';
          ctx.lineWidth = 2;

          // Draw triangular-lanceolate succulent leaf with curved notched serrations
          ctx.beginPath();
          ctx.moveTo(0, 0);
          // Upper margin
          ctx.quadraticCurveTo(leafLength * 0.45, -halfWidth, leafLength, 0);
          // Lower margin
          ctx.quadraticCurveTo(leafLength * 0.45, halfWidth, 0, 0);
          ctx.fill();
          ctx.stroke();

          // Leaf Central Vein
          ctx.strokeStyle = 'rgba(129, 199, 132, 0.45)';
          ctx.lineWidth = 2 * plant.scale;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(leafLength * 0.5, 0, leafLength * 0.9, 0);
          ctx.stroke();

          // Kalanchoe daigremontiana mottled purple-brown chevron tiger spots
          ctx.fillStyle = 'rgba(74, 20, 140, 0.35)';
          for (let s = 24; s < leafLength - 14; s += 16) {
            ctx.beginPath();
            ctx.ellipse(s, (s % 32 === 0 ? 6 : -6) * plant.scale, 7 * plant.scale, 3.5 * plant.scale, 0.4, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        });

        // 3. Draw Attached Epiphyllous Plantlets along Leaf Margins
        plant.plantlets.forEach(p => {
          const leaf = plant.leaves[p.leafIndex];
          if (!leaf) return;

          const attachRatio = p.leafIndex < 2 ? 0.58 : 0.84;
          const lx = stemBaseX + (tipX - stemBaseX) * attachRatio;
          const ly = stemBaseY - stemHeight * attachRatio;

          const step = leaf.length / (leaf.notches + 1);
          const notchDistance = step * (p.notchIndex + 1);

          const leafSwayOffset = totalSway * 0.007 * (leaf.side === 'right' ? 1 : -1);
          const currentLeafAngle = leaf.angle + leafSwayOffset;

          // Position of notch on the leaf margin
          // Alternating upper and lower leaf margin
          const isUpper = p.notchIndex % 2 === 0;
          const marginOffset = (isUpper ? -18 : 18) * plant.scale;
          const perpAngle = currentLeafAngle + Math.PI / 2;

          const px = lx + Math.cos(currentLeafAngle) * notchDistance + Math.cos(perpAngle) * marginOffset;
          const py = ly + Math.sin(currentLeafAngle) * notchDistance + Math.sin(perpAngle) * marginOffset;

          ctx.save();
          ctx.translate(px, py);

          // Miniature succulent clone rosette
          const cloneScale = (0.7 + p.progress * 0.5) * plant.scale;

          // Adventitious rootlets hanging below mature plantlet
          if (p.progress > 0.55) {
            const rootLen = (p.rootLength || 6) * cloneScale;
            ctx.strokeStyle = '#bcaaa4';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, 2);
            ctx.quadraticCurveTo(Math.sin(t * 3 + p.notchIndex) * 2, rootLen * 0.5, Math.sin(t * 2) * 3, rootLen);
            ctx.stroke();

            // Second mini root branch
            if (p.progress > 0.8) {
              ctx.beginPath();
              ctx.moveTo(1, 2);
              ctx.quadraticCurveTo(-2, rootLen * 0.6, -1, rootLen * 0.85);
              ctx.stroke();
            }
          }

          // Pair of miniature succulent leaflets
          ctx.fillStyle = p.mature ? '#76d275' : '#4caf50';
          ctx.strokeStyle = '#2e7d32';
          ctx.lineWidth = 1;

          // Left mini leaflet
          ctx.beginPath();
          ctx.ellipse(-3 * cloneScale, -1 * cloneScale, 4.5 * cloneScale, 2.8 * cloneScale, -0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Right mini leaflet
          ctx.beginPath();
          ctx.ellipse(3 * cloneScale, -1 * cloneScale, 4.5 * cloneScale, 2.8 * cloneScale, 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Rosette Center bud point
          ctx.fillStyle = '#b9f6ca';
          ctx.beginPath();
          ctx.arc(0, 0, 2 * cloneScale, 0, Math.PI * 2);
          ctx.fill();

          // Subtle bioluminescent aura on mature plantlets at night (CAM stomatal activity)
          if (isNight && p.mature) {
            ctx.fillStyle = 'rgba(0, 229, 255, 0.25)';
            ctx.beginPath();
            ctx.arc(0, 0, 7 * cloneScale, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        });
      });

      // Update and Render Falling Propagules (Physics)
      for (let i = fallingPropagulesRef.current.length - 1; i >= 0; i--) {
        const prop = fallingPropagulesRef.current[i];
        prop.vy += 0.22 * timeWarp; // Gravity
        prop.vx += Math.sin(t * 4) * 0.05 * windFactor; // Air resistance & wind
        prop.x += prop.vx * timeWarp;
        prop.y += prop.vy * timeWarp;
        prop.rotation += prop.vRot * timeWarp;

        // Ground collision
        if (prop.y >= soilY - 3) {
          // Play acoustic cavitation snap
          phytoAudio.playPlantletDetachment(1);

          // Spawn ground acoustic ripple
          acousticRingsRef.current.push({
            x: prop.x,
            y: soilY,
            r: 4,
            maxR: 35,
            alpha: 0.9,
            color: '#00e5ff',
          });

          // Convert to soil plantlet!
          setSoilPlantlets(prev => [
            ...prev,
            {
              id: 'soil_' + Math.random(),
              x: Math.max(20, Math.min(w - 20, prop.x)),
              y: soilY - 2,
              age: 0,
              scale: prop.scale,
              stage: 'rooted_juvenile',
              leavesCount: 2,
            },
          ]);

          fallingPropagulesRef.current.splice(i, 1);
        } else {
          // Render falling plantlet
          ctx.save();
          ctx.translate(prop.x, prop.y);
          ctx.rotate(prop.rotation);
          ctx.fillStyle = '#81c784';
          ctx.strokeStyle = '#2e7d32';
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.ellipse(-3 * prop.scale, 0, 4.5 * prop.scale, 2.8 * prop.scale, -0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.ellipse(3 * prop.scale, 0, 4.5 * prop.scale, 2.8 * prop.scale, 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Dangling root
          if (prop.roots > 0) {
            ctx.strokeStyle = '#bcaaa4';
            ctx.beginPath();
            ctx.moveTo(0, 2);
            ctx.lineTo(0, 7 * prop.scale);
            ctx.stroke();
          }

          ctx.restore();
        }
      }

      // Render Soil Plantlets (Clones growing into daughter plants)
      soilPlantlets.forEach(sp => {
        ctx.save();
        ctx.translate(sp.x, soilY - 1);

        const growthFactor = Math.min(2.5, 1 + sp.age * 0.05);
        const s = sp.scale * growthFactor;

        // Stem & Root Anchor
        ctx.fillStyle = '#388e3c';
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 1.2;

        // Mini stem
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -10 * s);
        ctx.stroke();

        // 4 Rosette Leaves
        const leafSize = 6 * s;
        ctx.beginPath();
        ctx.ellipse(-leafSize, -10 * s, leafSize, leafSize * 0.5, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(leafSize, -10 * s, leafSize, leafSize * 0.5, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Center budding tip
        ctx.fillStyle = '#a5d6a7';
        ctx.beginPath();
        ctx.arc(0, -11 * s, 2.5 * s, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Update and Render Rain Drops
      if (rainDropsRef.current.length > 0) {
        ctx.strokeStyle = 'rgba(128, 222, 234, 0.65)';
        ctx.lineWidth = 1.2;
        for (let r = rainDropsRef.current.length - 1; r >= 0; r--) {
          const drop = rainDropsRef.current[r];
          drop.y += drop.speed * timeWarp;
          drop.x += (Math.sin(t * 3) + 0.3) * windFactor * timeWarp;

          if (drop.y >= soilY) {
            // Splash ripple on ground
            acousticRingsRef.current.push({
              x: drop.x,
              y: soilY,
              r: 2,
              maxR: 12,
              alpha: 0.7,
              color: 'rgba(0, 229, 255, 0.5)',
            });
            rainDropsRef.current.splice(r, 1);
          } else {
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x, drop.y + drop.length);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [plants, soilPlantlets, soilMoisture, windFactor, timeWarp, dayNightTime, camPhase]);

  // Periodic natural plantlet budding (epiphyllous asexual reproduction)
  useEffect(() => {
    const budInterval = setInterval(() => {
      setPlants(prev =>
        prev.map(plant => {
          // If plant has capacity for more plantlets, grow them
          const totalNotches = plant.leaves.reduce((acc, l) => acc + l.notches, 0);
          if (plant.plantlets.length < totalNotches) {
            // Pick a vacant notch
            const occupied = new Set(plant.plantlets.map(p => `${p.leafIndex}_${p.notchIndex}`));
            for (let lIdx = 0; lIdx < plant.leaves.length; lIdx++) {
              const leaf = plant.leaves[lIdx];
              for (let nIdx = 0; nIdx < leaf.notches; nIdx++) {
                if (!occupied.has(`${lIdx}_${nIdx}`)) {
                  return {
                    ...plant,
                    plantlets: [
                      ...plant.plantlets,
                      {
                        id: `p_${Date.now()}_${Math.random()}`,
                        leafIndex: lIdx,
                        notchIndex: nIdx,
                        progress: 0.15,
                        mature: false,
                        rootLength: 1,
                        angleOffset: 0,
                      },
                    ],
                  };
                }
              }
            }
          } else {
            // Mature existing plantlets
            return {
              ...plant,
              plantlets: plant.plantlets.map(p => {
                const nextProgress = Math.min(1.0, p.progress + 0.05 * timeWarp);
                return {
                  ...p,
                  progress: nextProgress,
                  mature: nextProgress >= 0.75,
                  rootLength: nextProgress > 0.55 ? (p.rootLength || 2) + 0.5 : 1,
                };
              }),
            };
          }
          return plant;
        })
      );

      // Also age soil plantlets
      setSoilPlantlets(prev =>
        prev.map(sp => ({
          ...sp,
          age: sp.age + 0.1 * timeWarp,
        }))
      );
    }, 2500);

    return () => clearInterval(budInterval);
  }, [timeWarp]);

  // Canvas Click interactions
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked near stem or leaves to shake
    const mainPlant = plants[0];
    if (mainPlant) {
      const distToStem = Math.hypot(x - mainPlant.x, y - (canvas.height - 140));
      if (distToStem < 120) {
        triggerStemShake();
        return;
      }
    }

    // Ultrasound pulse at mouse click location
    phytoAudio.playUltrasoundPulse(58.4, 0.15, 'CAVITATION');
    acousticRingsRef.current.push({
      x,
      y,
      r: 6,
      maxR: 70,
      alpha: 1.0,
      color: '#00e5ff',
    });
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="block w-full h-full cursor-pointer"
        title="Click on the stem or leaves to shake and detach plantlets; click anywhere to emit ultrasonic probes."
      />

      {/* Floating Canvas Quick Controls & Interactive Hints */}
      <div className="absolute top-20 right-4 flex flex-col gap-2 z-20 pointer-events-auto">
        <button
          onClick={triggerStemShake}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 text-xs font-medium border border-emerald-700/50 backdrop-blur-md shadow-xl transition-all active:scale-95 hover:border-emerald-400 group"
        >
          <Scissors className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-45 transition-transform" />
          <span>Shake Stem (Detach Clones)</span>
        </button>

        <button
          onClick={() => {
            triggerRainEffect();
            setSoilMoisture(prev => Math.min(100, prev + 15));
            phytoAudio.playHydrationSound();
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 text-xs font-medium border border-cyan-700/50 backdrop-blur-md shadow-xl transition-all active:scale-95 hover:border-cyan-400"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Water Soil (Rain Simulation)</span>
        </button>

        {onSelectPlantletForMicroscope && (
          <button
            onClick={() => onSelectPlantletForMicroscope({ type: 'EPIPHYLLOUS_MERISTEM', mature: true })}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900/90 text-purple-300 text-xs font-medium border border-purple-700/50 backdrop-blur-md shadow-xl transition-all active:scale-95 hover:border-purple-400"
          >
            <ZoomIn className="w-3.5 h-3.5 text-purple-400" />
            <span>100x Microscope Notch Inspection</span>
          </button>
        )}
      </div>

      {/* Ground Substrate Water Level Indicator */}
      <div className="absolute bottom-1.5 left-4 z-20 pointer-events-none flex items-center gap-2 text-[11px] font-mono text-emerald-400/80 bg-black/60 px-2.5 py-1 rounded-md border border-emerald-900/60 backdrop-blur-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Soil Bed: Volcanic Succulent Mix ({soilMoisture}% Saturation)</span>
      </div>
    </div>
  );
};
