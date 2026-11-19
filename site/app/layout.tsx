import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import 'fumadocs-ui/style.css';
import './base.css';
import './home.css';
import { site } from '@/lib/nav';

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.cctools.network'),
  title: { default: site.name, template: `%s - ${site.name}` },
  description: site.description,
  icons: { icon: '/favicon.png' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#141914' },
  ],
};

/**
 * One root layout for every locale. <html lang> is "en" here and is set per
 * locale in the exported HTML by scripts/postbuild.mjs (es, pt-BR, zh-CN), and
 * again on the client by UiProvider when the reader moves between locales.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
