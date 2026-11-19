// Serve out/ the way Cloudflare Pages serves it, for the checks and for
// renders: the _redirects rules first, then the file, then <path>.html, then
// <path>/index.html, a trailing slash redirected away, and a missing URL
// answered with the nearest 404.html (es/404.html for /es/..., then 404.html).
// Usage: node scripts/serve-out.mjs [--port 3720]
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { OUT, matchRedirect } from './lib.mjs';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function parseRedirects() {
  const file = join(OUT, '_redirects');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [from, to, status] = l.split(/\s+/);
      return { from, to, status: Number(status ?? 302) };
    });
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/** What Cloudflare Pages answers for a pathname: { status, file?, location? }. */
export function resolvePath(pathname, rules = parseRedirects()) {
  const redirect = matchRedirect(rules, pathname);
  if (redirect) return { status: redirect.status, location: redirect.location };
  if (pathname.length > 1 && pathname.endsWith('/')) {
    const bare = pathname.slice(0, -1);
    const target = resolvePath(bare, rules);
    if (target.status === 200) return { status: 308, location: bare };
  }
  const safe = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '');
  if (safe.startsWith('..')) return { status: 400 };
  const base = join(OUT, safe);
  if (pathname.endsWith('.html')) {
    // Pages drops the extension: /x.html -> /x
    const bare = pathname.slice(0, -5) || '/';
    if (isFile(base)) return { status: 308, location: bare === '/index' ? '/' : bare };
  }
  for (const candidate of [base, `${base}.html`, join(base, 'index.html')]) {
    if (isFile(candidate) && !candidate.endsWith('_redirects') && !candidate.endsWith('_headers')) {
      return { status: 200, file: candidate };
    }
  }
  const parts = safe.split(/[/\\]/).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const nearest = join(OUT, ...parts.slice(0, i), '404.html');
    if (isFile(nearest)) return { status: 404, file: nearest };
  }
  return { status: 404 };
}

function serve(port) {
  const rules = parseRedirects();
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const result = resolvePath(url.pathname, rules);
    if (result.location) {
      res.writeHead(result.status, { Location: result.location + url.search });
      res.end();
      return;
    }
    if (!result.file) {
      res.writeHead(result.status, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(result.status, { 'Content-Type': TYPES[extname(result.file)] ?? 'application/octet-stream' });
    res.end(readFileSync(result.file));
  });
  server.listen(port, '127.0.0.1', () => console.log(`[serve-out] http://127.0.0.1:${port} (pid ${process.pid})`));
  return server;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('serve-out.mjs')) {
  const i = process.argv.indexOf('--port');
  serve(i > -1 ? Number(process.argv[i + 1]) : 3720);
}
