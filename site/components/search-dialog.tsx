'use client';

import { useStaticSearch } from 'fumadocs-core/search/client/orama-static';
import { useI18n } from 'fumadocs-ui/contexts/i18n';
import type { SharedProps } from 'fumadocs-ui/contexts/search';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
} from 'fumadocs-ui/components/dialog/search';

/** The index of a locale, written by app/search/[file]/route.ts. */
export function searchIndexUrl(locale: string | undefined): string {
  return `/search/${locale ?? 'en'}.json`;
}

/**
 * Fumadocs' search dialog on its static client: each locale's index is one
 * JSON file, downloaded the first time the dialog opens on a page of that
 * locale, so each language searches its own pages (Chinese included: the
 * default tokenizer segments CJK text).
 */
export default function CCSearchDialog(props: SharedProps) {
  const { locale } = useI18n();
  const search = useStaticSearch({ from: searchIndexUrl(locale), delayMs: 120 });
  return (
    <SearchDialog {...search} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent className="cc-search-dialog">
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList />
      </SearchDialogContent>
    </SearchDialog>
  );
}
