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
 * Play a rich, satisfying, harmonic crystal bell chime when focus timer finishes.
 * Plays high-quality harmonic chime WAV audio + crisp double haptic pulse.
 */
export async function playHardCompletionSound() {
  try {
    // 1. Crisp, premium double haptic pulse
    Vibration.vibrate([0, 150, 80, 250]);

    // 2. Audible sound playback via expo-audio player
    const player = getAlarmPlayer();
    if (player) {
      try {
        player.volume = 1.0;
        await player.seekTo(0);
        player.play();
      } catch (e) {
        console.warn('Player play error:', e);
      }
    }

    // 3. Web Audio Synthesizer backup for browsers (pure sinusoidal harmonic bell chime)
    const ctx = getWebAudioContext();
    if (ctx) {
      const now = ctx.currentTime;

      // Chord 1: Warm C5 + G5 strike
      [523.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const gainVal = 0.35 / (idx + 1);
        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.0);
      });

      // Chord 2: Ascending bloom chord at +0.28s (G5, C6, E6, G6)
      [783.99, 1046.5, 1318.51, 1567.98].forEach((freq, idx) => {
        const start = now + 0.28;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        const gainVal = 0.3 / (idx + 1);
        gain.gain.setValueAtTime(gainVal, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 2.4);
      });

      // Singing bowl sub-tone (261.63Hz)
      const bowl = ctx.createOscillator();
      const bowlGain = ctx.createGain();
      bowl.type = 'sine';
      bowl.frequency.setValueAtTime(261.63, now);
      bowlGain.gain.setValueAtTime(0.25, now);
      bowlGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
      bowl.connect(bowlGain);
      bowlGain.connect(ctx.destination);
      bowl.start(now);
      bowl.stop(now + 2.5);
    }
  } catch (err) {
    console.warn('Sound playback notice:', err);
  }
}

export const playFocusCompletionSound = playHardCompletionSound;

/**
 * Play a sparkling, uplifting 2-tone "Successfully Completed" crystal chime
 * when claiming rewards, clearing daily tasks, or hitting milestones.
 */
export async function playSuccessSound() {
  try {
    // 1. Crisp, cheerful double tap haptic
    Vibration.vibrate([0, 80, 50, 120]);

    // 2. Play success ding WAV via expo-audio player
    const player = getCelebrationPlayer();
    if (player) {
      try {
        player.volume = 1.0;
        await player.seekTo(0);
        player.play();
      } catch (e) {
        console.warn('Player play error:', e);
      }
    }

    // 3. Web Audio Synthesizer backup (crisp, musical 2-tone success ding)
    const ctx = getWebAudioContext();
    if (ctx) {
      const now = ctx.currentTime;

      // Tone 1: E5 (659.25Hz) + G5 (783.99Hz) at t = 0.0s
      [659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.35 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      });

      // Tone 2: C6 (1046.50Hz) + E6 (1318.51Hz) triumphant resolve at t = 0.12s
      [1046.50, 1318.51, 2093.00].forEach((freq, idx) => {
        const start = now + 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.4 / (idx + 1), start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.7);
      });
    }
  } catch (err) {
    console.warn('Success sound playback notice:', err);
  }
}

export const playCelebrationSound = playSuccessSound;

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
