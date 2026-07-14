const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.join(__dirname, '..', 'public', 'data', 'sushi-culture-ja');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Google TTS API を利用してテキストから音声を生成（ダウンロード）する関数
function downloadTTS(text, filepath, lang = 'ja') {
  return new Promise((resolve, reject) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
    const file = fs.createWriteStream(filepath);
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
      }
    }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to generate TTS: Status Code ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Saved TTS audio: ${filepath}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Generate valid WAV audio buffers (Fallback)
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

// 単一ナレーションのスクリプト定義
const dialogScripts = [
  {
    name: 'audio_narration.wav',
    text: '日本の寿司の心臓部は、実はネタの魚だけではなく、絶妙な温度のシャリなんだよ！',
    fallbackDuration: 7.0
  }
];

async function generateAll() {
  console.log('Starting single narration TTS generation for Tuna...');
  
  // 1. Generate narration file
  for (const script of dialogScripts) {
    const dest = path.join(targetDir, script.name);
    try {
      await downloadTTS(script.text, dest, 'ja');
    } catch (err) {
      console.error(`Failed to generate TTS for ${script.name}:`, err);
      console.log('Falling back to dummy sine wave generation...');
      const wavBuffer = createWavBuffer(script.fallbackDuration, 440);
      fs.writeFileSync(dest, wavBuffer);
      console.log(`Generated Fallback WAV: ${dest}`);
    }
  }

  // 2. Generate BGM
  const bgmDest = path.join(targetDir, 'bgm.wav');
  const bgmBuffer = createWavBuffer(30, 220); // 30s low tone
  fs.writeFileSync(bgmDest, bgmBuffer);
  console.log(`Generated BGM WAV: ${bgmDest}`);

  console.log('Narration audio assets prepared successfully.');
}

generateAll().catch(err => {
  console.error('Unhandled error in generation:', err);
  process.exit(1);
});
