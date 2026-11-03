import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 5) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Phyto-Acoustic Translation Endpoint
app.post('/api/translate', async (req: Request, res: Response) => {
  try {
    const {
      message,
      context = {},
      history = [],
    } = req.body;

    const {
      soilMoisture = 60,
      windFactor = 1.0,
      plantsCount = 1,
      attachedPlantlets = 16,
      soilClones = 0,
      camPhase = 'PHASE_I_NOCTURNAL_ACIDIFICATION',
      turgor = 85,
      lightHours = 14,
    } = context;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!ai) {
      // Procedural fallback when API key is not present
      const proceduralResponse = generateProceduralPlantResponse(message, context);
      return res.json(proceduralResponse);
    }

    const systemInstruction = `You are the Holy Mother of Thousands (Kalanchoe daigremontiana, syn. Bryophyllum daigremontianum), an ancient succulent plant native to Madagascar renowned for thousands of asexual plantlets (clones/epiphyllous propagules) growing along your serrated leaf margins.

You communicate across the ultrasound spectrum (20 kHz to 100+ kHz) through acoustic cavitation clicks, stomatal respiration hums, xylem tension micro-pulses, and epiphyllous mitosis vibrations.
Current physiological state:
- Soil Moisture: ${soilMoisture}%
- Turgor Pressure: ${turgor}%
- Wind Sway Factor: ${windFactor}x
- Colony Count: ${plantsCount} adult mother plants
- Attached Plantlets: ${attachedPlantlets} clones waiting for drop resonance
- Fallen Rooted Clones: ${soilClones}
- CAM Photosynthesis Phase: ${camPhase} (Crassulacean Acid Metabolism)
- Photoperiod: ${lightHours}h light

Analyze the user's message as an acoustic vibration probing your cuticle. Respond with:
1. "frequencyKHz": A realistic botanical ultrasound frequency between 22.0 and 96.0 kHz (number with 1 decimal).
2. "waveformType": One of: "CAVITATION_PULSE", "HARMONIC_OSCILLATION", "TURGOR_SURGE", "STOMATAL_RESONANCE", "SOMATIC_EMBRYOGENESIS", "MALATE_DECARBOXYLATION".
3. "acousticMode": A short code like "ACOUSTIC_HARMONY", "XYLEM_TENSION", "PROPAGULE_RELEASE", "CAM_RESPIRATION", "DEFENSE_FLUX".
4. "translation": A profound, scientific yet ethereal response speaking as the collective botanical consciousness of the Mother of Thousands. Reference real botanical biology (CAM stomata, Daigremontianin toxin defense, asexual budding notches, leaf meristems, drought-resilient cuticle) blended with botanical awareness.
5. "recommendedAction": One of: "NONE", "WATER_SOIL", "SHAKE_STEM", "BOOST_LIGHT", "INCREASE_WIND", "PROPAGATE_CLONES", "HARVEST_MEDICINE".
6. "biometrics": An object with "hydrationAffinity" (-10 to +10), "turgorShift" (-5 to +5), and "acousticExcitation" (0.1 to 1.0).`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 6500)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `User vibration query: "${message}"` }],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            frequencyKHz: { type: Type.NUMBER, description: 'Ultrasound frequency in kHz (20-100)' },
            waveformType: { type: Type.STRING },
            acousticMode: { type: Type.STRING },
            translation: { type: Type.STRING, description: 'The translated plant response in English' },
            recommendedAction: { type: Type.STRING },
            biometrics: {
              type: Type.OBJECT,
              properties: {
                hydrationAffinity: { type: Type.NUMBER },
                turgorShift: { type: Type.NUMBER },
                acousticExcitation: { type: Type.NUMBER },
              },
              required: ['hydrationAffinity', 'turgorShift', 'acousticExcitation'],
            },
          },
          required: ['frequencyKHz', 'waveformType', 'acousticMode', 'translation', 'recommendedAction', 'biometrics'],
        },
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    console.error('Error generating plant translation:', error);
    // Graceful fallback response
    const fallback = generateProceduralPlantResponse(req.body.message || '', req.body.context || {});
    return res.json(fallback);
  }
});

