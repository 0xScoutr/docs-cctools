'use client';

import { createContext, type ReactNode, use, useEffect } from 'react';
import { defaultLocale, htmlLang, type Locale, ui } from '@/lib/i18n';

const LocaleContext = createContext<Locale>(defaultLocale);

/**
 * The page's locale for client components, and <html lang> kept right when
 * the reader moves between locales without a full page load.
 */
export function UiProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = htmlLang[locale];
  }, [locale]);
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale(): Locale {
  return use(LocaleContext);
}

export function useUi() {
  return ui[use(LocaleContext)];
}
