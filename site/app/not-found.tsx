import type { Metadata } from 'next';
import { NotFoundView } from '@/components/not-found-view';
import { ui } from '@/lib/i18n';

export const metadata: Metadata = {
  title: ui.en.notFoundTitle,
  robots: { index: false },
};

export default function NotFound() {
  return <NotFoundView locale="en" />;
}
