import docsConfig from '../../docs.json';
import { defaultLocale, type Locale, locales, urlOfPath } from './i18n';

/**
 * The navigation comes from docs.json, the file Mintlify read: the same tabs,
 * groups and order per locale. docs.json stays the single source, so the
 * cctools2 generator and anyone editing the menu keep one file.
 */

interface DocsJsonGroup {
  group: string;
  icon?: string;
  pages: string[];
}

interface DocsJsonTab {
  tab: string;
  icon?: string;
  groups: DocsJsonGroup[];
}

interface DocsJsonLanguage {
  language: string;
  default?: boolean;
  tabs: DocsJsonTab[];
}

export interface NavGroup {
  name: string;
  icon?: string;
  pages: string[];
}

export interface NavTab {
  name: string;
  icon?: string;
  groups: NavGroup[];
  /** The first page of the tab, where the tab links to. */
  href: string;
}

export interface NavPosition {
  locale: Locale;
  tabIndex: number;
  tab: NavTab;
  group: NavGroup;
  /** Pages of the same tab, in menu order, for Previous and Next. */
  previous?: string;
  next?: string;
}

const languages = (docsConfig as { navigation: { languages: DocsJsonLanguage[] } }).navigation.languages;

const tabsByLocale = new Map<Locale, NavTab[]>();
for (const locale of locales) {
  const entry = languages.find((l) => l.language === locale);
  if (!entry) throw new Error(`docs.json has no navigation for "${locale}"`);
  tabsByLocale.set(
    locale,
    entry.tabs.map((tab) => ({
      name: tab.tab,
      icon: tab.icon,
      groups: tab.groups.map((g) => ({ name: g.group, icon: g.icon, pages: g.pages })),
      href: urlOfPath(tab.groups[0].pages[0]),
    })),
  );
}

export function tabsOf(locale: Locale): NavTab[] {
  return tabsByLocale.get(locale) ?? tabsByLocale.get(defaultLocale)!;
}

/** Every page path the navigation lists, in order, every locale. */
export function allNavPages(): string[] {
  return locales.flatMap((locale) => tabsOf(locale).flatMap((t) => t.groups.flatMap((g) => g.pages)));
}

export function positionOf(path: string, locale: Locale): NavPosition | undefined {
  const tabs = tabsOf(locale);
  for (let tabIndex = 0; tabIndex < tabs.length; tabIndex++) {
    const tab = tabs[tabIndex];
    const flat = tab.groups.flatMap((g) => g.pages);
    const index = flat.indexOf(path);
    if (index === -1) continue;
    const group = tab.groups.find((g) => g.pages.includes(path))!;
    return {
      locale,
      tabIndex,
      tab,
      group,
      previous: index > 0 ? flat[index - 1] : undefined,
      next: index < flat.length - 1 ? flat[index + 1] : undefined,
    };
  }
  return undefined;
}

export interface Redirect {
  source: string;
  destination: string;
}

export const redirects: Redirect[] = (docsConfig as { redirects?: Redirect[] }).redirects ?? [];

export const site = {
  name: (docsConfig as { name: string }).name,
  description: (docsConfig as { description: string }).description,
  ctaLabel: (docsConfig as { navbar: { primary: { label: string } } }).navbar.primary.label,
  ctaHref: (docsConfig as { navbar: { primary: { href: string } } }).navbar.primary.href,
  socials: (docsConfig as { footer: { socials: Record<string, string> } }).footer.socials,
  metatags: (docsConfig as { seo: { metatags: Record<string, string> } }).seo.metatags,
  organization: (docsConfig as { seo: { organization: Record<string, unknown> } }).seo.organization,
};
