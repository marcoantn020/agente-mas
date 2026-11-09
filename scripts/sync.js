import { cpSync, existsSync, readdirSync, rmSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = process.env.MAS_SOURCE ?? resolve(homedir(), '.claude');

const skillSrc = resolve(source, 'skills', 'mas-pipeline');
if (!existsSync(skillSrc)) {
  console.log(`sync: ${skillSrc} não existe, mantendo assets atuais.`);
  process.exit(0);
}

rmSync(resolve(root, 'assets'), { recursive: true, force: true });
cpSync(skillSrc, resolve(root, 'assets', 'skills', 'mas-pipeline'), { recursive: true });

for (const file of readdirSync(resolve(source, 'agents')).filter((f) => /^mas-.*\.md$/.test(f))) {
  cpSync(resolve(source, 'agents', file), resolve(root, 'assets', 'agents', file));
  console.log(`sync: agents/${file}`);
}
console.log('sync: skills/mas-pipeline');
