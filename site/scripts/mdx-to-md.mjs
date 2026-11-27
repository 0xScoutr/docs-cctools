// MDX pages as plain Markdown, for the .md twin of each page and for
// llms.txt and llms-full.txt (Mintlify's had no MDX tags either): MDX comments
// and imports go, the Mintlify components become Markdown, the HTML of the
// home pages becomes headings, paragraphs, lists and links, and every link to
// this site becomes absolute. An unknown component stops the build.
import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';

const ORIGIN = 'https://docs.cctools.network';

const CALLOUT_LABELS = {
  en: { note: 'Note', warning: 'Warning', tip: 'Tip' },
  es: { note: 'Nota', warning: 'Advertencia', tip: 'Consejo' },
  pt: { note: 'Nota', warning: 'Atenção', tip: 'Dica' },
  zh: { note: '注意', warning: '警告', tip: '提示' },
};
const CALLOUTS = { Note: 'note', Info: 'note', Warning: 'warning', Tip: 'tip', Check: 'tip' };

const PHRASING = new Set([
  'text', 'emphasis', 'strong', 'delete', 'inlineCode', 'link', 'linkReference', 'image', 'imageReference', 'break',
  'html', 'footnoteReference', 'mdxJsxTextElement', 'mdxTextExpression',
]);

/** Elements that make blocks: a paragraph holding one of them (an inline-written HTML line of the home) is split. */
const BLOCK_ELEMENTS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'div', 'section', 'main', 'article', 'blockquote',
  'Note', 'Info', 'Warning', 'Tip', 'Check', 'Card', 'CardGroup', 'Steps', 'Step', 'Accordion', 'AccordionGroup',
]);

const isJsx = (node) => node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';

/** The elements named `name` among `children`, also inside the paragraphs the parser wraps around inline JSX. */
function elementsNamed(children, name) {
  return children.flatMap((child) =>
    isJsx(child) && child.name === name ? [child] : child.type === 'paragraph' ? elementsNamed(child.children, name) : [],
  );
}

const text = (value) => ({ type: 'text', value });
const paragraph = (children) => ({ type: 'paragraph', children });
const strong = (children) => ({ type: 'strong', children });

function attr(node, name) {
  const found = node.attributes?.find((a) => a.type === 'mdxJsxAttribute' && a.name === name);
  if (!found) return undefined;
  return typeof found.value === 'string' ? found.value : undefined;
}

function className(node) {
  return attr(node, 'className') ?? attr(node, 'class') ?? '';
}

function absolute(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? `${ORIGIN}${url === '/' ? '' : url}` : url;
}

function plainText(nodes) {
  return nodes.map((n) => (typeof n.value === 'string' ? n.value : n.children ? plainText(n.children) : '')).join('');
}

/**
 * Phrasing nodes, with a space between two pieces that came from separate elements and would otherwise touch
 * ("Daily record" and "One row per UTC day" in two spans), never before a piece that opens with punctuation.
 */
function joinPhrasing(parts) {
  const out = [];
  for (const { nodes, fromElement } of parts) {
    if (nodes.length === 0) continue;
    const last = out[out.length - 1];
    const first = nodes[0];
    const touches = last && !(last.type === 'text' && /\s$/.test(last.value));
    const opensWithPunctuation = first.type === 'text' && /^[\s:;,.!?：、。]/.test(first.value);
    if (fromElement && touches && !opensWithPunctuation) out.push(text(' '));
    out.push(...nodes);
  }
  return out;
}

function trimParagraph(children) {
  const nodes = [...children];
  while (nodes[0]?.type === 'text' && !nodes[0].value.trim()) nodes.shift();
  while (nodes.at(-1)?.type === 'text' && !nodes.at(-1).value.trim()) nodes.pop();
  if (nodes[0]?.type === 'text') nodes[0] = text(nodes[0].value.replace(/^\s+/, ''));
  if (nodes.at(-1)?.type === 'text') nodes[nodes.length - 1] = text(nodes.at(-1).value.replace(/\s+$/, ''));
  return nodes;
}

