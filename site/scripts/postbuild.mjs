// After `next build` has exported the pages to out/, write what Mintlify used
// to serve beside them, at the same URLs:
//   _redirects        docs.json redirects, as Cloudflare Pages rules, then /mcp
//   _headers          cache and type headers for Cloudflare Pages
//   <page>.md         each page as plain Markdown ("Copy page", "View as Markdown"),
//                     the home pages too (index.md; es/index.md and es.md; ...)
//   llms.txt          the index of the English pages, also at /.well-known/llms.txt
//   llms-full.txt     every English page in full, "# Title" then "Source: <url>",
//                     the layout the cctools2 docs chat parses (docs-retrieval.ts)
//   .well-known/mcp.json  the MCP server that took over from Mintlify's: ours
//   sitemap.xml, robots.txt
// and set <html lang> in the Spanish, Portuguese and Chinese HTML files.
import { copyFileSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import {
  HTML_LANG,
  LOCALES,
  MCP_ENDPOINT,
  ORIGIN,
  OUT,
  docsJson,
  extraRedirects,
  navPages,
  pagesRedirects,
  readPage,
} from './lib.mjs';
import { createConverter } from './mdx-to-md.mjs';

if (!existsSync(OUT)) throw new Error('out/ is missing: run next build first');

const pages = navPages();
const isHome = (p) => readPage(p.path).data.mode === 'custom';

function write(rel, content) {
  const file = join(OUT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content, 'utf8');
}

// 0. A Windows build writes the router's prefetch files into folders
// ("__next.$oc$slug/__PAGE__.txt") where the browser asks for one flat name
// ("__next.$oc$slug.__PAGE__.txt"): next export joins the segment path with
// the OS separator. Flatten them, so a local build serves what a Linux build
// (Cloudflare Pages) writes. A Linux build has no such folder.
function flattenSegments(dir) {
  let moved = 0;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    if (name.startsWith('__next.')) {
      const walkSegments = (d, prefix) => {
        for (const child of readdirSync(d)) {
          const childPath = join(d, child);
          if (statSync(childPath).isDirectory()) walkSegments(childPath, `${prefix}.${child}`);
          else {
            copyFileSync(childPath, join(dir, `${prefix}.${child}`));
            moved++;
          }
        }
      };
      walkSegments(full, name);
      rmSync(full, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    } else {
      moved += flattenSegments(full);
    }
  }
  return moved;
}
const flattened = flattenSegments(OUT);

// 1. Redirects: docs.json's, then the site's own (/mcp, see lib.mjs).
const rules = [...pagesRedirects(), ...extraRedirects()];
write('_redirects', `${rules.map((r) => `${r.from} ${r.to} ${r.status}`).join('\n')}\n`);

// 2. Headers.
write(
  '_headers',
  [
    '/_next/static/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '/*.md',
    '  Content-Type: text/markdown; charset=utf-8',
    '/llms.txt',
    '  Content-Type: text/plain; charset=utf-8',
    '/llms-full.txt',
    '  Content-Type: text/plain; charset=utf-8',
    '/.well-known/llms.txt',
    '  Content-Type: text/plain; charset=utf-8',
    '/.well-known/mcp.json',
    '  Content-Type: application/json; charset=utf-8',
    '  Access-Control-Allow-Origin: *',
    '/*',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '',
  ].join('\n'),
);

// 3. One Markdown file per page, beside its HTML: the MDX as plain Markdown
// (no MDX comment, import or component tag; Mintlify's had none either). A
// home page is written at its file path and at its URL, as Mintlify served
// both: index.md; es/index.md and es.md; pt/index.md and pt.md; ...
const converters = Object.fromEntries(LOCALES.map((l) => [l, createConverter({ locale: l })]));
const markdownBody = (page) => converters[page.locale](readPage(page.path).body);

/** Outside code, an MDX tag or comment left in the Markdown is a conversion that failed: stop the build. */
function assertPlainMarkdown(name, markdown) {
  const prose = markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  const left = prose.match(/<\/?[A-Z][A-Za-z]*[\s/>]|\{\/\*/);
  if (left) throw new Error(`${name}: MDX left in the Markdown near "${prose.slice(Math.max(0, left.index - 40), left.index + 40)}"`);
}

let markdownCount = 0;
for (const page of pages) {
  const { data } = readPage(page.path);
  const head = `# ${data.title}\n\n${data.description ? `> ${data.description}\n\n` : ''}`;
  const markdown = `${head}${markdownBody(page)}\n`;
  assertPlainMarkdown(page.path, markdown);
  const targets = new Set([`${page.path}.md`]);
  if (page.url !== '/' && page.url.slice(1) !== page.path) targets.add(`${page.url.slice(1)}.md`);
  for (const target of targets) {
    write(target, markdown);
    markdownCount++;
  }
}

// 4. llms.txt and llms-full.txt: the English pages, in menu order (as
// Mintlify's were; the cctools2 docs chat reads llms-full.txt and is tuned to
// the English corpus).
const english = pages.filter((p) => p.locale === 'en' && !isHome(p));
const llms = [
  `# ${docsJson.name}`,
  '',
  `> ${docsJson.description}`,
  '',
  'The same pages are available in Spanish (/es), Portuguese (/pt) and Chinese (/zh).',
  '',
  '## Docs',
  '',
  ...english.map((p) => {
    const { data } = readPage(p.path);
    return `- [${data.title}](${ORIGIN}${p.url}.md)${data.description ? `: ${data.description}` : ''}`;
  }),
  '',
].join('\n');
write('llms.txt', llms);
write('.well-known/llms.txt', llms);

const full = english
  .map((p) => {
    const { data } = readPage(p.path);
    return `# ${data.title}\nSource: ${ORIGIN}${p.url}\n\n${markdownBody(p)}\n`;
  })
  .join('\n\n');
assertPlainMarkdown('llms-full.txt', full);
write('llms-full.txt', `${full}\n`);

// 4b. The MCP server. Mintlify served one at /mcp that searched these docs;
// ours, at api.cctools.network, has the same search (search_docs) beside the
// CCTools data tools, so /mcp redirects there and this card describes it.
write(
  '.well-known/mcp.json',
  `${JSON.stringify(
    {
      name: 'cctools',
      title: 'CCTools',
      description:
        'Read-only MCP server of CCTools, the public record of the Canton Network: a search of this documentation (search_docs) and the CCTools data tools (projects, campaigns, network figures, governance, news, CIPs). No key and no account.',
      url: MCP_ENDPOINT,
      transport: { type: 'streamable-http', url: MCP_ENDPOINT },
      authentication: { required: false },
      documentation: `${ORIGIN}/api/overview`,
    },
    null,
    2,
  )}\n`,
);

// 5. Sitemap, with each page's other languages, and robots.txt.
const byBare = new Map();
for (const p of pages) {
  const bare = p.locale === 'en' ? p.path : p.path.slice(p.locale.length + 1);
  if (!byBare.has(bare)) byBare.set(bare, {});
  byBare.get(bare)[p.locale] = p.url;
}
const urls = pages.map((p) => {
  const bare = p.locale === 'en' ? p.path : p.path.slice(p.locale.length + 1);
  const alts = byBare.get(bare);
  const links = LOCALES.filter((l) => alts[l])
    .map((l) => `    <xhtml:link rel="alternate" hreflang="${HTML_LANG[l]}" href="${ORIGIN}${alts[l] === '/' ? '' : alts[l]}"/>`)
    .join('\n');
  const loc = `${ORIGIN}${p.url === '/' ? '' : p.url}`;
  return `  <url>\n    <loc>${loc}</loc>\n${links}\n  </url>`;
});
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`,
);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);

// 6. <html lang> per locale in the exported HTML.
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}
let langFixed = 0;
for (const file of walk(OUT)) {
  const rel = relative(OUT, file).split(sep).join('/');
  const first = rel.replace(/\.html$/, '').split('/')[0];
  const locale = LOCALES.includes(first) && first !== 'en' ? first : 'en';
  if (locale === 'en') continue;
  const html = readFileSync(file, 'utf8');
  if (!/<html lang="[^"]*"/.test(html)) throw new Error(`${rel}: no <html lang> to set`);
  const next = html.replace(/<html lang="[^"]*"/, `<html lang="${HTML_LANG[locale]}"`);
  writeFileSync(file, next, 'utf8');
  langFixed++;
}

console.log(
  `[postbuild] ${flattened} prefetch files flattened, ${rules.length} redirects, ${markdownCount} Markdown pages, llms.txt and llms-full.txt (${english.length} English pages), ` +
    `sitemap.xml (${urls.length} URLs), robots.txt, <html lang> set in ${langFixed} files`,
);
