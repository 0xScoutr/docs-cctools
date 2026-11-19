'use client';

import { Search } from 'lucide-react';
import { useSearchContext } from 'fumadocs-ui/contexts/search';

export function SearchButton({ label }: { label: string }) {
  const { setOpenSearch } = useSearchContext();
  return (
    <button type="button" className="cc-btn-plain" onClick={() => setOpenSearch(true)}>
      <Search aria-hidden="true" width={16} height={16} strokeWidth={1.75} />
      {label}
    </button>
  );
}
