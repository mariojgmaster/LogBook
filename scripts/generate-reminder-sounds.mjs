import { mkdirSync, writeFileSync } from 'node:fs';

const outputDirectory = new URL('../public/sounds/', import.meta.url);
mkdirSync(outputDirectory, { recursive: true });

const sampleRate = 22_050;
const sounds = [
  [440, 660, 700],
  [660, 990, 650],
  [180, 240, 500],
  [880, 1320, 550],
  [260, 390, 900],
];

for (const [index, [primary, harmonic, durationMs]] of sounds.entries()) {
  const samples = Math.floor((sampleRate * durationMs) / 1000);
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let sample = 0; sample < samples; sample += 1) {
    const time = sample / sampleRate;
    const attack = Math.min(1, sample / (sampleRate * 0.02));
    const decay = Math.max(0, 1 - sample / samples) ** 2;
    const wave =
      Math.sin(2 * Math.PI * primary * time) * 0.7 + Math.sin(2 * Math.PI * harmonic * time) * 0.3;
    buffer.writeInt16LE(Math.round(wave * attack * decay * 13_000), 44 + sample * 2);
  }
  writeFileSync(new URL(`reminder-0${index + 1}.wav`, outputDirectory), buffer);
}
