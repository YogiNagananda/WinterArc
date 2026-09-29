import { Vibration, Platform } from 'react-native';

// Audio Context reference for Web
let webAudioCtx: any = null;

function getWebAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!webAudioCtx || webAudioCtx.state === 'closed') {
    webAudioCtx = new AudioCtx();
  }
  if (webAudioCtx.state === 'suspended') {
    webAudioCtx.resume().catch(() => {});
  }
  return webAudioCtx;
}

function getExpoAudio() {
  try {
    // Dynamically require to avoid crash if ExponentAV native module is missing in Expo Go
    const mod = require('expo-av');
    return mod?.Audio || null;
  } catch {
    return null;
  }
}

/**
 * Play a HARD, commanding, warrior-tier battle alert when focus timer finishes.
 * Delivers heavy vibrations and loud penetrating multi-tone audio pulses.
 */
export async function playHardCompletionSound() {
  try {
    // 1. Heavy physical vibration alert
    Vibration.vibrate([0, 600, 150, 600, 150, 900]);

    // 2. Web Audio Synthesizer (Loud, hard penetrating battle alert)
    const ctx = getWebAudioContext();
    if (ctx) {
      const now = ctx.currentTime;

      // 3 loud commanding siren pulses
      [0, 0.35, 0.7].forEach(offset => {
        const start = now + offset;
        const duration = 0.28;

        // Penetrating square lead (880Hz / 1320Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, start);
        osc.frequency.exponentialRampToValueAtTime(1320, start + duration * 0.7);

        gain.gain.setValueAtTime(0.4, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);

        // Low heavy battle bass punch (110Hz)
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'square';
        bassOsc.frequency.setValueAtTime(110, start);
        bassOsc.frequency.exponentialRampToValueAtTime(55, start + duration);

        bassGain.gain.setValueAtTime(0.5, start);
        bassGain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(start);
        bassOsc.stop(start + duration);
      });
    }

    // 3. Expo-AV playback on native
    if (Platform.OS !== 'web') {
      const Audio = getExpoAudio();
      if (Audio) {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Sound playback notice:', err);
  }
}

/**
 * Play celebratory sound for Day 100% completion or reading achievement
 */
export async function playCelebrationSound() {
  try {
    Vibration.vibrate([0, 200, 100, 300]);

    const ctx = getWebAudioContext();
    if (ctx) {
      const now = ctx.currentTime;
      // Ascending major victory fanfare: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const start = now + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    }
  } catch {}
}

/**
 * Play epic initiation gong when accepting the Winter Arc Challenge
 */
export async function playInitiationGong() {
  try {
    Vibration.vibrate([0, 400, 200, 800]);

    const ctx = getWebAudioContext();
    if (ctx) {
      const now = ctx.currentTime;
      // Deep resonant warrior gong: 65Hz + 130Hz + metallic 440Hz shimmer
      const gong = ctx.createOscillator();
      const gongGain = ctx.createGain();
      gong.type = 'sawtooth';
      gong.frequency.setValueAtTime(65, now);
      gongGain.gain.setValueAtTime(0.5, now);
      gongGain.exponentialRampToValueAtTime(0.001, now + 1.8);
      gong.connect(gongGain);
      gongGain.connect(ctx.destination);
      gong.start(now);
      gong.stop(now + 1.8);
    }
  } catch {}
}
