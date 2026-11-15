// Starts the API (port 8787) and the Vite dev server (port 5173) together.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

if (!fs.existsSync(viteBin)) {
  console.error('\nVite is not installed yet. Run "npm install" in this folder first, then "npm run dev".\n');
  process.exit(1);
}

const run = (name, args) => {
  const child = spawn(process.execPath, args, { stdio: 'inherit', cwd: root });
  child.on('exit', code => { console.log(`[${name}] exited (${code})`); process.exit(code ?? 0); });
  return child;
};

const api = run('api', [path.join(root, 'server', 'index.js')]);
const web = run('web', [viteBin, '--open']);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { api.kill(); web.kill(); process.exit(0); });
