// Web Audio Engine for PulseDJ: Audio synthesis, AnalyserNode, and DJ Soundboard Effects

class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlayingBeat: boolean = false;
  private beatIntervalId: number | null = null;
  private currentStep: number = 0;
  private bpm: number = 124;
  private volume: number = 0.6;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.85;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    if (!this.ctx) this.initContext();
    return this.analyser;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
    if (this.isPlayingBeat) {
      this.stopBeat();
      this.startBeat();
    }
  }

  public isPlaying(): boolean {
    return this.isPlayingBeat;
  }

  public toggleBeat(): boolean {
    if (this.isPlayingBeat) {
      this.stopBeat();
      return false;
    } else {
      this.startBeat();
      return true;
    }
  }

  public startBeat() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    this.isPlayingBeat = true;

    const stepTime = (60 / this.bpm) / 4; // 16th notes
    this.currentStep = 0;

    const schedule = () => {
      if (!this.isPlayingBeat || !this.ctx) return;
      const t = this.ctx.currentTime;
      this.playStep(this.currentStep, t);
      this.currentStep = (this.currentStep + 1) % 16;
    };

    schedule();
    this.beatIntervalId = window.setInterval(schedule, stepTime * 1000);
  }

  public stopBeat() {
    this.isPlayingBeat = false;
    if (this.beatIntervalId !== null) {
      window.clearInterval(this.beatIntervalId);
      this.beatIntervalId = null;
    }
  }

  private playStep(step: number, time: number) {
    if (!this.ctx || !this.masterGain) return;

    // Four-on-the-floor Kick on 0, 4, 8, 12
    if (step % 4 === 0) {
      this.synthesizeKick(time);
    }

    // Snare / Clap on 4, 12
    if (step === 4 || step === 12) {
      this.synthesizeSnare(time);
    }

    // Hi-hats on off-beats: 2, 6, 10, 14
    if (step % 2 === 0) {
      this.synthesizeHiHat(time, step % 4 === 2 ? 0.35 : 0.15);
    }

    // Bassline synth note
    if ([0, 3, 6, 8, 10, 14].includes(step)) {
      const freq = [55, 65.4, 73.4, 82.4, 55, 49][step % 6];
      this.synthesizeBass(time, freq);
    }

    // Melodic Neon Synth Chord pluck
    if ([2, 7, 10, 15].includes(step)) {
      this.synthesizePluck(time, [220, 261.6, 329.6, 392.0][(step / 2) % 4]);
    }
  }

  private synthesizeKick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.25);
  }

  private synthesizeSnare(time: number) {
    if (!this.ctx || !this.masterGain) return;
    // Tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    oscGain.gain.setValueAtTime(0.3, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.15);

    // Noise
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.15);
  }

  private synthesizeHiHat(time: number, vol: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.05);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(time);
    source.stop(time + 0.05);
  }

  private synthesizeBass(time: number, freq: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);
    filter.frequency.exponentialRampToValueAtTime(150, time + 0.18);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  private synthesizePluck(time: number, freq: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  // --- SOUNDBOARD EFFECTS ---

  public playAirhorn() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Iconic 3-burst Airhorn fanfare
    const bursts = [
      { start: t, dur: 0.14 },
      { start: t + 0.16, dur: 0.14 },
      { start: t + 0.32, dur: 0.35 },
    ];

    bursts.forEach(({ start, dur }) => {
      // 2 detuned saw oscillators for that punchy brass blast
      const osc1 = this.ctx!.createOscillator();
      const osc2 = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';

      const baseFreq = 466.16; // Bb4 classic stadium tone
      osc1.frequency.setValueAtTime(baseFreq, start);
      osc2.frequency.setValueAtTime(baseFreq * 1.01, start);

      gain.gain.setValueAtTime(0.6, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain!);

      osc1.start(start);
      osc2.start(start);
      osc1.stop(start + dur);
      osc2.stop(start + dur);
    });
  }

  public playScratch() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Turntable scratch: filtered white noise + pitch swept oscillator
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.Q.setValueAtTime(4, t);
    bandpass.frequency.setValueAtTime(1200, t);
    bandpass.frequency.linearRampToValueAtTime(3200, t + 0.08);
    bandpass.frequency.linearRampToValueAtTime(600, t + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.3);
  }

  public playRewind() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Turntable backspin / tape stop: pitch drops rapidly while tremoloing
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.6);

    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.65);
  }

  public playHypeClimax() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Siren sweep + confetti tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.4);
    osc.frequency.linearRampToValueAtTime(600, t + 0.8);
    osc.frequency.linearRampToValueAtTime(1400, t + 1.2);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 1.4);
  }
}

export const audioEngine = new AudioEngine();