export function createConverter({ locale }) {
  const labels = CALLOUT_LABELS[locale] ?? CALLOUT_LABELS.en;
  const colon = locale === 'zh' ? '：' : ': ';
  const labelEnd = locale === 'zh' ? '：' : ':';

  /** Any list of nodes as flow (block) content: runs of phrasing become paragraphs. */
  function flow(nodes) {
    const out = [];
    let run = [];
    const flush = () => {
      const children = trimParagraph(joinPhrasing(run));
      if (children.length) out.push(paragraph(children));
      run = [];
    };
    for (const node of nodes) {
      const converted = convert(node);
      const fromElement = isJsx(node);
      for (const part of converted) {
        if (PHRASING.has(part.type)) run.push({ nodes: [part], fromElement });
        else {
          flush();
          out.push(part);
        }
      }
    }
    flush();
    return out;
  }

  /** Any list of nodes as phrasing (inline) content. */
  function phrasing(nodes) {
    const parts = [];
    for (const node of nodes) {
      const fromElement = isJsx(node);
      const converted = convert(node).flatMap((part) => (PHRASING.has(part.type) ? [part] : part.type === 'paragraph' ? part.children : []));
      parts.push({ nodes: converted, fromElement });
    }
    return joinPhrasing(parts);
  }

  function element(node) {
    const name = node.name ?? '';
    const children = node.children ?? [];
    if (name === 'Icon') return [];
    if (name in CALLOUTS) {
      const body = flow(children);
      const label = strong([text(`${labels[CALLOUTS[name]]}${labelEnd}`)]);
      if (body[0]?.type === 'paragraph') body[0] = paragraph([label, text(' '), ...body[0].children]);
      else body.unshift(paragraph([label]));
      return [{ type: 'blockquote', children: body }];
    }
    if (name === 'CardGroup' || name === 'AccordionGroup') return flow(children);
    if (name === 'Steps') {
      const items = elementsNamed(children, 'Step')
        .map((step) => ({
          type: 'listItem',
          spread: true,
          children: [
            ...(attr(step, 'title') ? [paragraph([strong([text(attr(step, 'title'))])])] : []),
            ...flow(step.children ?? []),
          ],
        }));
      return [{ type: 'list', ordered: true, start: 1, spread: true, children: items }];
    }
    if (name === 'Card' || name === 'Accordion' || name === 'Step') {
      const title = attr(node, 'title') ?? '';
      const href = attr(node, 'href');
      const head = href ? [{ type: 'link', url: absolute(href), children: [text(title)] }] : [text(title)];
      return [paragraph([strong(head)]), ...flow(children)];
    }
    switch (name) {
      case 'div':
      case 'section':
      case 'main':
      case 'article':
        return flow(children);
      case 'span': {
        const cls = className(node);
        const inner = phrasing(children);
        if (cls.includes('cc-index-title') || cls.includes('cc-chip')) return [strong(inner)];
        if (cls.includes('cc-index-desc')) return inner.length ? [text(colon), ...inner] : [];
        return inner;
      }
      case 'p':
        return [paragraph(trimParagraph(phrasing(children)))];
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
        return [{ type: 'heading', depth: Number(name[1]), children: trimParagraph(phrasing(children)) }];
      case 'ul':
      case 'ol':
        return [
          {
            type: 'list',
            ordered: name === 'ol',
            spread: false,
            children: elementsNamed(children, 'li').map((li) => ({ type: 'listItem', spread: false, children: flow(li.children ?? []) })),
          },
        ];
      case 'li':
        return flow(children);
      case 'a':
        // The home's index links: a title span then its description, read "Title: description".
        return [{ type: 'link', url: absolute(attr(node, 'href') ?? ''), children: trimParagraph(phrasing(children)) }];
      case 'code':
        return [{ type: 'inlineCode', value: plainText(children) }];
      case 'strong':
      case 'b':
        return [strong(phrasing(children))];
      case 'em':
      case 'i':
        return [{ type: 'emphasis', children: phrasing(children) }];
      case 'br':
        return [{ type: 'break' }];
      case 'img':
        return [{ type: 'image', url: absolute(attr(node, 'src') ?? ''), alt: attr(node, 'alt') ?? '' }];
      default:
        throw new Error(`mdx-to-md: no Markdown for <${name}>; add it to site/scripts/mdx-to-md.mjs`);
    }
  }

  function convert(node) {
    switch (node.type) {
      case 'mdxjsEsm':
      case 'mdxFlowExpression':
      case 'mdxTextExpression':
        // {/* comments */} and imports or exports: nothing a reader of the Markdown needs.
        return [];
      case 'mdxJsxFlowElement':
      case 'mdxJsxTextElement':
        return element(node);
      case 'link':
        return [{ ...node, url: absolute(node.url), children: phrasing(node.children) }];
      case 'definition':
        return [{ ...node, url: absolute(node.url) }];
      case 'paragraph': {
        if (node.children.some((child) => isJsx(child) && BLOCK_ELEMENTS.has(child.name ?? ''))) return flow(node.children);
        const children = trimParagraph(phrasing(node.children));
        return children.length ? [paragraph(children)] : [];
      }
      case 'heading':
      case 'emphasis':
      case 'strong':
      case 'delete':
      case 'tableCell':
        return [{ ...node, children: phrasing(node.children) }];
      case 'blockquote':
      case 'listItem':
      case 'footnoteDefinition':
        return [{ ...node, children: flow(node.children) }];
      case 'list':
      case 'table':
      case 'tableRow':
        return [{ ...node, children: node.children.flatMap(convert) }];
      default:
        return [node];
    }
  }

  return (source) => {
    const tree = unified().use(remarkParse).use(remarkMdx).use(remarkGfm).parse(source);
    tree.children = flow(tree.children);
    return unified()
      .use(remarkGfm, { tablePipeAlign: false })
      .use(remarkStringify, { bullet: '-', emphasis: '_', strong: '*', fences: true, rule: '-', listItemIndent: 'one' })
      .stringify(tree)
      .trimEnd();
  };
}
