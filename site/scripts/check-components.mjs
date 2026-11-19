// The pages may use only the Mintlify components the site has shims for, and
// only icon names the icon map knows; a new one fails here before it renders
// as a gap. Reads every .mdx file and docs.json.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT, SITE, docsJson } from './lib.mjs';

const mdxSource = readFileSync(join(SITE, 'components', 'mdx.tsx'), 'utf8');
const mapBlock = mdxSource.slice(mdxSource.indexOf('export const mdxComponents'));
const supported = new Set([...mapBlock.matchAll(/^\s+([A-Z][A-Za-z]*)\b/gm)].map((m) => m[1]));

const iconSource = readFileSync(join(SITE, 'components', 'icon.tsx'), 'utf8');
const iconBlock = iconSource.slice(iconSource.indexOf('const icons'));
const icons = new Set([...iconBlock.matchAll(/^\s+'?([a-z-]+)'?:\s+[A-Z]/gm)].map((m) => m[1]));

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'site' || name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.mdx')) out.push(full);
  }
  return out;
}

const problems = [];
const used = new Map();
const files = walk(ROOT);
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  // Skip fenced code, where a "<Tag" is an example, not a component.
  const prose = text.replace(/```[\s\S]*?```/g, '');
  for (const m of prose.matchAll(/<([A-Z][A-Za-z]*)\b/g)) {
    used.set(m[1], (used.get(m[1]) ?? 0) + 1);
    if (!supported.has(m[1])) problems.push(`${relative(ROOT, file)}: <${m[1]}> has no shim in site/components/mdx.tsx`);
  }
  for (const m of prose.matchAll(/\bicon[=:]\s*"([^"]+)"/g)) {
    if (!icons.has(m[1])) problems.push(`${relative(ROOT, file)}: icon "${m[1]}" is not in site/components/icon.tsx`);
  }
}
for (const language of docsJson.navigation.languages) {
  for (const tab of language.tabs) {
    for (const name of [tab.icon, ...tab.groups.map((g) => g.icon)].filter(Boolean)) {
      if (!icons.has(name)) problems.push(`docs.json (${language.language}): icon "${name}" is not in site/components/icon.tsx`);
    }
  }
}

console.log(`${files.length} pages scanned. Components used: ${[...used].map(([k, v]) => `${k} ${v}`).join(', ')}.`);
for (const p of problems) console.log(`FAIL ${p}`);
console.log(problems.length ? `${problems.length} problems` : 'Every component and icon has a shim.');
process.exit(problems.length ? 1 : 0);
