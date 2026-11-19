export const locales = ['en', 'es', 'pt', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/** The names the language menu shows, as Mintlify showed them. */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  zh: '简体中文',
};

/** The value of <html lang> per locale. */
export const htmlLang: Record<Locale, string> = {
  en: 'en',
  es: 'es',
  pt: 'pt-BR',
  zh: 'zh-CN',
};

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value);
}

/** The locale of a page path such as "pt/api/plans" or "network/markets". */
export function localeOfPath(path: string): Locale {
  const first = path.split('/')[0];
  return isLocale(first) && first !== defaultLocale ? first : defaultLocale;
}

/** "pt/api/plans" -> "api/plans"; "pt/index" -> "index". */
export function stripLocale(path: string): string {
  const locale = localeOfPath(path);
  if (locale === defaultLocale) return path;
  return path.slice(locale.length + 1);
}

/** "api/plans" in "pt" -> "pt/api/plans". */
export function withLocale(path: string, locale: Locale): string {
  return locale === defaultLocale ? path : `${locale}/${path}`;
}

/** The URL of a page path: "index" -> "/", "pt/index" -> "/pt", "pt/api/plans" -> "/pt/api/plans". */
export function urlOfPath(path: string): string {
  if (path === 'index') return '/';
  if (path.endsWith('/index')) return `/${path.slice(0, -'/index'.length)}`;
  return `/${path}`;
}

interface UiStrings {
  search: string;
  searchShort: string;
  onThisPage: string;
  copyPage: string;
  copied: string;
  copyPageHint: string;
  viewMarkdown: string;
  viewMarkdownHint: string;
  moreActions: string;
  previous: string;
  next: string;
  openCctools: string;
  language: string;
  theme: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  menu: string;
  closeMenu: string;
  moreMenu: string;
  copyCode: string;
  copiedCode: string;
  noResults: string;
  closeSearch: string;
  notFoundEyebrow: string;
  notFoundTitle: string;
  notFoundText: string;
  notFoundHome: string;
  notFoundApi: string;
  skipToContent: string;
  website: string;
}

/** The interface strings, per locale (the page text itself is the MDX). */
export const ui: Record<Locale, UiStrings> = {
  en: {
    search: 'Search...',
    searchShort: 'Search',
    onThisPage: 'On this page',
    copyPage: 'Copy page',
    copied: 'Copied',
    copyPageHint: 'Copy this page as Markdown for LLMs',
    viewMarkdown: 'View as Markdown',
    viewMarkdownHint: 'View this page as plain text',
    moreActions: 'More actions',
    previous: 'Previous',
    next: 'Next',
    openCctools: 'Open CCTools',
    language: 'Language',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    menu: 'Open navigation',
    closeMenu: 'Close navigation',
    moreMenu: 'More',
    copyCode: 'Copy code',
    copiedCode: 'Copied',
    noResults: 'No results found',
    closeSearch: 'Close search',
    notFoundEyebrow: '404',
    notFoundTitle: 'Page not found',
    notFoundText: 'This page does not exist or has moved. Search the docs, or start from the home page.',
    notFoundHome: 'Go to the docs home',
    notFoundApi: 'Public API',
    skipToContent: 'Skip to content',
    website: 'Website',
  },
  es: {
    search: 'Buscar...',
    searchShort: 'Buscar',
    onThisPage: 'En esta página',
    copyPage: 'Copiar página',
    copied: 'Copiado',
    copyPageHint: 'Copia esta página en Markdown para LLMs',
    viewMarkdown: 'Ver como Markdown',
    viewMarkdownHint: 'Ver esta página como texto plano',
    moreActions: 'Más acciones',
    previous: 'Anterior',
    next: 'Siguiente',
    openCctools: 'Open CCTools',
    language: 'Idioma',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeSystem: 'Sistema',
    menu: 'Abrir navegación',
    closeMenu: 'Cerrar navegación',
    moreMenu: 'Más',
    copyCode: 'Copiar código',
    copiedCode: 'Copiado',
    noResults: 'No se encontraron resultados',
    closeSearch: 'Cerrar búsqueda',
    notFoundEyebrow: '404',
    notFoundTitle: 'Página no encontrada',
    notFoundText: 'Esta página no existe o se movió. Busca en la documentación o empieza desde el inicio.',
    notFoundHome: 'Ir al inicio de la documentación',
    notFoundApi: 'API pública',
    skipToContent: 'Saltar al contenido',
    website: 'Sitio web',
  },
  pt: {
    search: 'Pesquisar...',
    searchShort: 'Pesquisar',
    onThisPage: 'Nesta página',
    copyPage: 'Copiar página',
    copied: 'Copiado',
    copyPageHint: 'Copie esta página em Markdown para LLMs',
    viewMarkdown: 'Ver como Markdown',
    viewMarkdownHint: 'Veja esta página como texto simples',
    moreActions: 'Mais ações',
    previous: 'Anterior',
    next: 'Próximo',
    openCctools: 'Open CCTools',
    language: 'Idioma',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    themeSystem: 'Sistema',
    menu: 'Abrir navegação',
    closeMenu: 'Fechar navegação',
    moreMenu: 'Mais',
    copyCode: 'Copiar código',
    copiedCode: 'Copiado',
    noResults: 'Nenhum resultado encontrado',
    closeSearch: 'Fechar pesquisa',
    notFoundEyebrow: '404',
    notFoundTitle: 'Página não encontrada',
    notFoundText: 'Esta página não existe ou mudou de endereço. Pesquise na documentação ou comece pelo início.',
    notFoundHome: 'Ir para o início da documentação',
    notFoundApi: 'API pública',
    skipToContent: 'Pular para o conteúdo',
    website: 'Site',
  },
  zh: {
    search: '搜索...',
    searchShort: '搜索',
    onThisPage: '本页内容',
    copyPage: '复制页面',
    copied: '已复制',
    copyPageHint: '将本页复制为 Markdown，供 LLM 使用',
    viewMarkdown: '以 Markdown 查看',
    viewMarkdownHint: '以纯文本查看本页',
    moreActions: '更多操作',
    previous: '上一页',
    next: '下一页',
    openCctools: 'Open CCTools',
    language: '语言',
    theme: '主题',
    themeLight: '浅色',
    themeDark: '深色',
    themeSystem: '跟随系统',
    menu: '打开导航',
    closeMenu: '关闭导航',
    moreMenu: '更多',
    copyCode: '复制代码',
    copiedCode: '已复制',
    noResults: '没有找到结果',
    closeSearch: '关闭搜索',
    notFoundEyebrow: '404',
    notFoundTitle: '页面不存在',
    notFoundText: '此页面不存在或已移动。请搜索文档，或从首页开始。',
    notFoundHome: '前往文档首页',
    notFoundApi: '公共 API',
    skipToContent: '跳到内容',
    website: '网站',
  },
};
