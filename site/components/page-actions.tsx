'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, FileText, Plug } from 'lucide-react';
import { MCP_ENDPOINT } from '@/lib/i18n';
import { useUi } from './ui-context';
import { useDismiss } from './use-dismiss';

/**
 * "Copy page" and its menu, as Mintlify's contextual menu had them: copy and
 * view the page as Markdown (its own .md file, written at build next to the
 * page by scripts/postbuild.mjs, at the URL Mintlify used: <page>.md), and the
 * MCP server. Mintlify's "mcp" and "add-mcp" offered its own server at /mcp,
 * which searched these docs; that address now redirects to the CCTools MCP
 * server, whose search_docs tool does the same search beside the data tools,
 * so the menu copies that server's address.
 */
export function PageActions({ markdownUrl, className }: { markdownUrl: string; className?: string }) {
  const t = useUi();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedMcp, setCopiedMcp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  useEffect(() => {
    if (!copied && !copiedMcp) return;
    const id = window.setTimeout(() => {
      setCopied(false);
      setCopiedMcp(false);
    }, 1600);
    return () => window.clearTimeout(id);
  }, [copied, copiedMcp]);

  async function copyMcp() {
    try {
      await navigator.clipboard.writeText(MCP_ENDPOINT);
      setCopiedMcp(true);
    } catch {
      setCopiedMcp(false);
    }
  }

  async function copy() {
    close();
    try {
      const response = await fetch(markdownUrl);
      if (!response.ok) throw new Error(String(response.status));
      await navigator.clipboard.writeText(await response.text());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={`cc-page-actions ${className ?? ''}`} ref={ref}>
      <div className="cc-split">
        <button type="button" onClick={copy} title={t.copyPageHint}>
          {copied ? <Check aria-hidden="true" strokeWidth={1.75} /> : <Copy aria-hidden="true" strokeWidth={1.75} />}
          {copied ? t.copied : t.copyPage}
        </button>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t.moreActions}
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronDown aria-hidden="true" strokeWidth={1.75} />
        </button>
      </div>
      {open ? (
        <ul className="cc-menu-list is-right cc-actions-menu" role="menu">
          <li role="none">
            <button type="button" role="menuitem" className="cc-menu-item" onClick={copy}>
              <Copy aria-hidden="true" strokeWidth={1.75} />
              <span className="cc-menu-item-text">
                {t.copyPage}
                <small>{t.copyPageHint}</small>
              </span>
            </button>
          </li>
          <li role="none">
            <a role="menuitem" className="cc-menu-item" href={markdownUrl} target="_blank" rel="noopener" onClick={close}>
              <FileText aria-hidden="true" strokeWidth={1.75} />
              <span className="cc-menu-item-text">
                {t.viewMarkdown}
                <small>{t.viewMarkdownHint}</small>
              </span>
            </a>
          </li>
          <li role="none">
            <button type="button" role="menuitem" className="cc-menu-item" onClick={copyMcp}>
              {copiedMcp ? <Check aria-hidden="true" strokeWidth={1.75} /> : <Plug aria-hidden="true" strokeWidth={1.75} />}
              <span className="cc-menu-item-text">
                {copiedMcp ? t.copied : t.copyMcp}
                <small>{t.copyMcpHint}</small>
              </span>
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
