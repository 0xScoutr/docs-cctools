'use client';

import { AlignLeft } from 'lucide-react';
import { AnchorProvider, TOCItem, type TOCItemType } from 'fumadocs-core/toc';
import { useUi } from './ui-context';

/** "On this page": the h2 and h3 of the page, the one in view marked. */
export function Toc({ items }: { items: TOCItemType[] }) {
  const t = useUi();
  const shown = items.filter((item) => item.depth >= 2 && item.depth <= 3);
  if (shown.length === 0) return null;
  return (
    <AnchorProvider toc={shown} single>
      <nav className="cc-toc" aria-label={t.onThisPage}>
        <p className="cc-toc-title">
          <AlignLeft aria-hidden="true" strokeWidth={1.75} />
          {t.onThisPage}
        </p>
        <ul className="cc-toc-list">
          {shown.map((item) => (
            <li key={item.url}>
              <TOCItem href={item.url} className={`cc-toc-link is-depth-${item.depth}`}>
                {item.title}
              </TOCItem>
            </li>
          ))}
        </ul>
      </nav>
    </AnchorProvider>
  );
}
