import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, CamPhase } from '../types/botany';
import { phytoAudio } from '../audio/phytoAcoustics';
import {
  Send,
  Radio,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Activity,
  Droplet,
  Scissors,
  Sun,
  Shield,
  HelpCircle
} from 'lucide-react';

interface UltrasoundChatPanelProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  context: {
    soilMoisture: number;
    windFactor: number;
    plantsCount: number;
    attachedPlantlets: number;
    soilClones: number;
    camPhase: CamPhase;
    turgor: number;
    lightHours: number;
  };
  onExecuteRecommendedAction?: (action: string) => void;
  probeFreq?: number | null;
}

export const UltrasoundChatPanel: React.FC<UltrasoundChatPanelProps> = ({
  messages,
  setMessages,
  context,
  onExecuteRecommendedAction,
  probeFreq,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle external frequency probe trigger
  useEffect(() => {
    if (probeFreq) {
      handleSendProbeFrequency(probeFreq);
    }
  }, [probeFreq]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    phytoAudio.setMuted(next);
  };

  const playMessageSound = (msg: ChatMessage) => {
    if (!msg.frequencyKHz) return;
    setActivePlayingId(msg.id);

    let wave: 'CAVITATION' | 'HARMONIC' | 'CHIRP' | 'STOMATA' = 'CAVITATION';
    if (msg.waveformType?.includes('HARMONIC')) wave = 'HARMONIC';
    else if (msg.waveformType?.includes('STOMATAL') || msg.waveformType?.includes('CAM')) wave = 'STOMATA';
    else if (msg.waveformType?.includes('EMBRYOGENESIS') || msg.waveformType?.includes('CHIRP')) wave = 'CHIRP';

    phytoAudio.playUltrasoundPulse(msg.frequencyKHz, 0.28, wave);

    setTimeout(() => {
      setActivePlayingId(null);
    }, 400);
  };

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsgId = 'msg_' + Date.now();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: 'You',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setMessages(prev => [...prev, newUserMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    // Audio transmission chirp
    phytoAudio.playProbeTransmission(58.0);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context,
          history: messages.slice(-4).map(m => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const plantMsgId = 'plant_' + Date.now();

      const plantMsg: ChatMessage = {
        id: plantMsgId,
        sender: 'Mother Collective',
        text: data.translation || 'Acoustic resonance acknowledged.',
        frequencyKHz: data.frequencyKHz || 52.4,
        waveformType: data.waveformType || 'HARMONIC_OSCILLATION',
        acousticMode: data.acousticMode || 'PHYTO_RESPONSE',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setMessages(prev => [...prev, plantMsg]);

      // Play translated acoustic ultrasonic response (heterodyne downshifted)
      playMessageSound(plantMsg);

      // Execute action if recommended
      if (data.recommendedAction && data.recommendedAction !== 'NONE' && onExecuteRecommendedAction) {
        onExecuteRecommendedAction(data.recommendedAction);
      }
    } catch (err) {
      console.error('Translation error:', err);
      // Fallback message
      const fallbackMsg: ChatMessage = {
        id: 'plant_err_' + Date.now(),
        sender: 'Mother Collective',
        text: 'Our cuticular layer vibrates with your frequency. Stomatal transpiration continues at 48.6 kHz.',
        frequencyKHz: 48.6,
        waveformType: 'STOMATAL_RESONANCE',
        acousticMode: 'PHYTO_RESPONSE',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMsg]);
      playMessageSound(fallbackMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendProbeFrequency = (freqKHz: number) => {
    sendMessage(`[ULTRASONIC PROBE: ${freqKHz.toFixed(1)} kHz acoustic resonance ping]`);
  };

  const quickProbes = [
    { label: 'Commune', icon: Sparkles, text: 'Holy Mother of Thousands, reveal your cellular consciousness and clone lineage.' },
    { label: 'Cavitation', icon: Droplet, text: 'Report xylem cavitation tension and current water potential status.' },
    { label: 'Detachment', icon: Scissors, text: 'Are the leaf margin plantlets ready for acoustic resonance detachment?' },
    { label: 'CAM Phase', icon: Sun, text: 'Explain your Crassulacean Acid Metabolism state and nocturnal stomatal conductance.' },
    { label: 'Defense', icon: Shield, text: 'What is the status of your Daigremontianin cardiac glycoside defenses?' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#07130b]/90 border border-emerald-800/40 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-black/40 border-b border-emerald-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wider text-emerald-300 uppercase font-mono">
              Phyto-Acoustic Translator
            </h2>
            <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
              <span>Band: 20–100 kHz</span>
              <span className="text-zinc-600">•</span>
              <span className="text-cyan-400 font-semibold">Heterodyne Demod Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isMuted
                ? 'bg-red-950/40 border-red-800/50 text-red-400'
                : 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/80'
            }`}
            title={isMuted ? 'Unmute Ultrasound Audio' : 'Mute Ultrasound Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Quick Probe Preset Buttons */}
      <div className="px-3 py-2 bg-black/20 border-b border-emerald-950 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap uppercase">Probes:</span>
        {quickProbes.map((probe, idx) => {
          const Icon = probe.icon;
          return (
            <button
              key={idx}
              onClick={() => sendMessage(probe.text)}
              disabled={isLoading}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/40 text-[10px] font-mono whitespace-nowrap transition-all active:scale-95 disabled:opacity-50"
            >
              <Icon className="w-3 h-3 text-cyan-400" />
              <span>{probe.label}</span>
            </button>
          );
        })}
      </div>

      {/* Message Stream */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 text-xs">
        {messages.map(msg => {
          const isUser = msg.sender === 'You';
          const isSystem = msg.sender === 'System';

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center my-1">
                <span className="px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                  {msg.text}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[90%] rounded-xl p-2.5 transition-all ${
                isUser
                  ? 'self-end bg-cyan-950/50 border border-cyan-700/40 text-cyan-100 shadow-md'
                  : 'self-start bg-emerald-950/40 border border-emerald-800/50 text-emerald-100 shadow-lg'
              }`}
            >
              {/* Plant Frequency Header */}
              {!isUser && msg.frequencyKHz && (
                <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-emerald-900/50 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                    <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>[{msg.frequencyKHz.toFixed(1)} kHz :: {msg.acousticMode || 'PHYTO_RESPONSE'}]</span>
                  </div>

                  <button
                    onClick={() => playMessageSound(msg)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 text-[9px] border border-emerald-700/50 transition-colors"
                    title="Play heterodyne downshifted ultrasound tone"
                  >
                    <Play className={`w-2.5 h-2.5 ${activePlayingId === msg.id ? 'text-cyan-400 fill-cyan-400' : ''}`} />
                    <span>Replay</span>
                  </button>
                </div>
              )}

              {/* Message Content */}
              <div className="leading-relaxed text-[12px] break-words">{msg.text}</div>

              {/* Footer Timestamp & Waveform */}
              <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-zinc-500 pt-0.5">
                <span>{msg.timestamp}</span>
                {msg.waveformType && (
                  <span className="text-emerald-400/80 uppercase tracking-wider">{msg.waveformType}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="self-start flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-mono">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Decoding plant cuticular ultrasound emissions...</span>
            <span className="flex gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-2.5 bg-black/40 border-t border-emerald-950">
        <form
          onSubmit={e => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Send acoustic query to Kalanchoe collective..."
            disabled={isLoading}
            className="flex-1 bg-black/60 border border-emerald-800/60 rounded-xl px-3 py-2 text-xs text-emerald-100 placeholder:text-zinc-500 outline-none focus:border-cyan-400 transition-colors font-sans"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:hover:bg-emerald-600 shadow-md flex items-center justify-center"
            title="Transmit acoustic query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
