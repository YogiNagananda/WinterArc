const fs = require('fs');
const path = require('path');

function createWavBuffer(sampleRate, durationSeconds, sampleGenerator) {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * 2; // 16-bit = 2 bytes per sample
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 = mono)
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  buffer.writeUInt16LE(2, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample (16 bits)

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write PCM samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = sampleGenerator(t, durationSeconds);
    // Clamp to -1.0 to 1.0
    const clamped = Math.max(-1, Math.min(1, sample));
    const intSample = Math.floor(clamped * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

const sampleRate = 44100;
const assetsDir = path.join(__dirname, '..', 'assets');

// 1. HARMONIC CRYSTAL CHIME (Focus Timer Complete): Rich, crystal-clear bell chime & singing bowl with soothing decay
const battleAlarm = createWavBuffer(sampleRate, 3.2, (t) => {
  let sig = 0;

  // First Bell Strike (C5 chord) at t = 0s
  if (t >= 0) {
    const dt = t;
    const env = Math.exp(-2.2 * dt);
    const f1 = 523.25; // C5
    const o1 = Math.sin(2 * Math.PI * f1 * dt) * 0.45;
    const o2 = Math.sin(2 * Math.PI * f1 * 1.5 * dt) * 0.25; // G5 (5th)
    const o3 = Math.sin(2 * Math.PI * f1 * 2.0 * dt) * 0.20; // C6 (octave)
    const o4 = Math.sin(2 * Math.PI * f1 * 2.756 * dt) * 0.10; // metallic bell sheen
    sig += (o1 + o2 + o3 + o4) * env;
  }

  // Second Ascending Bloom (G5 + E6 chord) at t = 0.3s
  if (t >= 0.3) {
    const dt = t - 0.3;
    const env = Math.exp(-1.8 * dt);
    const f2 = 783.99; // G5
    const o1 = Math.sin(2 * Math.PI * f2 * dt) * 0.40;
    const o2 = Math.sin(2 * Math.PI * 1046.50 * dt) * 0.35; // C6
    const o3 = Math.sin(2 * Math.PI * 1318.51 * dt) * 0.22; // E6
    const o4 = Math.sin(2 * Math.PI * 1567.98 * dt) * 0.12; // G6
    sig += (o1 + o2 + o3 + o4) * env;
  }

  // Third High Crystal Sparkle at t = 0.6s
  if (t >= 0.6) {
    const dt = t - 0.6;
    const env = Math.exp(-1.6 * dt);
    const o1 = Math.sin(2 * Math.PI * 1046.50 * dt) * 0.30; // C6
    const o2 = Math.sin(2 * Math.PI * 1567.98 * dt) * 0.20; // G6
    const o3 = Math.sin(2 * Math.PI * 2093.00 * dt) * 0.15; // C7
    sig += (o1 + o2 + o3) * env;
  }

  // Warm resonant singing bowl sub-tone (261.63Hz C4)
  const bowlEnv = Math.exp(-1.1 * t);
  const bowl = Math.sin(2 * Math.PI * 261.63 * t) * 0.25 * bowlEnv;

  return (sig * 0.65 + bowl) * 0.85;
});

// 2. REWARD CLAIM & TASK SUCCESS DING: Crystal 2-tone "Successfully Completed" chime with sparkling resolve
const successDing = createWavBuffer(sampleRate, 1.2, (t) => {
  let sig = 0;

  // Tone 1: E5 (659.25Hz) + G5 (783.99Hz) at t = 0.0s
  if (t >= 0 && t < 0.7) {
    const dt = t;
    const env = Math.exp(-6.0 * dt);
    const o1 = Math.sin(2 * Math.PI * 659.25 * dt) * 0.40;
    const o2 = Math.sin(2 * Math.PI * 783.99 * dt) * 0.25;
    const o3 = Math.sin(2 * Math.PI * 1318.51 * dt) * 0.15; // harmonic ping
    sig += (o1 + o2 + o3) * env;
  }

  // Tone 2: C6 (1046.50Hz) + E6 (1318.51Hz) triumphant resolve at t = 0.12s
  if (t >= 0.12) {
    const dt = t - 0.12;
    const env = Math.exp(-3.2 * dt);
    const o1 = Math.sin(2 * Math.PI * 1046.50 * dt) * 0.45;
    const o2 = Math.sin(2 * Math.PI * 1318.51 * dt) * 0.30;
    const o3 = Math.sin(2 * Math.PI * 2093.00 * dt) * 0.18; // sparkling octave
    const o4 = Math.sin(2 * Math.PI * 2637.02 * dt) * 0.10; // crystal sheen
    sig += (o1 + o2 + o3 + o4) * env;
  }

  // Warm acoustic body at t = 0.12s
  if (t >= 0.12) {
    const dt = t - 0.12;
    const warm = Math.sin(2 * Math.PI * 523.25 * dt) * 0.18 * Math.exp(-4.0 * dt);
    sig += warm;
  }

  return sig * 0.85;
});

// 3. INITIATION GONG (Challenge Accepted): Deep resonant gong with metallic shimmer
const gong = createWavBuffer(sampleRate, 2.5, (t) => {
  const fundamental = Math.sin(2 * Math.PI * 65 * t);
  const harmonic1 = 0.6 * Math.sin(2 * Math.PI * 130 * t);
  const shimmer = 0.25 * Math.sin(2 * Math.PI * 440 * t) * Math.sin(2 * Math.PI * 7 * t);
  const env = Math.exp(-1.5 * t);
  return (fundamental + harmonic1 + shimmer) * env * 0.75;
});

fs.writeFileSync(path.join(assetsDir, 'battle_alarm.wav'), battleAlarm);
fs.writeFileSync(path.join(assetsDir, 'celebration.wav'), successDing);
fs.writeFileSync(path.join(assetsDir, 'success_ding.wav'), successDing);
fs.writeFileSync(path.join(assetsDir, 'initiation_gong.wav'), gong);

console.log('Successfully generated audio assets in mobile/assets/: battle_alarm.wav, celebration.wav, success_ding.wav, initiation_gong.wav');
