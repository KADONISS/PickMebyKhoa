// Pure Web Audio API Sound Synthesizer (No external audio files required)
import type { CaseRarity, WishRarity } from '../types';

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // Lazily initialized upon first user gesture
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  // 1. Wheel Tick Sound
  public playTick(pitch: number = 800) {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // AudioContext error handling
    }
  }

  // 2. Countdown Beeps (for 3, 2, 1 and GO!)
  public playCountdown(isFinal: boolean = false) {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (isFinal) {
        // High energetic tone for "BẮT ĐẦU!"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(1174.66, now + 0.08); // D6
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else {
        // Mid tone for 3, 2, 1
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    } catch {
      // ignore
    }
  }

  // 3. Balloon Pop Sound (Layered noise burst + sub-bass punch)
  public playBalloonPop() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Layer 1: Sub punch
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

      oscGain.gain.setValueAtTime(0.5, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);

      // Layer 2: White noise pop burst
      const bufferSize = Math.floor(ctx.sampleRate * 0.08); // 80ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1.2, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
    } catch {
      // ignore
    }
  }

  // 4. Fanfare / Victory Celebration (Triumphal brass arpeggio + sustained chord)
  public playFanfare() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Arpeggio notes: C4 (261.63), E4 (329.63), G4 (392.00), C5 (523.25), E5 (659.25), G5 (783.99)
      const notes = [
        { f: 523.25, time: 0, dur: 0.12 },     // C5
        { f: 659.25, time: 0.12, dur: 0.12 },  // E5
        { f: 783.99, time: 0.24, dur: 0.14 },  // G5
        { f: 1046.50, time: 0.38, dur: 0.8 },  // C6 (Triumphant long note)
      ];

      notes.forEach(({ f, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + time);

        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.linearRampToValueAtTime(0.35, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      });

      // Supporting harmony chord at the end (C major chord)
      const harmonyNotes = [523.25, 659.25, 783.99]; // C5, E5, G5
      harmonyNotes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.38);

        gain.gain.setValueAtTime(0.001, now + 0.38);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.42);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + 0.38);
        osc.stop(now + 1.25);
      });
    } catch {
      // ignore
    }
  }

  // 5. Mystery Chest Open Sound (Magical twinkle arpeggio)
  public playChestOpen() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const pitches = [587.33, 739.99, 880.00, 1174.66, 1479.98]; // D5, F#5, A5, D6, F#6

      pitches.forEach((freq, idx) => {
        const t = now + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch {
      // ignore
    }
  }

  // 6. Whoosh / Turbo Boost sound
  public playWhoosh() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const bufferSize = Math.floor(ctx.sampleRate * 0.25);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / bufferSize);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(2200, now + 0.12);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.25);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
    } catch {
      // ignore
    }
  }

  // 7. Light Button Click
  public playClick() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // ignore
    }
  }

  // 8. UFO Beam Sound (Sci-Fi FM modulated beam)
  public playUfoBeam(duration: number = 0.8) {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const carrier = ctx.createOscillator();
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      const masterGain = ctx.createGain();

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(440, now);
      carrier.frequency.exponentialRampToValueAtTime(720, now + duration);

      mod.type = 'sine';
      mod.frequency.setValueAtTime(14, now);
      modGain.gain.setValueAtTime(80, now);

      mod.connect(carrier.frequency);

      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(0.3, now + 0.08);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      carrier.connect(masterGain);
      masterGain.connect(ctx.destination);

      mod.start(now);
      carrier.start(now);
      mod.stop(now + duration);
      carrier.stop(now + duration);
    } catch {
      // ignore
    }
  }

  // 9. Claw Machine Stepper / Relay Movement Sound
  public playClawMove() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.08);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // ignore
    }
  }

  // 10. Gacha Machine Crank Mechanism (Crisp ratchet click-clack)
  public playGachaCrank() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [0, 0.045].forEach((offset, idx) => {
        const t = now + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx === 0 ? 1200 : 1600, t);
        osc.frequency.exponentialRampToValueAtTime(280, t + 0.035);

        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.04);
      });
    } catch {
      // ignore
    }
  }

  // 11. Water Splash / Fishing Reel Cast Sound
  public playWaterSplash() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const bufferSize = Math.floor(ctx.sampleRate * 0.2);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(350, now + 0.18);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.14);

      oscGain.gain.setValueAtTime(0.2, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // ignore
    }
  }

  // 12. Bomb Countdown Tick (Pitch escalates as speed / urgency increases)
  public playBombTick(urgency: number = 0.5) {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const safeUrgency = Math.max(0, Math.min(1, urgency));
      const baseFreq = 750 + safeUrgency * 1450;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.05);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  }

  // 13. CS:GO Case Opening: Key Unlock & Latch Click
  public playCaseUnlock() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Layer 1: Metallic key click (t = 0s)
      const keyOsc = ctx.createOscillator();
      const keyGain = ctx.createGain();
      keyOsc.type = 'triangle';
      keyOsc.frequency.setValueAtTime(2400, now);
      keyOsc.frequency.exponentialRampToValueAtTime(900, now + 0.03);
      keyGain.gain.setValueAtTime(0.22, now);
      keyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      keyOsc.connect(keyGain);
      keyGain.connect(ctx.destination);
      keyOsc.start(now);
      keyOsc.stop(now + 0.035);

      // Layer 2: Latch slide noise (t = 0.08s)
      const latchTime = now + 0.08;
      const bufferSize = Math.floor(ctx.sampleRate * 0.065);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(1.8, latchTime);
      filter.frequency.setValueAtTime(1200, latchTime);
      filter.frequency.exponentialRampToValueAtTime(420, latchTime + 0.065);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, latchTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, latchTime + 0.065);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(latchTime);

      // Layer 3: Metallic clunk when case lid pops open (t = 0.16s)
      const clunkTime = now + 0.16;
      const clunkOsc = ctx.createOscillator();
      const clunkGain = ctx.createGain();
      clunkOsc.type = 'triangle';
      clunkOsc.frequency.setValueAtTime(190, clunkTime);
      clunkOsc.frequency.exponentialRampToValueAtTime(85, clunkTime + 0.12);
      clunkGain.gain.setValueAtTime(0.32, clunkTime);
      clunkGain.gain.exponentialRampToValueAtTime(0.001, clunkTime + 0.12);
      clunkOsc.connect(clunkGain);
      clunkGain.connect(ctx.destination);
      clunkOsc.start(clunkTime);
      clunkOsc.stop(clunkTime + 0.13);
    } catch {
      // ignore
    }
  }

  // 14. CS:GO Case Opening: Crisp Card Boundary Tick (~20ms)
  public playCaseTick(pitch: number = 950) {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const safePitch = Math.max(340, pitch);

      // Layer 1: Short transient click
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(safePitch, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.02);
      oscGain.gain.setValueAtTime(0.26, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.022);

      // Layer 2: Crisp edge snap noise
      const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.015));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1800, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } catch {
      // ignore
    }
  }

  // 15. CS:GO Case Opening: Rarity-tiered Lock & Reveal Chime
  public playCaseRareReveal(rarity: CaseRarity) {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (rarity === 'milspec' || rarity === 'restricted') {
        const lockOsc = ctx.createOscillator();
        const lockGain = ctx.createGain();
        lockOsc.type = 'triangle';
        lockOsc.frequency.setValueAtTime(220, now);
        lockOsc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        lockGain.gain.setValueAtTime(0.26, now);
        lockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        lockOsc.connect(lockGain);
        lockGain.connect(ctx.destination);
        lockOsc.start(now);
        lockOsc.stop(now + 0.13);

        [
          { freq: 523.25, offset: 0 }, // C5
          { freq: 783.99, offset: 0.07 }, // G5
        ].forEach(({ freq, offset }) => {
          const t = now + offset;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.22, t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.2);
        });
      } else if (rarity === 'classified' || rarity === 'covert') {
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(160, now);
        subOsc.frequency.exponentialRampToValueAtTime(55, now + 0.18);
        subGain.gain.setValueAtTime(0.34, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.2);

        [
          { freq: 523.25, offset: 0 }, // C5
          { freq: 659.25, offset: 0.045 }, // E5
          { freq: 783.99, offset: 0.09 }, // G5
        ].forEach(({ freq, offset }) => {
          const t = now + offset;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.24, t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.37);
        });
      } else {
        // 'rare' Gold: deep sub-bass drop + shimmering detuned bell chord
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(130, now);
        subOsc.frequency.exponentialRampToValueAtTime(42, now + 0.28);
        subGain.gain.setValueAtTime(0.42, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.3);

        const goldNotes = [523.25, 783.99, 987.77, 1318.51]; // C5, G5, B5, E6
        goldNotes.forEach((freq, idx) => {
          const t = now + 0.02 + idx * 0.03;
          [-6, 6].forEach((detuneOffset, pairIdx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = pairIdx === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq + detuneOffset, t);
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.46);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.48);
          });
        });
      }
    } catch {
      // ignore
    }
  }

  // 16. Genshin Wish: Cosmic Meteor Whoosh
  public playWishWhoosh(durationSec: number = 1.5) {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const noiseDur = Math.min(durationSec * 0.65, 2.2);
      const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * noiseDur));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / bufferSize);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(1.5, now);
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + noiseDur * 0.55);
      filter.frequency.exponentialRampToValueAtTime(400, now + noiseDur);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.24, now + noiseDur * 0.35);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDur);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);

      // Cosmic space drone (110Hz & 220Hz)
      [110, 220].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + noiseDur * 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, now + noiseDur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + noiseDur + 0.02);
      });
    } catch {
      // ignore
    }
  }

  // 17. Genshin Wish: Mid-air Rarity Color Shift Sweep
  public playWishColorShift(rarity: WishRarity) {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const dur = 0.35;
      const [startFreq, endFreq] =
        rarity === '5star'
          ? [587.33, 1567.98]
          : rarity === '4star'
            ? [523.25, 1046.5]
            : [440, 880];

      // Dual oscillator (sine + light triangle)
      (['sine', 'triangle'] as OscillatorType[]).forEach((type, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);

        const peak = idx === 0 ? 0.24 : 0.1;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(peak, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.02);
      });

      // 5-star extra 5th harmonic shimmer (880Hz -> 2349.32Hz)
      if (rarity === '5star') {
        const harmOsc = ctx.createOscillator();
        const harmGain = ctx.createGain();
        harmOsc.type = 'sine';
        harmOsc.frequency.setValueAtTime(880, now);
        harmOsc.frequency.exponentialRampToValueAtTime(2349.32, now + dur);

        harmGain.gain.setValueAtTime(0.001, now);
        harmGain.gain.linearRampToValueAtTime(0.14, now + 0.04);
        harmGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        harmOsc.connect(harmGain);
        harmGain.connect(ctx.destination);
        harmOsc.start(now);
        harmOsc.stop(now + dur + 0.02);
      }
    } catch {
      // ignore
    }
  }

  // 18. Genshin Wish: Impact Flash & Harp/Chime Reveal
  public playWishReveal(rarity: WishRarity) {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Sub-impact punch (95Hz -> 35Hz over 0.26s)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(95, now);
      subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.26);
      subGain.gain.setValueAtTime(0.38, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.28);

      const chord =
        rarity === '5star'
          ? [523.25, 783.99, 1174.66, 1318.51, 1567.98, 2093.0]
          : rarity === '4star'
            ? [523.25, 659.25, 783.99, 987.77]
            : [523.25, 659.25, 783.99];
      const decay = rarity === '5star' ? 1.6 : rarity === '4star' ? 1.2 : 0.9;

      chord.forEach((freq, idx) => {
        const t = now + idx * 0.05;
        (['sine', 'triangle'] as OscillatorType[]).forEach((type, layerIdx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(layerIdx === 0 ? freq : freq * 2, t);

          const peak = layerIdx === 0 ? 0.22 : 0.07;
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(peak, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + decay + 0.03);
        });
      });
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
