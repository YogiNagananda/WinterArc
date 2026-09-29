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

// 1. HARD BATTLE ALARM (Focus Timer Complete): 3 piercing, aggressive siren pulses with bass punch
const battleAlarm = createWavBuffer(sampleRate, 2.5, (t) => {
  // Three pulses at 0.0s, 0.8s, 1.6s
  const pulseDuration = 0.65;
  const cycleTime = t % 0.8;
  if (cycleTime > pulseDuration) return 0;

  const pulseT = cycleTime / pulseDuration;
  // Siren frequency ramps from 880Hz to 1320Hz
  const freq = 880 + 440 * pulseT;
  const leadSaw = (2 * ((t * freq) % 1)) - 1; // Sawtooth wave
  const leadSquare = Math.sin(2 * Math.PI * freq * t) > 0 ? 0.7 : -0.7;

  // Heavy sub-bass punch at 110Hz dropping to 55Hz
  const bassFreq = 110 * Math.exp(-3 * pulseT);
  const bass = Math.sin(2 * Math.PI * bassFreq * t);

  // Amplitude envelope (sharp attack, sustained body, quick decay)
  const env = Math.sin(Math.PI * Math.min(1, pulseT * 1.2));
  return (leadSaw * 0.4 + leadSquare * 0.3 + bass * 0.45) * env;
});

// 2. CELEBRATION FANFARE (Full Day / Goal): Ascending major arpeggio
const celebration = createWavBuffer(sampleRate, 1.8, (t) => {
  // C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const noteDuration = 0.35;
  const noteIndex = Math.min(notes.length - 1, Math.floor(t / noteDuration));
  const noteT = (t - noteIndex * noteDuration);
  const freq = notes[noteIndex];

  const osc = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t);
  const env = Math.exp(-2.5 * noteT);
  return osc * env * 0.6;
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
fs.writeFileSync(path.join(assetsDir, 'celebration.wav'), celebration);
fs.writeFileSync(path.join(assetsDir, 'initiation_gong.wav'), gong);

console.log('Successfully generated audio assets in mobile/assets/: battle_alarm.wav, celebration.wav, initiation_gong.wav');
