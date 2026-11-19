import { createSearchAPI } from 'fumadocs-core/search/server';
import { isLocale, type Locale, locales } from '@/lib/i18n';
import { allPages, isHome, navOf, titleOf } from '@/lib/source';

/**
 * The static search indexes: one JSON file per locale (/search/en.json,
 * /search/es.json, /search/pt.json, /search/zh.json), written at build. The
 * search dialog downloads only its own locale's file the first time it opens,
 * so each language searches its own pages. The default tokenizer segments
 * Chinese text, so zh needs no extra setup. The home pages are left out: they
 * hold links, not text.
 */
export const dynamic = 'force-static';
export const revalidate = false;
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ file: `${locale}.json` }));
}

function apiFor(locale: Locale) {
  return createSearchAPI('advanced', {
    indexes: allPages()
      .filter((page) => page.locale === locale && !isHome(page))
      .map((page) => ({
        id: page.url,
        url: page.url,
        title: titleOf(page),
        description: page.entry.description,
        breadcrumbs: [navOf(page)?.group.name].filter((v): v is string => Boolean(v)),
        structuredData: page.entry.structuredData,
      })),
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const locale = file.replace(/\.json$/, '');
  if (!isLocale(locale)) return new Response('Not found', { status: 404 });
  return apiFor(locale).staticGET();
}
