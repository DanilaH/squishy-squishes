import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const PORT = Number(process.env.RELEASE_QA_PORT ?? 4177);
const HOST = '127.0.0.1';
const roots = {
  '/squishy-squishes/': resolve('dist'),
  '/yandex/': resolve('dist-yandex'),
};

const contentType = (path) => {
  switch (extname(path)) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'text/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.woff2': return 'font/woff2';
    default: return 'application/octet-stream';
  }
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${HOST}:${PORT}`);
  const rootEntry = Object.entries(roots).find(([prefix]) => url.pathname.startsWith(prefix));
  if (!rootEntry) {
    response.writeHead(404).end('Not found');
    return;
  }

  const [prefix, root] = rootEntry;
  const relative = decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html';
  let target = resolve(root, relative);
  if (target !== root && !target.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  if (existsSync(target) && statSync(target).isDirectory()) target = resolve(target, 'index.html');
  if (!existsSync(target) || !statSync(target).isFile()) {
    response.writeHead(404).end('Not found');
    return;
  }

  response.writeHead(200, {
    'Content-Type': contentType(target),
    'Cache-Control': 'no-store',
  });
  createReadStream(target).pipe(response);
});

server.listen(PORT, HOST, () => {
  console.log(`[release-qa] serving built artifacts on http://${HOST}:${PORT}`);
});

const close = () => server.close(() => process.exit(0));
process.on('SIGINT', close);
process.on('SIGTERM', close);
