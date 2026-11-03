/**
 * Phyto-Acoustic Audio Synthesizer
 * Uses Web Audio API to reproduce ultrasonic acoustic emissions (20 kHz - 100 kHz)
 * with a laboratory-grade heterodyne downshifting demodulator for human audition.
 */

class PhytoAcousticEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private heterodyneRatio: number = 55; // Divides 20k-100k down to audible 360Hz - 1800Hz
  private listeners: ((freq: number, type: string, intensity: number) => void)[] = [];

  constructor() {
    // AudioContext is lazily initialized on user interaction to comply with browser autoplay policy
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.2, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx && !this.isMuted) {
      const clamped = Math.max(0, Math.min(1, volume));
      this.masterGain.gain.setValueAtTime(clamped * 0.35, this.ctx.currentTime);
    }
  }

  public onAcousticEmission(listener: (freq: number, type: string, intensity: number) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emitEvent(freq: number, type: string, intensity: number = 0.5) {
    this.listeners.forEach(cb => {
      try {
        cb(freq, type, intensity);
      } catch (err) {
        console.error('Acoustic event listener error:', err);
      }
    });
  }

  /**
   * Play an ultrasonic emission with heterodyne downshifting
   * @param ultrasoundKHz Frequency in kHz (20 to 100)
   * @param duration Duration in seconds
   * @param waveform Waveform character
   */
  public playUltrasoundPulse(
    ultrasoundKHz: number,
    duration: number = 0.18,
    waveform: 'CAVITATION' | 'HARMONIC' | 'CHIRP' | 'STOMATA' = 'CAVITATION'
  ) {
    this.emitEvent(ultrasoundKHz * 1000, waveform, 0.7);
    if (this.isMuted) return;

    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const audibleFreq = (ultrasoundKHz * 1000) / this.heterodyneRatio;

    if (waveform === 'CAVITATION') {
      // Cavitation is an ultra-fast microscopic burst (water column snap)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(audibleFreq * 1.5, now);
      osc.frequency.exponentialRampToValueAtTime(audibleFreq * 0.5, now + 0.08);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(audibleFreq, now);
      filter.Q.setValueAtTime(8, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.1);
    } else if (waveform === 'CHIRP') {
      // Harmonic frequency modulation chirp
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(audibleFreq * 0.8, now);
      osc1.frequency.exponentialRampToValueAtTime(audibleFreq * 1.3, now + duration);

      osc2.frequency.setValueAtTime(audibleFreq * 1.6, now);
      osc2.frequency.exponentialRampToValueAtTime(audibleFreq * 0.9, now + duration);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } else {
      // Stomatal or Harmonic respiration hum
      const osc = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(audibleFreq, now);

      lfo.frequency.setValueAtTime(14, now); // 14 Hz vibrato flutter
      lfoGain.gain.setValueAtTime(audibleFreq * 0.06, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      lfo.start(now);
      osc.start(now);
      lfo.stop(now + duration);
      osc.stop(now + duration);
    }
  }

  /**
   * Sound effect for plantlet detachment snap
   */
  public playPlantletDetachment(count: number = 1) {
    const baseFreq = 58 + Math.random() * 25;
    this.playUltrasoundPulse(baseFreq, 0.12, 'CAVITATION');
    if (count > 3) {
      setTimeout(() => {
        this.playUltrasoundPulse(baseFreq + 12, 0.1, 'CAVITATION');
      }, 70);
    }
  }

  /**
   * Rain hydration bubbling ultrasound
   */
  public playHydrationSound() {
    this.playUltrasoundPulse(38.5, 0.25, 'STOMATA');
  }

  /**
   * Probe pulse sent from human transceiver
   */
  public playProbeTransmission(freqKHz: number = 60) {
    this.playUltrasoundPulse(freqKHz, 0.22, 'CHIRP');
  }
}

export const phytoAudio = new PhytoAcousticEngine();
