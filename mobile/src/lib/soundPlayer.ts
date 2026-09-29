import { Vibration, Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Configure global audio settings for sound playback
try {
  setAudioModeAsync({
    playsInSilentMode: true,
  }).catch(() => {});
} catch {}

let alarmPlayer: any = null;
let celebrationPlayer: any = null;
let gongPlayer: any = null;

function getAlarmPlayer() {
  if (!alarmPlayer) {
    try {
      alarmPlayer = createAudioPlayer(require('../../assets/battle_alarm.wav'));
    } catch (err) {
      console.warn('Error loading battle alarm player:', err);
    }
  }
  return alarmPlayer;
}

function getCelebrationPlayer() {
  if (!celebrationPlayer) {
    try {
      celebrationPlayer = createAudioPlayer(require('../../assets/celebration.wav'));
    } catch {}
  }
  return celebrationPlayer;
}

function getGongPlayer() {
  if (!gongPlayer) {
    try {
      gongPlayer = createAudioPlayer(require('../../assets/initiation_gong.wav'));
    } catch {}
  }
  return gongPlayer;
}

// Audio Context reference for Web fallback
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

/**
 * Pre-warm and unlock audio context on user interaction (e.g. tapping Start Focus).
 */
export function unlockAudio() {
  try {
    getAlarmPlayer();
    getCelebrationPlayer();
    getGongPlayer();
    const ctx = getWebAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {}
}

/**
 * Play a HARD, commanding, warrior-tier battle alert when focus timer finishes.
 * Plays high-energy battle alarm WAV audio + multi-pulse heavy vibration.
 */
export async function playHardCompletionSound() {
  try {
    // 1. Heavy physical vibration alert
    Vibration.vibrate([0, 600, 150, 600, 150, 900]);

    // 2. Audible sound playback via expo-audio player
    const player = getAlarmPlayer();
    if (player) {
      try {
        await player.seekTo(0);
        player.play();
      } catch (e) {
        console.warn('Player play error:', e);
      }
    }

    // 3. Web Audio Synthesizer backup for browsers
    const ctx = getWebAudioContext();
    if (ctx) {
      const now = ctx.currentTime;
      [0, 0.35, 0.7].forEach(offset => {
        const start = now + offset;
        const duration = 0.28;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, start);
        osc.frequency.exponentialRampToValueAtTime(1320, start + duration * 0.7);

        gain.gain.setValueAtTime(0.5, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);

        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'square';
        bassOsc.frequency.setValueAtTime(110, start);
        bassOsc.frequency.exponentialRampToValueAtTime(55, start + duration);

        bassGain.gain.setValueAtTime(0.6, start);
        bassGain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(start);
        bassOsc.stop(start + duration);
      });
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

    const player = getCelebrationPlayer();
    if (player) {
      try {
        await player.seekTo(0);
        player.play();
      } catch {}
    }

    const ctx = getWebAudioContext();
    if (ctx) {
      const now = ctx.currentTime;
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

    const player = getGongPlayer();
    if (player) {
      try {
        await player.seekTo(0);
        player.play();
      } catch {}
    }

    const ctx = getWebAudioContext();
    if (ctx) {
      const now = ctx.currentTime;
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
