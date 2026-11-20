'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Synchro on the docs: the same assistant as on cctools.network, not a docs-only bot.
 *
 * The docs hold no chat code. This component loads one script from the site
 * (`/synchro-dock.js`, built in the cctools2 repo from the code the site itself
 * runs), and that script shows the site's own Synchro in a frame: the launcher
 * in the bottom right corner and, once pressed, the chat panel. So the button,
 * the chat and its answers are one implementation on both, and a change there
 * reaches the docs with no change here.
 *
 * What the docs page gives the frame: its path, its title, its theme and its
 * width. What it gets back: whether the panel is open, busy or holds an unread
 * answer, and the launcher's size. A reader signed in to cctools.network is
 * signed in inside the frame (same site); the docs page itself never sees a
 * session, a question or an answer.
 *
 * If the script or the frame cannot load, nothing is shown: no dead button.
 *
 * NEXT_PUBLIC_SYNCHRO_ORIGIN points a local build at a local site
 * (http://localhost:3661); unset, it is https://cctools.network.
 */
const ORIGIN = process.env.NEXT_PUBLIC_SYNCHRO_ORIGIN || 'https://cctools.network';

declare global {
  interface Window {
    cctoolsSynchro?: { open(): void; close(): void; update(): void };
  }
}

export function SynchroDock() {
  const pathname = usePathname();

  useEffect(() => {
    if (document.querySelector('script[data-synchro-dock]')) return;
    const script = document.createElement('script');
    script.src = `${ORIGIN}/synchro-dock.js`;
    script.async = true;
    script.setAttribute('data-synchro-dock', '');
    document.body.appendChild(script);
  }, []);

  // A navigation inside the docs keeps the frame: it is told the new page, once
  // right away and once after the page's title has been written.
  useEffect(() => {
    const frame = requestAnimationFrame(() => window.cctoolsSynchro?.update());
    const later = setTimeout(() => window.cctoolsSynchro?.update(), 500);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(later);
    };
  }, [pathname]);

  return null;
}
