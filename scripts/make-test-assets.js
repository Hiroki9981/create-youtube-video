const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 1. Copy generated images from artifact folder to data/
const sourceImages = [
  'C:\\Users\\Motomitsu Hiroki\\.gemini\\antigravity-ide\\brain\\58f180c9-7229-405c-8b3c-b52b57fe63e9\\scene_one_tech_1783860558892.png',
  'C:\\Users\\Motomitsu Hiroki\\.gemini\\antigravity-ide\\brain\\58f180c9-7229-405c-8b3c-b52b57fe63e9\\scene_two_digital_1783860583680.png',
  'C:\\Users\\Motomitsu Hiroki\\.gemini\\antigravity-ide\\brain\\58f180c9-7229-405c-8b3c-b52b57fe63e9\\scene_three_city_1783860597422.png'
];

sourceImages.forEach((srcPath, idx) => {
  const destPath = path.join(dataDir, `scene${idx + 1}.png`);
  try {
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${srcPath} -> ${destPath}`);
    } else {
      console.warn(`Source image not found: ${srcPath}`);
    }
  } catch (err) {
    console.error(`Failed to copy image ${idx + 1}:`, err);
  }
});

// 2. Generate valid WAV audio buffers
function createWavBuffer(durationSeconds, frequency = 440, sampleRate = 8000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * blockAlign;
  const chunkSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(chunkSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write sine wave data
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t);
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}

// Generate the testing audio files
const audioConfigs = [
  { name: 'audio1.wav', duration: 3, freq: 440 },  // 3s tone
  { name: 'audio2.wav', duration: 4.5, freq: 550 },  // 4.5s tone
  { name: 'audio3.wav', duration: 6, freq: 660 },  // 6s tone
  { name: 'bgm.wav', duration: 15, freq: 220 }    // 15s low bgm tone
];

audioConfigs.forEach(cfg => {
  const filePath = path.join(dataDir, cfg.name);
  const wavBuffer = createWavBuffer(cfg.duration, cfg.freq);
  fs.writeFileSync(filePath, wavBuffer);
  console.log(`Generated WAV: ${filePath} (${cfg.duration} seconds)`);
});

console.log('All mock assets prepared successfully.');
