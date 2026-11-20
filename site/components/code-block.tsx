'use client';

import { type ComponentProps, useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useUi } from './ui-context';

/** A highlighted block from rehype-code, in the dark island, with a copy button. */
export function CodeBlock({ children, className, style, ...rest }: ComponentProps<'pre'>) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const t = useUi();

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copy() {
    const text = ref.current?.querySelector('code')?.textContent ?? ref.current?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(text.replace(/\n$/, ''));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="cc-code">
      <pre ref={ref} className={className} style={style} {...rest}>
        {children}
      </pre>
      <div className="cc-code-actions">
        <button
          type="button"
          className="cc-icon-btn cc-code-copy"
          onClick={copy}
          aria-label={copied ? t.copiedCode : t.copyCode}
          title={copied ? t.copiedCode : t.copyCode}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
