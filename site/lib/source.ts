import { pages } from 'collections/server';
import { type Locale, localeOfPath, locales, urlOfPath } from './i18n';
import { allNavPages, positionOf } from './nav';

export type DocEntry = (typeof pages)[number];

export interface DocPage {
  /** "pt/api/plans", the file path without .mdx */
  path: string;
  url: string;
  locale: Locale;
  entry: DocEntry;
}

const byPath = new Map<string, DocPage>();
for (const entry of pages) {
  const path = entry.info.path.replace(/\\/g, '/').replace(/\.mdx$/, '');
  byPath.set(path, { path, url: urlOfPath(path), locale: localeOfPath(path), entry });
}

// Every page the menu lists must exist, and every page must be in the menu:
// Mintlify served both, so a gap here is a URL that would stop answering.
{
  const listed = new Set(allNavPages());
  const missing = [...listed].filter((p) => !byPath.has(p));
  const unlisted = [...byPath.keys()].filter((p) => !listed.has(p));
  if (missing.length || unlisted.length) {
    throw new Error(
      `docs.json and the MDX files disagree. In the menu without a file: ${missing.join(', ') || 'none'}. ` +
        `A file not in the menu: ${unlisted.join(', ') || 'none'}.`,
    );
  }
}

export function getPageByPath(path: string): DocPage | undefined {
  return byPath.get(path);
}

/** The page a URL slug points to: [] -> index, ["pt"] -> pt/index, ["pt","api","plans"] -> pt/api/plans. */
export function getPageBySlug(slug: string[] | undefined): DocPage | undefined {
  const parts = slug ?? [];
  if (parts.length === 0) return byPath.get('index');
  const joined = parts.map((p) => decodeURIComponent(p)).join('/');
  return byPath.get(joined) ?? byPath.get(`${joined}/index`);
}

export function allPages(): DocPage[] {
  return [...byPath.values()];
}

/** The slug segments of a page for generateStaticParams. */
export function slugOf(page: DocPage): string[] {
  return page.url === '/' ? [] : page.url.slice(1).split('/');
}

export function titleOf(page: DocPage): string {
  return page.entry.title;
}

/** The label in the menu: sidebarTitle when the page has one. */
export function menuTitleOf(page: DocPage): string {
  return page.entry.sidebarTitle ?? page.entry.title;
}

export function isHome(page: DocPage): boolean {
  return page.entry.mode === 'custom';
}

export function navOf(page: DocPage) {
  return positionOf(page.path, page.locale);
}

/** The same page in each locale, for the language menu and hreflang. */
export function alternatesOf(page: DocPage): Partial<Record<Locale, string>> {
  const bare = page.locale === 'en' ? page.path : page.path.slice(page.locale.length + 1);
  const out: Partial<Record<Locale, string>> = {};
  for (const locale of locales) {
    const path = locale === 'en' ? bare : `${locale}/${bare}`;
    const match = byPath.get(path);
    if (match) out[locale] = match.url;
  }
  return out;
}
