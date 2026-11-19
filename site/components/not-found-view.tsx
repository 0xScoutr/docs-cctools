import Link from 'next/link';
import { type Locale, ui } from '@/lib/i18n';
import { site, tabsOf } from '@/lib/nav';
import { SiteHeader } from './header';
import { Providers } from './providers';
import { SearchButton } from './search-button';

/**
 * The 404 page, one per locale (404.html, es/404.html, pt/404.html,
 * zh/404.html): Cloudflare Pages answers a missing URL with the nearest
 * 404.html, so a missing Chinese page gets the Chinese one.
 */
export function NotFoundView({ locale }: { locale: Locale }) {
  const t = ui[locale];
  const tabs = tabsOf(locale).map((tab) => ({ name: tab.name, icon: tab.icon, href: tab.href }));
  const home = locale === 'en' ? '/' : `/${locale}`;
  const alternates = { en: '/', es: '/es', pt: '/pt', zh: '/zh' };
  return (
    <Providers locale={locale}>
      <SiteHeader
        locale={locale}
        tabs={tabs}
        activeTab={-1}
        alternates={alternates}
        ctaLabel={site.ctaLabel}
        ctaHref={site.ctaHref}
      />
      <main id="cc-content" className="cc-notfound">
        <p className="cc-notfound-code">{t.notFoundEyebrow}</p>
        <h1>{t.notFoundTitle}</h1>
        <p>{t.notFoundText}</p>
        <div className="cc-notfound-actions">
          <Link className="cc-btn-plain is-primary" href={home}>
            {t.notFoundHome}
          </Link>
          <SearchButton label={t.searchShort} />
          {tabs[1] ? (
            <Link className="cc-btn-plain" href={tabs[1].href}>
              {t.notFoundApi}
            </Link>
          ) : null}
        </div>
      </main>
    </Providers>
  );
}
