import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getAudioDurationInSeconds } from '@remotion/media-utils';

// Helper to get video duration on server-side using Remotion's internal ffprobe
function getVideoDurationServer(videoPath: string): number | undefined {
  try {
    const ffprobePath = path.resolve(process.cwd(), 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffprobe.exe');
    if (fs.existsSync(ffprobePath)) {
      const output = execSync(`"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`, { encoding: 'utf8' });
      const seconds = parseFloat(output.trim());
      if (!isNaN(seconds)) {
        return seconds;
      }
    }
  } catch (e) {
    // Ignore error and fallback
  }
  return undefined;
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let jsonPath = '';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json' || args[i] === '-j') {
      jsonPath = args[i + 1];
      i++;
    } else if (args[i].startsWith('--json=')) {
      jsonPath = args[i].split('=')[1];
    }
  }

  // Fallback to first argument if not explicitly passed with --json
  if (!jsonPath && args[0] && !args[0].startsWith('-')) {
    jsonPath = args[0];
  }

  if (!jsonPath) {
    console.error('Error: Please specify the input JSON file path.');
    console.error('Usage: npm run generate -- <path-to-json>');
    console.error('Example: npm run generate -- public/data/video-config.json');
    process.exit(1);
  }

  const absoluteJsonPath = path.resolve(process.cwd(), jsonPath);
  if (!fs.existsSync(absoluteJsonPath)) {
    console.error(`Error: JSON file not found at ${absoluteJsonPath}`);
    process.exit(1);
  }

  console.log(`Reading video config: ${absoluteJsonPath}`);
  const config = JSON.parse(fs.readFileSync(absoluteJsonPath, 'utf8'));

  const fps = config.fps || 30;

  // public/ はアセットの直接の置き場所 - コピー不要
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Resolve durations for scenes
  const resolvedScenes = [];
  let totalDurationFrames = 0;

  for (let idx = 0; idx < config.scenes.length; idx++) {
    const scene = { ...config.scenes[idx] };
    let durationInFrames = scene.durationInFrames;

    // Check if background video file exists, otherwise fallback to static image
    if (scene.video) {
      const videoAbsolutePath = path.resolve(publicDir, scene.video);
      if (fs.existsSync(videoAbsolutePath)) {
        // Try getting video duration on server-side using our helper
        const videoDuration = getVideoDurationServer(videoAbsolutePath);
        if (videoDuration !== undefined) {
          durationInFrames = Math.ceil(videoDuration * fps);
          console.log(`Scene ${idx + 1}: Video duration resolved = ${videoDuration.toFixed(2)}s (${durationInFrames} frames)`);
        }
      } else {
        console.warn(`[Fallback] Warning: Video file not found at ${videoAbsolutePath}. Falling back to static image.`);
        delete scene.video;
      }
    }

    if (durationInFrames === undefined && scene.audio) {
      const audioAbsolutePath = path.resolve(publicDir, scene.audio);
      
      if (fs.existsSync(audioAbsolutePath)) {
        try {
          console.log(`Analyzing audio duration: ${audioAbsolutePath}`);
          const durationSeconds = await getAudioDurationInSeconds(audioAbsolutePath);
          durationInFrames = Math.ceil(durationSeconds * fps);
          console.log(`Scene ${idx + 1}: Calculated duration = ${durationSeconds.toFixed(2)}s (${durationInFrames} frames)`);
        } catch (err) {
          console.warn(`Warning: Could not get audio duration on server-side. Browser will resolve it at render time.`);
        }
      } else {
        console.error(`Warning: Audio file not found at ${audioAbsolutePath}. Browser will resolve it if available.`);
      }
    }

    if (durationInFrames === undefined) {
      console.log(`Scene ${idx + 1}: No audio or video resolved. Using default 5.00s (${5 * fps} frames).`);
      durationInFrames = 5 * fps;
    }

    resolvedScenes.push({
      ...scene,
      durationInFrames
    });
    if (durationInFrames) {
      totalDurationFrames += durationInFrames;
    }
  }

  const resolvedProps = {
    ...config,
    scenes: resolvedScenes,
    totalDurationFrames
  };

  const resolvedPropsPath = path.resolve(publicDir, 'resolved-props.json');
  fs.writeFileSync(resolvedPropsPath, JSON.stringify(resolvedProps, null, 2));
  console.log(`Saved resolved props for Remotion at: ${resolvedPropsPath}`);

  // Create out/ directory for the rendered video
  const outDir = path.resolve(process.cwd(), 'out');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // JSONファイルの名前を元に出力ファイル名を決定する
  const jsonBaseName = path.basename(absoluteJsonPath, '.json');
  let outputName = jsonBaseName;
  if (outputName.startsWith('video-config-')) {
    outputName = outputName.replace('video-config-', '');
  }
  if (outputName === 'config' || outputName === 'video-config' || !outputName) {
    outputName = path.basename(path.dirname(absoluteJsonPath));
  }
  const outputVideoPath = path.resolve(outDir, `${outputName}.mp4`);
  console.log(`Rendering video to: ${outputVideoPath}`);

  const compositionId = config.compositionId || 'MyComp';
  const command = `npx remotion render ${compositionId} "${outputVideoPath}" --props=public/resolved-props.json --overwrite`;
  console.log(`Executing command: ${command}`);
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`\nSuccess! Video rendered successfully at: ${outputVideoPath}`);
  } catch (err) {
    console.error('Error: Remotion render command failed.', err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
