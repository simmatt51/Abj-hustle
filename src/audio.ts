/**
 * Web Audio API synthesizer for Abuja Hustle 3D
 * Generates all vehicle, ambient, weather, and interaction sound effects with zero external assets.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private isAudioUnlocked: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isAudioUnlocked = true;
  }

  public unlock() {
    this.initContext();
    if (this.ctx && !this.engineOsc) {
      this.setupEngineSynth();
      this.setupRainSynth();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.engineGain) {
      this.engineGain.gain.value = this.isMuted ? 0 : 0.08;
    }
    if (this.rainGain) {
      this.rainGain.gain.value = this.isMuted ? 0 : this.targetRainVolume;
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private setupEngineSynth() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.value = 65;

      filter.type = 'lowpass';
      filter.frequency.value = 350;

      gain.gain.value = this.isMuted ? 0 : 0.04;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      this.engineOsc = osc;
      this.engineGain = gain;
    } catch {
      // Audio init may fail silently if not user interacted yet
    }
  }

  private targetRainVolume: number = 0;
  private setupRainSynth() {
    if (!this.ctx) return;
    try {
      // Generate 2 seconds of pink/white noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Simple 1-pole filter to generate pinkish rain noise
        data[i] = (lastOut * 0.9 + white * 0.1) * 0.8;
        lastOut = data[i];
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1600;
      filter.Q.value = 1.2;

      const gain = this.ctx.createGain();
      gain.gain.value = 0;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      this.rainSource = noise;
      this.rainGain = gain;
    } catch {
      // Audio init safeguard
    }
  }

  public updateEngine(speedRatio: number, vehicleType: 'bike' | 'cab' | 'bus') {
    if (!this.engineOsc || !this.engineGain || this.isMuted || !this.ctx) return;
    const baseFreq = vehicleType === 'bike' ? 90 : vehicleType === 'cab' ? 65 : 45;
    const maxFreq = vehicleType === 'bike' ? 240 : vehicleType === 'cab' ? 160 : 110;
    const targetFreq = baseFreq + (maxFreq - baseFreq) * Math.min(1.2, speedRatio);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);

    const baseVol = speedRatio > 0.05 ? 0.04 + speedRatio * 0.05 : 0.02;
    this.engineGain.gain.setTargetAtTime(baseVol, this.ctx.currentTime, 0.08);
  }

  public setRainIntensity(intensity: number) { // 0 to 1
    this.targetRainVolume = Math.min(0.2, intensity * 0.18);
    if (!this.rainGain || this.isMuted || !this.ctx) return;
    this.rainGain.gain.setTargetAtTime(this.targetRainVolume, this.ctx.currentTime, 0.5);
  }

  public playThunder() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Low boom oscillator
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 1.8);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 2.3);

      // Noise crackle
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.35));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(600, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(150, now + 1.5);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 2.0);
    } catch {}
  }

  public playHorn(vehicleType: 'bike' | 'cab' | 'bus') {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = vehicleType === 'bike' 
        ? [780, 840] 
        : vehicleType === 'cab' 
          ? [440, 554] 
          : [220, 277];

      freqs.forEach(f => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = vehicleType === 'bus' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(f, now);

        const dur = vehicleType === 'bus' ? 0.42 : 0.28;
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.setValueAtTime(0.18, now + dur * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.05);
      });
    } catch {}
  }

  public playSplash() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.45);
    } catch {}
  }

  public playCoin() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [1046, 1318, 1567, 2093].forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.05);

        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.28);
      });
    } catch {}
  }

  public playMilestone() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.09);

        gain.gain.setValueAtTime(0.16, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.45);
      });
    } catch {}
  }

  public playCrash() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Crunch
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.5);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.5);

      // Low thud
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

      oscGain.gain.setValueAtTime(0.35, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch {}
  }

  public playWiper() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(260, now + 0.18);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(4.0, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch {}
  }

  public playPassengerChime() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [698.46, 880.0].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.14, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch {}
  }

  public playPassengerDropAlert() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [659.25, 830.61, 987.77].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.18, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.32);
      });
    } catch {}
  }

  public stopAll() {
    if (this.engineGain) {
      this.engineGain.gain.value = 0;
    }
    if (this.rainGain) {
      this.rainGain.gain.value = 0;
    }
  }
}

export const sound = new SoundEngine();