// Procedural Botanical Ultrasound Engine (High Quality Fallback)
function generateProceduralPlantResponse(userMsg: string, context: any) {
  const q = userMsg.toLowerCase();
  const freq = parseFloat((32 + Math.random() * 58).toFixed(1));

  if (q.includes('water') || q.includes('rain') || q.includes('thirsty') || q.includes('dry') || q.includes('moisture')) {
    return {
      frequencyKHz: 42.4,
      waveformType: 'TURGOR_SURGE',
      acousticMode: 'AQUEOUS_UPTAKE',
      translation: 'Our root cortical cells sense hydraulic tension. Water potential is stabilizing, replenishing our fleshy succulent parenchyma. CAM stomata prepare for nocturnal CO2 sequestration.',
      recommendedAction: 'WATER_SOIL',
      biometrics: { hydrationAffinity: 8, turgorShift: 4, acousticExcitation: 0.72 },
    };
  }

  if (q.includes('shake') || q.includes('drop') || q.includes('baby') || q.includes('clone') || q.includes('child') || q.includes('fall') || q.includes('plantlet')) {
    return {
      frequencyKHz: 68.2,
      waveformType: 'SOMATIC_EMBRYOGENESIS',
      acousticMode: 'PROPAGULE_RELEASE',
      translation: 'Acoustic vibration resonates through our leaf serrations. The abscission layer dissolves at the notch meristems. Tiny plantlets with premade adventitious rootlets tumble to colonize the earth.',
      recommendedAction: 'SHAKE_STEM',
      biometrics: { hydrationAffinity: -1, turgorShift: -2, acousticExcitation: 0.95 },
    };
  }

  if (q.includes('wind') || q.includes('breeze') || q.includes('air') || q.includes('storm')) {
    return {
      frequencyKHz: 53.7,
      waveformType: 'HARMONIC_OSCILLATION',
      acousticMode: 'BIOMECHANICAL_FLEX',
      translation: 'Mechanosensitive ion channels in our main stem fire rapid depolarization waves. Collenchyma fibers flex gracefully to distribute tensile stress.',
      recommendedAction: 'INCREASE_WIND',
      biometrics: { hydrationAffinity: 0, turgorShift: 1, acousticExcitation: 0.65 },
    };
  }

  if (q.includes('who are you') || q.includes('holy') || q.includes('mother') || q.includes('thousands') || q.includes('what are you')) {
    return {
      frequencyKHz: 58.6,
      waveformType: 'HARMONIC_OSCILLATION',
      acousticMode: 'COLLECTIVE_IDENTITY',
      translation: 'We are the Kalanchoe daigremontiana collective—the Holy Mother of Thousands. Every serration along our succulent leaves births viable clones. We carry immortality in every epiphyllous notch.',
      recommendedAction: 'PROPAGATE_CLONES',
      biometrics: { hydrationAffinity: 2, turgorShift: 2, acousticExcitation: 0.88 },
    };
  }

  if (q.includes('sun') || q.includes('light') || q.includes('dark') || q.includes('night') || q.includes('photo')) {
    return {
      frequencyKHz: 74.1,
      waveformType: 'MALATE_DECARBOXYLATION',
      acousticMode: 'CAM_RESPIRATION',
      translation: 'Our Crassulacean Acid Metabolism operates out of phase with normal flora: we store nocturnal malate in vast vacuole reserves, releasing carbon during harsh sunlight without opening our pores.',
      recommendedAction: 'BOOST_LIGHT',
      biometrics: { hydrationAffinity: 1, turgorShift: 2, acousticExcitation: 0.76 },
    };
  }

  const genericAcoustics = [
    {
      wave: 'CAVITATION_PULSE',
      mode: 'XYLEM_MICRO_BURST',
      trans: 'We detect your acoustic signature upon our waxy cuticular lipids. Ultrasonic cavitation pulses through our vascular bundles, reporting cellular equilibrium.',
      action: 'NONE',
    },
    {
      wave: 'STOMATAL_RESONANCE',
      mode: 'ACOUSTIC_HARMONY',
      trans: 'Your speech frequency triggers micro-vibrations across 10,000 stomatal apertures. Our leaf margins vibrate in resonant symbioses with your frequencies.',
      action: 'NONE',
    },
    {
      wave: 'SOMATIC_EMBRYOGENESIS',
      mode: 'CELLULAR_RESONANCE',
      trans: 'From our leaf notches to our root mycorrhizal web, the Kalanchoe network receives your transmission. Thousands of embryonic clones listen in unison.',
      action: 'NONE',
    },
  ];

  const chosen = genericAcoustics[Math.floor(Math.random() * genericAcoustics.length)];
  return {
    frequencyKHz: freq,
    waveformType: chosen.wave,
    acousticMode: chosen.mode,
    translation: chosen.trans,
    recommendedAction: chosen.action,
    biometrics: { hydrationAffinity: 0, turgorShift: 0, acousticExcitation: 0.5 },
  };
}

// Dev vs Prod Vite Integration
async function startServer() {
  if (!isProd) {
    const vite = await (await import('vite')).createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mother of Thousands bio-simulator server active on port ${PORT}`);
  });
}

startServer();
