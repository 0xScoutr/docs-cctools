// Shared by the build scripts and the checks: docs.json, the page list in menu
// order, each page's frontmatter and body, and the Cloudflare Pages rules.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = resolve(SITE, '..');
export const OUT = join(SITE, 'out');
export const ORIGIN = 'https://docs.cctools.network';
/** The CCTools MCP server: the data tools and search_docs, the search Mintlify's /mcp offered. */
export const MCP_ENDPOINT = 'https://api.cctools.network/api/mcp';
export const LOCALES = ['en', 'es', 'pt', 'zh'];
export const HTML_LANG = { en: 'en', es: 'es', pt: 'pt-BR', zh: 'zh-CN' };

export const docsJson = JSON.parse(readFileSync(join(ROOT, 'docs.json'), 'utf8'));

export function localeOf(path) {
  const first = path.split('/')[0];
  return LOCALES.includes(first) && first !== 'en' ? first : 'en';
}

export function urlOf(path) {
  if (path === 'index') return '/';
  if (path.endsWith('/index')) return `/${path.slice(0, -'/index'.length)}`;
  return `/${path}`;
}

/** Every page in docs.json, per locale, in menu order, with its tab and group. */
export function navPages() {
  const out = [];
  for (const language of docsJson.navigation.languages) {
    for (const tab of language.tabs) {
      for (const group of tab.groups) {
        for (const path of group.pages) {
          out.push({ path, locale: language.language, tab: tab.tab, group: group.group, url: urlOf(path) });
        }
      }
    }
  }
  return out;
}

/** Frontmatter (every value in these files is one double-quoted string) and body. */
export function readPage(path) {
  const raw = readFileSync(join(ROOT, `${path}.mdx`), 'utf8').replace(/\r\n/g, '\n');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) throw new Error(`${path}.mdx has no frontmatter`);
  const data = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([A-Za-z]+):\s*(".*")\s*$/);
    if (!kv) throw new Error(`${path}.mdx: unexpected frontmatter line "${line}"`);
    data[kv[1]] = JSON.parse(kv[2]);
  }
  return { data, body: raw.slice(match[0].length).replace(/^\n+/, '') };
}

/**
 * docs.json redirects as Cloudflare Pages rules: Mintlify's "/:slug*" becomes
 * "/*" in the source and ":splat" in the destination. Order is kept: Pages
 * applies the first rule that matches, and docs.json lists the exact rules
 * before the catch-all one.
 */
export function pagesRedirects() {
  return (docsJson.redirects ?? []).map(({ source, destination, permanent }) => {
    const from = source.replace(/\/:[A-Za-z]+\*$/, '/*');
    const to = destination.replace(/\/:[A-Za-z]+\*$/, '/:splat');
    return { from, to, status: permanent === false ? 302 : 301 };
  });
}

/**
 * The site's own redirects, after docs.json's. /mcp was Mintlify's MCP server, which searched these docs; ours
 * answers the same search with search_docs. 308 keeps the method and the body, so an MCP client's POST arrives as
 * it was sent.
 */
export function extraRedirects() {
  return [{ from: '/mcp', to: MCP_ENDPOINT, status: 308 }];
}

/** Resolve a path against the redirect rules: the target, or undefined. */
export function matchRedirect(rules, pathname) {
  for (const rule of rules) {
    if (rule.from.endsWith('/*')) {
      const base = rule.from.slice(0, -2);
      if (pathname.startsWith(`${base}/`)) {
        const splat = pathname.slice(base.length + 1);
        return { ...rule, location: rule.to.replace(':splat', splat) };
      }
    } else if (pathname === rule.from) {
      return { ...rule, location: rule.to };
    }
  }
  return undefined;
}
