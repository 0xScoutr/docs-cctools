import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { NotFoundView } from '@/components/not-found-view';
import { PageShell } from '@/components/page-shell';
import { mdxComponents } from '@/components/mdx';
import { PageActions } from '@/components/page-actions';
import { Sidebar } from '@/components/sidebar';
import { Toc } from '@/components/toc';
import { defaultLocale, htmlLang, isLocale, type Locale, locales, ui } from '@/lib/i18n';
import { site } from '@/lib/nav';
import {
  allPages,
  alternatesOf,
  getPageByPath,
  getPageBySlug,
  isHome,
  menuTitleOf,
  navOf,
  slugOf,
  titleOf,
} from '@/lib/source';

/** The endpoint reference: four-column tables of whole paths, so the table of contents gives way below 1536px. */
const WIDE_PAGES = new Set(['api/endpoints']);

export const dynamicParams = false;

/** es/404, pt/404 and zh/404: the localized 404 pages (app/not-found.tsx is the English one). */
function notFoundLocale(slug: string[] | undefined): Locale | undefined {
  if (slug?.length === 2 && slug[1] === '404' && isLocale(slug[0]) && slug[0] !== defaultLocale) return slug[0];
  return undefined;
}

export function generateStaticParams() {
  return [
    ...allPages().map((page) => ({ slug: slugOf(page) })),
    ...locales.filter((l) => l !== defaultLocale).map((l) => ({ slug: [l, '404'] })),
  ];
}

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const missing = notFoundLocale(slug);
  if (missing) return { title: ui[missing].notFoundTitle, robots: { index: false } };
  const page = getPageBySlug(slug);
  if (!page) notFound();
  const alternates = alternatesOf(page);
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    const url = alternates[locale];
    if (url) languages[htmlLang[locale]] = url;
  }
  if (alternates.en) languages['x-default'] = alternates.en;
  const tags = site.metatags;
  const title = titleOf(page);
  return {
    title: isHome(page) ? { absolute: `${title} - ${site.name}` } : title,
    description: page.entry.description,
    alternates: { canonical: page.url, languages },
    openGraph: {
      type: 'website',
      siteName: tags['og:site_name'],
      title,
      description: page.entry.description,
      url: page.url,
      locale: htmlLang[page.locale].replace('-', '_'),
      images: [
        {
          url: tags['og:image'],
          width: Number(tags['og:image:width']),
          height: Number(tags['og:image:height']),
          alt: tags['og:image:alt'],
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: tags['twitter:site'],
      title,
      description: page.entry.description,
      images: [tags['twitter:image']],
    },
  };
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.32l4.37 5.78L17.75 3Zm-1.08 16.17h1.7L7.4 4.74H5.58l11.09 14.43Z" />
    </svg>
  );
}

function Footer({ locale }: { locale: Locale }) {
  const t = ui[locale];
  return (
    <footer className="cc-footer">
      {site.socials.website ? (
        <a href={site.socials.website} aria-label={t.website} target="_blank" rel="noopener noreferrer">
          <Globe aria-hidden="true" strokeWidth={1.75} />
        </a>
      ) : null}
      {site.socials.x ? (
        <a href={site.socials.x} aria-label="X" target="_blank" rel="noopener noreferrer">
          <XLogo />
        </a>
      ) : null}
    </footer>
  );
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const missing = notFoundLocale(slug);
  if (missing) return <NotFoundView locale={missing} />;
  const page = getPageBySlug(slug);
  if (!page) notFound();

  const nav = navOf(page);
  if (!nav) notFound();
  const t = ui[page.locale];
  const Body = page.entry.body;
  const alternates = alternatesOf(page);

  if (isHome(page)) {
    return (
      <PageShell page={page} nav={nav} alternates={alternates} sidebar={<Sidebar tab={nav.tab} currentPath={page.path} />}>
        <main id="cc-content">
          <Body components={mdxComponents} />
        </main>
      </PageShell>
    );
  }

  const previous = nav.previous ? getPageByPath(nav.previous) : undefined;
  const next = nav.next ? getPageByPath(nav.next) : undefined;
  const wide = WIDE_PAGES.has(page.path.replace(/^(es|pt|zh)\//, ''));
  const markdownUrl = `${page.url}.md`;

  return (
    <PageShell page={page} nav={nav} alternates={alternates} sidebar={<Sidebar tab={nav.tab} currentPath={page.path} />}>
      <div className="cc-shell">
        <Sidebar tab={nav.tab} currentPath={page.path} />
        <div className={`cc-main${wide ? ' is-wide' : ''}`}>
          <main id="cc-content" className={`cc-article${wide ? ' is-wide' : ''}`}>
            <p className="cc-eyebrow-crumb">{nav.group.name}</p>
            <div className="cc-title-row">
              <h1 className="cc-page-title">{titleOf(page)}</h1>
              <PageActions markdownUrl={markdownUrl} />
            </div>
            {page.entry.description ? <p className="cc-page-desc">{page.entry.description}</p> : null}
            <PageActions markdownUrl={markdownUrl} className="cc-page-actions-mobile" />
            <div className="cc-prose">
              <Body components={mdxComponents} />
            </div>
            <nav className="cc-pager" aria-label={`${t.previous} / ${t.next}`}>
              {previous ? (
                <Link href={previous.url}>
                  {menuTitleOf(previous)}
                  <small>
                    <ChevronLeft aria-hidden="true" strokeWidth={1.75} />
                    {t.previous}
                  </small>
                </Link>
              ) : null}
              {next ? (
                <Link href={next.url} className="is-next">
                  {menuTitleOf(next)}
                  <small>
                    {t.next}
                    <ChevronRight aria-hidden="true" strokeWidth={1.75} />
                  </small>
                </Link>
              ) : null}
            </nav>
            <Footer locale={page.locale} />
          </main>
          <Toc items={page.entry.toc} />
        </div>
      </div>
    </PageShell>
  );
}
