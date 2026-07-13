import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

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

  // Fallback to first argument
  if (!jsonPath && args[0] && !args[0].startsWith('-')) {
    jsonPath = args[0];
  }

  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // JSONが指定されている場合、resolved-props.jsonとして保存してStudioに渡す
  if (jsonPath) {
    const absoluteJsonPath = path.resolve(process.cwd(), jsonPath);
    if (!fs.existsSync(absoluteJsonPath)) {
      console.error(`Error: JSON file not found at ${absoluteJsonPath}`);
      process.exit(1);
    }

    console.log(`Loading video config: ${absoluteJsonPath}`);
    const config = JSON.parse(fs.readFileSync(absoluteJsonPath, 'utf8'));

    const resolvedPropsPath = path.resolve(publicDir, 'resolved-props.json');
    fs.writeFileSync(resolvedPropsPath, JSON.stringify(config, null, 2));
    console.log(`Props saved: ${resolvedPropsPath}`);

    console.log('\nStarting Remotion Studio with config...');
    console.log('Browser will open. Edit props in the right sidebar → Props panel.\n');

    const studio = spawn(
      'npx',
      ['remotion', 'studio', '--props=public/resolved-props.json'],
      { stdio: 'inherit', shell: true }
    );

    studio.on('exit', (code) => process.exit(code ?? 0));
  } else {
    // JSONなしで起動（デフォルトpropsで開く）
    console.log('Starting Remotion Studio with default props...');
    console.log('Tip: Specify a JSON to load a specific config:');
    console.log('  npm run studio -- public/data/test/video-config.json\n');

    const studio = spawn('npx', ['remotion', 'studio'], {
      stdio: 'inherit',
      shell: true,
    });

    studio.on('exit', (code) => process.exit(code ?? 0));
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
