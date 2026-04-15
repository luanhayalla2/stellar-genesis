// Dynamic procedural background music using Web Audio API
// Intensity changes based on game state (calm exploration vs intense combat)

let musicCtx: AudioContext | null = null;
let isPlaying = false;
let currentIntensity = 0; // 0 = calm, 1 = intense
let targetIntensity = 0;

// Oscillators
let bassOsc: OscillatorNode | null = null;
let padOsc1: OscillatorNode | null = null;
let padOsc2: OscillatorNode | null = null;
let arpOsc: OscillatorNode | null = null;

// Gains
let masterGain: GainNode | null = null;
let bassGain: GainNode | null = null;
let padGain: GainNode | null = null;
let arpGain: GainNode | null = null;

// LFO for pad modulation
let lfo: OscillatorNode | null = null;
let lfoGain: GainNode | null = null;

let arpInterval: number | null = null;
let arpStep = 0;

const CALM_NOTES = [55, 65.41, 73.42, 82.41]; // A1, C2, D2, E2
const INTENSE_NOTES = [55, 61.74, 73.42, 82.41]; // A1, B1, D2, E2 (minor feel)
const ARP_CALM = [220, 261.63, 329.63, 392, 329.63, 261.63]; // A3 C4 E4 G4
const ARP_INTENSE = [220, 246.94, 293.66, 349.23, 293.66, 246.94]; // A3 B3 D4 F4

function getCtx(): AudioContext {
  if (!musicCtx) musicCtx = new AudioContext();
  if (musicCtx.state === 'suspended') musicCtx.resume();
  return musicCtx;
}

export function startMusic() {
  if (isPlaying) return;
  const ctx = getCtx();
  isPlaying = true;

  // Master gain
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.06;
  masterGain.connect(ctx.destination);

  // Bass drone
  bassOsc = ctx.createOscillator();
  bassOsc.type = 'sine';
  bassOsc.frequency.value = CALM_NOTES[0];
  bassGain = ctx.createGain();
  bassGain.gain.value = 0.5;
  const bassFilter = ctx.createBiquadFilter();
  bassFilter.type = 'lowpass';
  bassFilter.frequency.value = 150;
  bassOsc.connect(bassFilter).connect(bassGain).connect(masterGain);
  bassOsc.start();

  // Pad oscillators (detuned for richness)
  padOsc1 = ctx.createOscillator();
  padOsc1.type = 'sine';
  padOsc1.frequency.value = CALM_NOTES[1];
  padOsc2 = ctx.createOscillator();
  padOsc2.type = 'triangle';
  padOsc2.frequency.value = CALM_NOTES[2];
  padOsc2.detune.value = 5;
  padGain = ctx.createGain();
  padGain.gain.value = 0.3;
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 800;
  padOsc1.connect(padFilter);
  padOsc2.connect(padFilter);
  padFilter.connect(padGain).connect(masterGain);
  padOsc1.start();
  padOsc2.start();

  // LFO for pad tremolo
  lfo = ctx.createOscillator();
  lfo.frequency.value = 0.15;
  lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.1;
  lfo.connect(lfoGain).connect(padGain.gain);
  lfo.start();

  // Arp oscillator (quiet, adds movement)
  arpOsc = ctx.createOscillator();
  arpOsc.type = 'sine';
  arpOsc.frequency.value = ARP_CALM[0];
  arpGain = ctx.createGain();
  arpGain.gain.value = 0;
  const arpFilter = ctx.createBiquadFilter();
  arpFilter.type = 'bandpass';
  arpFilter.frequency.value = 600;
  arpFilter.Q.value = 2;
  arpOsc.connect(arpFilter).connect(arpGain).connect(masterGain);
  arpOsc.start();

  // Arp pattern
  arpStep = 0;
  arpInterval = window.setInterval(() => {
    if (!arpOsc || !arpGain) return;
    const notes = currentIntensity > 0.5 ? ARP_INTENSE : ARP_CALM;
    const speed = 200 - currentIntensity * 100; // faster when intense
    arpOsc.frequency.setTargetAtTime(notes[arpStep % notes.length], getCtx().currentTime, 0.02);
    arpStep++;
    
    // Pulse arp gain
    const vol = currentIntensity * 0.25;
    arpGain.gain.setTargetAtTime(vol, getCtx().currentTime, 0.01);
    arpGain.gain.setTargetAtTime(vol * 0.3, getCtx().currentTime + 0.08, 0.05);
  }, 180);
}

export function stopMusic() {
  if (!isPlaying) return;
  isPlaying = false;
  
  if (arpInterval) { clearInterval(arpInterval); arpInterval = null; }
  
  try {
    bassOsc?.stop(); padOsc1?.stop(); padOsc2?.stop(); arpOsc?.stop(); lfo?.stop();
  } catch {}
  
  bassOsc = null; padOsc1 = null; padOsc2 = null; arpOsc = null; lfo = null;
  masterGain = null; bassGain = null; padGain = null; arpGain = null; lfoGain = null;
}

export function setMusicIntensity(intensity: number) {
  targetIntensity = Math.max(0, Math.min(1, intensity));
}

export function updateMusic() {
  if (!isPlaying) return;
  
  // Smoothly lerp intensity
  currentIntensity += (targetIntensity - currentIntensity) * 0.01;
  
  const ctx = getCtx();
  const t = ctx.currentTime;
  
  // Adjust bass
  if (bassOsc && bassGain) {
    const bassNote = currentIntensity > 0.5 ? INTENSE_NOTES[0] : CALM_NOTES[0];
    bassOsc.frequency.setTargetAtTime(bassNote, t, 0.5);
    bassGain.gain.setTargetAtTime(0.4 + currentIntensity * 0.3, t, 0.3);
  }
  
  // Adjust pads
  if (padOsc1 && padOsc2 && padGain) {
    const notes = currentIntensity > 0.5 ? INTENSE_NOTES : CALM_NOTES;
    padOsc1.frequency.setTargetAtTime(notes[1], t, 0.8);
    padOsc2.frequency.setTargetAtTime(notes[2], t, 0.8);
    padGain.gain.setTargetAtTime(0.2 + currentIntensity * 0.15, t, 0.3);
  }
  
  // LFO speed changes with intensity
  if (lfo) {
    lfo.frequency.setTargetAtTime(0.1 + currentIntensity * 0.8, t, 0.5);
  }
  
  // Master volume
  if (masterGain) {
    masterGain.gain.setTargetAtTime(0.04 + currentIntensity * 0.04, t, 0.3);
  }
}

export function getMusicIntensity(): number {
  return currentIntensity;
}

export function isMusicPlaying(): boolean {
  return isPlaying;
}
