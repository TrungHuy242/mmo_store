// Retro Sci-Fi Sound Effects System
// Uses Web Audio API to generate synth sounds without needing external audio files

class SoundFX {
  constructor() {
    this.audioContext = null;
    this.masterVolume = 0.2; // Quiet by default
    this.enabled = true;
    
    // Initialize AudioContext on first user interaction
    this.initContext = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      return this.audioContext;
    };
  }

  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Create oscillator with envelope
  createTone(frequency, duration, type = 'sine', gainValue = 0.3) {
    const ctx = this.initContext();
    if (!ctx || !this.enabled) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(gainValue * this.masterVolume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);

    return { oscillator, gainNode };
  }

  // Sci-Fi Click - short blip sound
  playClick() {
    const ctx = this.initContext();
    if (!ctx || !this.enabled) return;

    const now = ctx.currentTime;
    
    // Main click tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.exponentialRampToValueAtTime(400, now + 0.05);
    gain1.gain.setValueAtTime(this.masterVolume * 0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // High frequency ping
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2000, now + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(this.masterVolume * 0.1, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.1);
  }

  // Success Chime - ascending synth arpeggio
  playSuccess() {
    const ctx = this.initContext();
    if (!ctx || !this.enabled) return;

    const now = ctx.currentTime;
    
    // Arpeggio notes (C5 - E5 - G5 - C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const noteDuration = 0.12;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = i === notes.length - 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + i * noteDuration);

      gain.gain.setValueAtTime(0, now + i * noteDuration);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.25, now + i * noteDuration + 0.02);
      gain.gain.setValueAtTime(this.masterVolume * 0.25, now + i * noteDuration + noteDuration * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * noteDuration + noteDuration + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * noteDuration);
      osc.stop(now + i * noteDuration + noteDuration + 0.2);
    });

    // Final chord shimmer
    setTimeout(() => {
      if (!this.enabled) return;
      notes.slice(0, 3).forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 2, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this.masterVolume * 0.08, ctx.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      });
    }, notes.length * noteDuration * 1000 + 50);
  }

  // Error/Warning beep
  playError() {
    const ctx = this.initContext();
    if (!ctx || !this.enabled) return;

    const now = ctx.currentTime;
    
    // Low warning tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(120, now + 0.15);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.15, now + 0.02);
    gain.gain.setValueAtTime(this.masterVolume * 0.15, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Notification ping
  playNotification() {
    const ctx = this.initContext();
    if (!ctx || !this.enabled) return;

    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1100, now + 0.08);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.2, now + 0.01);
    gain.gain.setValueAtTime(this.masterVolume * 0.2, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Hover tick (subtle)
  playHover() {
    const ctx = this.initContext();
    if (!ctx || !this.enabled) return;

    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.05, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }
}

// Singleton instance
export const soundFX = new SoundFX();

// React hook for using sounds
export const useSoundFX = () => {
  return {
    playClick: () => soundFX.playClick(),
    playSuccess: () => soundFX.playSuccess(),
    playError: () => soundFX.playError(),
    playNotification: () => soundFX.playNotification(),
    playHover: () => soundFX.playHover(),
    toggle: () => soundFX.toggle(),
    setVolume: (vol) => soundFX.setVolume(vol),
    isEnabled: () => soundFX.enabled,
  };
};

export default soundFX;
