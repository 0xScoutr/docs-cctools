import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { ChevronRight, Info, Lightbulb, Link2, TriangleAlert } from 'lucide-react';
import type { MDXComponents } from 'mdx/types';
import { CodeBlock } from './code-block';
import { Icon } from './icon';

/**
 * The Mintlify components the pages use, as plain markup in the v3 look:
 * Note, Warning, Tip (and Info, Check), Card, CardGroup, Steps, Step,
 * Accordion, AccordionGroup and Icon. A scan of every .mdx file found no
 * other component (scripts/check-components.mjs keeps it that way).
 */

function Callout({ kind, children }: { kind: 'note' | 'warning' | 'tip'; children: ReactNode }) {
  const IconFor = kind === 'warning' ? TriangleAlert : kind === 'tip' ? Lightbulb : Info;
  return (
    <div className={`cc-callout is-${kind}`} role={kind === 'warning' ? 'note' : undefined}>
      <span className="cc-callout-icon">
        <IconFor aria-hidden="true" strokeWidth={1.75} />
      </span>
      <div className="cc-callout-body">{children}</div>
    </div>
  );
}

export const Note = ({ children }: { children: ReactNode }) => <Callout kind="note">{children}</Callout>;
export const Info_ = Note;
export const Warning = ({ children }: { children: ReactNode }) => <Callout kind="warning">{children}</Callout>;
export const Tip = ({ children }: { children: ReactNode }) => <Callout kind="tip">{children}</Callout>;

function isInternal(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

export function Card({
  title,
  icon,
  href,
  children,
}: {
  title: string;
  icon?: string;
  href?: string;
  children?: ReactNode;
}) {
  const inner = (
    <>
      {icon ? (
        <span className="cc-card-icon">
          <Icon icon={icon} size={20} />
        </span>
      ) : null}
      <span className="cc-card-title">{title}</span>
      {children ? <div className="cc-card-body">{children}</div> : null}
    </>
  );
  if (!href) return <div className="cc-card">{inner}</div>;
  if (isInternal(href)) {
    return (
      <Link className="cc-card" href={href}>
        {inner}
      </Link>
    );
  }
  return (
    <a className="cc-card" href={href} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  );
}

export function CardGroup({ cols = 2, children }: { cols?: number; children: ReactNode }) {
  return (
    <div className="cc-card-group" style={{ ['--cc-cols' as string]: String(cols) }}>
      {children}
    </div>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="cc-steps">{children}</ol>;
}

export function Step({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <li className="cc-step">
      {title ? <p className="cc-step-title">{title}</p> : null}
      <div className="cc-step-body">{children}</div>
    </li>
  );
}

export function Accordion({
  title,
  icon,
  defaultOpen,
  children,
}: {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  children?: ReactNode;
}) {
  return (
    <details className="cc-accordion" open={defaultOpen}>
      <summary>
        <ChevronRight className="cc-accordion-chevron" aria-hidden="true" strokeWidth={1.75} />
        {icon ? <Icon icon={icon} size={16} /> : null}
        <span>{title}</span>
      </summary>
      <div className="cc-accordion-body">{children}</div>
    </details>
  );
}

export function AccordionGroup({ children }: { children: ReactNode }) {
  return <div className="cc-accordion-group">{children}</div>;
}

function Anchor({ href = '', children, ...rest }: ComponentProps<'a'>) {
  if (href.startsWith('#')) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  if (isInternal(href)) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}

function heading(Tag: 'h2' | 'h3' | 'h4') {
  return function Heading({ id, children, ...rest }: ComponentProps<'h2'>) {
    return (
      <Tag id={id} {...rest}>
        {id ? (
          <a className="cc-heading-anchor" href={`#${id}`} aria-label="Link to this section">
            <Link2 aria-hidden="true" width={14} height={14} strokeWidth={1.75} />
          </a>
        ) : null}
        {children}
      </Tag>
    );
  };
}

function Table(props: ComponentProps<'table'>) {
  return (
    <div className="cc-table">
      <table {...props} />
    </div>
  );
}

export const mdxComponents: MDXComponents = {
  a: Anchor,
  pre: CodeBlock,
  table: Table,
  h2: heading('h2'),
  h3: heading('h3'),
  h4: heading('h4'),
  Note,
  Info: Info_,
  Check: Tip,
  Warning,
  Tip,
  Card,
  CardGroup,
  Steps,
  Step,
  Accordion,
  AccordionGroup,
  Icon,
};
