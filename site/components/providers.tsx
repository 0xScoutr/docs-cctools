'use client';

import { type ReactNode, useEffect } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { defaultLocale, type Locale, localeNames, locales, ui } from '@/lib/i18n';
import CCSearchDialog from './search-dialog';
import { UiProvider } from './ui-context';

/**
 * Theme (light, dark or system, as the class on <html>, which is what
 * Mintlify used), the search dialog and the locale, around every page.
 */
export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = ui[locale];
  return (
    <RootProvider
      theme={{ attribute: 'class', defaultTheme: 'system', enableSystem: true, disableTransitionOnChange: true }}
      search={{ SearchDialog: CCSearchDialog }}
      i18n={{
        locale,
        defaultLanguage: defaultLocale,
        hideLocale: 'default-locale',
        locales: locales.map((l) => ({ locale: l, name: localeNames[l] })),
        translations: {
          Search: t.searchShort,
          'Close Search': t.closeSearch,
          'No results found': t.noResults,
        },
      }}
    >
      <UiProvider locale={locale}>
        {children}
        <SynchroBubble />
      </UiProvider>
    </RootProvider>
  );
}

/** The "Ask Synchro" bubble (it was assistant.js on Mintlify), mounted once. */
function SynchroBubble() {
  useEffect(() => {
    let cancelled = false;
    import('./synchro-widget').then(({ mountSynchro }) => {
      if (!cancelled) mountSynchro();
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
