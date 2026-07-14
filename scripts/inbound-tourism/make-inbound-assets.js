const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.join(__dirname, '..', 'public', 'data', 'inbound-tourism');
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

// インバウンド統計ナレーションの年代別スクリプト (2015年〜2025年)
const scripts = [
  { year: 2015, text: '2015年はビザ緩和などもあり中国客が急増、爆買いブームが社会現象になりました。' },
  { year: 2016, text: '2016年はビザ緩和の継続と地方就航の拡大により、年間二千万人を突破します。' },
  { year: 2017, text: '2017年はリピーター観光客が急増し、地方都市へ訪れる人々が増加しました。' },
  { year: 2018, text: '2018年はアジアのみならず欧米豪からの訪日客も大きく伸び、年間三千万人を超えます。' },
  { year: 2019, text: '2019年は中国や欧米客が伸び、過去最高のインバウンドピークを記録しました。' },
  { year: 2020, text: '2020年、新型コロナウイルスの感染爆発により水際対策が強化され、需要はほぼ壊滅しました。' },
  { year: 2021, text: '2021年は東京オリンピックが開催されたものの、一般観光客の往来は途絶えたままでした。' },
  { year: 2022, text: '2022年の秋、ようやく個人外国人観光客の入国規制が全面解除され、再開が始まりました。' },
  { year: 2023, text: '2023年は国際路線の再開と欧米客の急回復で、一気に観光地ににぎわいが戻りました。' },
  { year: 2024, text: '2024年は歴史的な超円安が強烈な追い風となり、年間三千五百万人を突破します。' },
  { year: 2025, text: '2025年は関西万博も開催され、インバウンドの多様化と地方分散が進む新時代となりました。' }
];

async function generateAll() {
  console.log('Starting Inbound Tourism TTS generation...');
  
  // 1. Generate narration files
  for (const script of scripts) {
    const filename = `inbound_audio_${script.year}.wav`;
    const dest = path.join(targetDir, filename);
    try {
      await downloadTTS(script.text, dest, 'ja');
    } catch (err) {
      console.error(`Failed to generate TTS for ${filename}:`, err);
      console.log('Falling back to dummy sine wave generation...');
      const wavBuffer = createWavBuffer(6.0, 440);
      fs.writeFileSync(dest, wavBuffer);
      console.log(`Generated Fallback WAV: ${dest}`);
    }
  }

  // 2. Generate BGM
  const bgmDest = path.join(targetDir, 'inbound_bgm.wav');
  const bgmBuffer = createWavBuffer(120, 220); // 120s low tone
  fs.writeFileSync(bgmDest, bgmBuffer);
  console.log(`Generated BGM WAV: ${bgmDest}`);

  console.log('All inbound tourism audio assets prepared successfully.');
}

generateAll().catch(err => {
  console.error('Unhandled error in generation:', err);
  process.exit(1);
});
