import type { ReactNode } from 'react';
import type { Locale } from '@/lib/i18n';
import { type NavPosition, site, tabsOf } from '@/lib/nav';
import { type DocPage, titleOf } from '@/lib/source';
import { SiteHeader } from './header';
import { Providers } from './providers';

/** The organization block Mintlify emitted from docs.json seo.organization. */
function OrganizationJsonLd() {
  const data = { '@context': 'https://schema.org', '@type': 'Organization', ...site.organization };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function PageShell({
  page,
  nav,
  alternates,
  sidebar,
  children,
}: {
  page: DocPage;
  nav: NavPosition;
  alternates: Partial<Record<Locale, string>>;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const tabs = tabsOf(page.locale).map((tab) => ({ name: tab.name, icon: tab.icon, href: tab.href }));
  return (
    <Providers locale={page.locale}>
      <OrganizationJsonLd />
      <SiteHeader
        locale={page.locale}
        tabs={tabs}
        activeTab={nav.tabIndex}
        alternates={alternates}
        crumb={{ group: nav.group.name, title: titleOf(page) }}
        drawer={sidebar}
        ctaLabel={site.ctaLabel}
        ctaHref={site.ctaHref}
      />
      {children}
    </Providers>
  );
}
