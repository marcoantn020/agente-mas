#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const ASSETS = resolve(dirname(fileURLToPath(import.meta.url)), '../assets');
const REQUIRED_SKILLS = ['jira-card-maker', 'clean-code', 'testing-patterns', 'code-review'];

const args = process.argv.slice(2);
const has = (...flags) => flags.some((f) => args.includes(f));

if (has('--help', '-h')) {
  console.log(`Uso: npx mas-pipeline [opções]

  --local      instala em ./.claude (projeto atual) em vez de ~/.claude
  --dry-run    mostra o que seria instalado sem copiar nada
  --version    mostra a versão`);
  process.exit(0);
}

if (has('--version', '-v')) {
  const pkg = JSON.parse(readFileSync(resolve(ASSETS, '../package.json'), 'utf8'));
  console.log(pkg.version);
  process.exit(0);
}

const claudeDir = has('--local') ? resolve(process.cwd(), '.claude') : resolve(homedir(), '.claude');
const dryRun = has('--dry-run');

const agents = readdirSync(resolve(ASSETS, 'agents'));
const skills = readdirSync(resolve(ASSETS, 'skills'));

console.log(`\nmas-pipeline → ${claudeDir}${dryRun ? ' (dry-run)' : ''}\n`);

for (const [kind, names] of [['agents', agents], ['skills', skills]]) {
  const dest = resolve(claudeDir, kind);
  if (!dryRun) mkdirSync(dest, { recursive: true });
  for (const name of names) {
    const target = resolve(dest, name);
    const action = existsSync(target) ? 'atualizado' : 'instalado';
    if (!dryRun) cpSync(resolve(ASSETS, kind, name), target, { recursive: true });
    console.log(`  ✓ ${kind}/${name} ${dryRun ? '' : action}`);
  }
}

const globalSkills = resolve(homedir(), '.claude', 'skills');
const missing = REQUIRED_SKILLS.filter(
  (s) => !existsSync(resolve(claudeDir, 'skills', s)) && !existsSync(resolve(globalSkills, s)),
);

if (missing.length) {
  console.log(`\n⚠  Skills de apoio não encontradas: ${missing.join(', ')}`);
  console.log('   Os agents funcionam sem elas, mas o card e a revisão ficam melhores com elas.');
  console.log('   Instale com: npx unac-agents --target=claude-code --scope=global');
}

console.log('\nPronto. Reinicie o Claude Code e use: /mas-pipeline <ITEM-ID> <descrição>\n');
