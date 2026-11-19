'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, EllipsisVertical, Menu, Monitor, Moon, Search, Sun, X } from 'lucide-react';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { useTheme } from 'fumadocs-ui/provider/base';
import { type Locale, localeNames, locales } from '@/lib/i18n';
import { Icon } from './icon';
import { useUi } from './ui-context';
import { useDismiss } from './use-dismiss';

export interface HeaderTab {
  name: string;
  icon?: string;
  href: string;
}

interface HeaderProps {
  locale: Locale;
  tabs: HeaderTab[];
  activeTab: number;
  alternates: Partial<Record<Locale, string>>;
  /** The group and the page title, for the mobile breadcrumb row. */
  crumb?: { group: string; title: string };
  /** The menu of the current tab, rendered on the server, shown in the mobile drawer. */
  drawer?: ReactNode;
  ctaLabel: string;
  ctaHref: string;
}

function Logo({ href }: { href: string }) {
  return (
    <Link className="cc-logo" href={href} aria-label="CCTools docs">
      <img className="cc-logo-light" src="/logo/light.svg" alt="CCTools" width={96} height={24} />
      <img className="cc-logo-dark" src="/logo/dark.svg" alt="CCTools" width={96} height={24} />
    </Link>
  );
}

function LanguageMenu({ locale, alternates }: { locale: Locale; alternates: HeaderProps['alternates'] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const t = useUi();
  return (
    <div className="cc-menu" ref={ref}>
      <button
        type="button"
        className="cc-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t.language}: ${localeNames[locale]}`}
        onClick={() => setOpen((v) => !v)}
      >
        {localeNames[locale]}
        <ChevronDown aria-hidden="true" width={16} height={16} strokeWidth={1.75} />
      </button>
      {open ? (
        <ul className="cc-menu-list" role="menu">
          {locales.map((l) => (
            <li key={l} role="none">
              <Link
                role="menuitem"
                className="cc-menu-item"
                href={alternates[l] ?? (l === 'en' ? '/' : `/${l}`)}
                hrefLang={l}
                lang={l}
                aria-current={l === locale ? 'true' : undefined}
                onClick={close}
              >
                {localeNames[l]}
                {l === locale ? <Check className="cc-menu-check" aria-hidden="true" width={15} height={15} /> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const t = useUi();
  const current = mounted ? (theme ?? 'system') : 'system';
  const TriggerIcon = current === 'light' ? Sun : current === 'dark' ? Moon : Monitor;
  const options = [
    { value: 'light', label: t.themeLight, icon: Sun },
    { value: 'dark', label: t.themeDark, icon: Moon },
    { value: 'system', label: t.themeSystem, icon: Monitor },
  ];
  return (
    <div className="cc-menu" ref={ref}>
      <button
        type="button"
        className="cc-icon-btn cc-theme-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.theme}
        onClick={() => setOpen((v) => !v)}
      >
        <TriggerIcon aria-hidden="true" width={15} height={15} strokeWidth={1.75} />
      </button>
      {open ? (
        <ul className="cc-menu-list is-right" role="menu">
          {options.map((o) => (
            <li key={o.value} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={current === o.value}
                className="cc-menu-item"
                onClick={() => {
                  setTheme(o.value);
                  close();
                }}
              >
                <o.icon aria-hidden="true" width={15} height={15} strokeWidth={1.75} />
                {o.label}
                {current === o.value ? (
                  <Check className="cc-menu-check" aria-hidden="true" width={15} height={15} />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SearchTrigger() {
  const { setOpenSearch } = useSearchContext();
  const t = useUi();
  return (
    <button type="button" className="cc-search-trigger" onClick={() => setOpenSearch(true)} aria-label={t.searchShort}>
      <Search aria-hidden="true" width={16} height={16} strokeWidth={1.75} />
      <span>{t.search}</span>
      <kbd>Ctrl K</kbd>
    </button>
  );
}

function MoreMenu({ locale, alternates, ctaLabel, ctaHref }: Pick<HeaderProps, 'locale' | 'alternates' | 'ctaLabel' | 'ctaHref'>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const t = useUi();
  const current = mounted ? (theme ?? 'system') : 'system';
  return (
    <div className="cc-menu" ref={ref}>
      <button
        type="button"
        className="cc-icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.moreMenu}
        onClick={() => setOpen((v) => !v)}
      >
        <EllipsisVertical aria-hidden="true" strokeWidth={1.75} />
      </button>
      {open ? (
        <ul className="cc-menu-list is-right" role="menu" style={{ minWidth: 220 }}>
          <li role="none">
            <a role="menuitem" className="cc-menu-item" href={ctaHref} onClick={close}>
              {ctaLabel}
              <ChevronRight className="cc-menu-check" aria-hidden="true" width={15} height={15} />
            </a>
          </li>
          <li role="separator" style={{ height: 1, margin: '6px 4px', background: 'var(--cc-line)' }} />
          {locales.map((l) => (
            <li key={l} role="none">
              <Link
                role="menuitem"
                className="cc-menu-item"
                href={alternates[l] ?? (l === 'en' ? '/' : `/${l}`)}
                hrefLang={l}
                lang={l}
                aria-current={l === locale ? 'true' : undefined}
                onClick={close}
              >
                {localeNames[l]}
                {l === locale ? <Check className="cc-menu-check" aria-hidden="true" width={15} height={15} /> : null}
              </Link>
            </li>
          ))}
          <li role="separator" style={{ height: 1, margin: '6px 4px', background: 'var(--cc-line)' }} />
          {(
            [
              ['light', t.themeLight, Sun],
              ['dark', t.themeDark, Moon],
              ['system', t.themeSystem, Monitor],
            ] as const
          ).map(([value, label, IconFor]) => (
            <li key={value} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={current === value}
                className="cc-menu-item"
                onClick={() => {
                  setTheme(value);
                  close();
                }}
              >
                <IconFor aria-hidden="true" width={15} height={15} strokeWidth={1.75} />
                {label}
                {current === value ? <Check className="cc-menu-check" aria-hidden="true" width={15} height={15} /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Drawer({
  open,
  onClose,
  tabs,
  activeTab,
  homeHref,
  children,
}: {
  open: boolean;
  onClose: () => void;
  tabs: HeaderTab[];
  activeTab: number;
  homeHref: string;
  children?: ReactNode;
}) {
  const t = useUi();
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('cc-drawer-open');
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.body.classList.remove('cc-drawer-open');
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="cc-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="cc-drawer" role="dialog" aria-modal="true" aria-label={t.menu}>
        <div className="cc-drawer-head">
          <Logo href={homeHref} />
          <button type="button" className="cc-icon-btn" onClick={onClose} aria-label={t.closeMenu}>
            <X aria-hidden="true" width={20} height={20} strokeWidth={1.75} />
          </button>
        </div>
        <nav className="cc-drawer-tabs" aria-label="Sections">
          {tabs.map((tab, i) => (
            <Link key={tab.href} href={tab.href} aria-current={i === activeTab ? 'page' : undefined} onClick={onClose}>
              {tab.icon ? <Icon icon={tab.icon} size={15} /> : null}
              {tab.name}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </>
  );
}

export function SiteHeader({ locale, tabs, activeTab, alternates, crumb, drawer, ctaLabel, ctaHref }: HeaderProps) {
  const t = useUi();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const pathname = usePathname();
  const { setOpenSearch } = useSearchContext();
  const homeHref = locale === 'en' ? '/' : `/${locale}`;

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <header className="cc-header">
      <a className="cc-skip" href="#cc-content">
        {t.skipToContent}
      </a>
      <div className="cc-header-inner cc-header-desktop">
        <div className="cc-header-row">
          <div className="cc-header-left">
            <Logo href={homeHref} />
            <LanguageMenu locale={locale} alternates={alternates} />
          </div>
          <SearchTrigger />
          <div className="cc-header-right">
            <a className="cc-cta" href={ctaHref}>
              {ctaLabel}
              <ChevronRight aria-hidden="true" width={16} height={16} strokeWidth={2} />
            </a>
            <ThemeMenu />
          </div>
        </div>
        <nav aria-label="Sections">
          <ul className="cc-tabs">
            {tabs.map((tab, i) => (
              <li key={tab.href}>
                <Link className="cc-tab" href={tab.href} aria-current={i === activeTab ? 'page' : undefined}>
                  {tab.icon ? <Icon icon={tab.icon} size={16} /> : null}
                  {tab.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="cc-header-inner cc-header-mobile">
        <div className="cc-mobile-row">
          <Logo href={homeHref} />
          <div className="cc-mobile-actions">
            <button type="button" className="cc-icon-btn" onClick={() => setOpenSearch(true)} aria-label={t.searchShort}>
              <Search aria-hidden="true" strokeWidth={1.75} />
            </button>
            <MoreMenu locale={locale} alternates={alternates} ctaLabel={ctaLabel} ctaHref={ctaHref} />
          </div>
        </div>
        <div className="cc-crumb-row">
          <button
            type="button"
            className="cc-icon-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label={t.menu}
            aria-expanded={drawerOpen}
          >
            <Menu aria-hidden="true" width={20} height={20} strokeWidth={1.75} />
          </button>
          {crumb ? (
            <div className="cc-crumb">
              <span>{crumb.group}</span>
              <ChevronRight aria-hidden="true" strokeWidth={1.75} />
              <span>{crumb.title}</span>
            </div>
          ) : null}
        </div>
      </div>
      <Drawer open={drawerOpen} onClose={closeDrawer} tabs={tabs} activeTab={activeTab} homeHref={homeHref}>
        {drawer}
      </Drawer>
    </header>
  );
}
