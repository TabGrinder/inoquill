import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), usb=(), serial=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; worker-src 'self'; connect-src 'none'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'none'",
  'Cache-Control': 'no-store'
};
const MIME = { '.html': 'text/html;charset=utf-8', '.css': 'text/css;charset=utf-8', '.mjs': 'text/javascript;charset=utf-8', '.svg': 'image/svg+xml', '.zip': 'application/zip', '.md': 'text/plain;charset=utf-8', '.json': 'application/json' };
export function createAppServer(rootDirectory = path.resolve('dist')) {
  const server = http.createServer({ maxHeaderSize: 8192, headersTimeout: 5000, requestTimeout: 10000, keepAliveTimeout: 3000 }, async (request, response) => {
    const send = (status, body, type = 'text/plain;charset=utf-8') => {
      response.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': type });
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    if (request.headers['sec-fetch-site'] === 'cross-site') return send(403, 'Cross-site requests are not allowed');
    let authority;
    try { authority = new URL('http://' + request.headers.host); } catch { return send(400, 'Invalid Host header'); }
    const bound = server.address();
    const hosts = new Set(['localhost', '127.0.0.1', '[::1]', typeof bound === 'object' && bound ? bound.address : '']);
    if (!hosts.has(authority.hostname) || authority.username || authority.password || authority.pathname !== '/' || authority.search || authority.hash) return send(403, 'Host not allowed');
    if (!['GET', 'HEAD'].includes(request.method)) { response.setHeader('Allow', 'GET, HEAD'); return send(405, 'Method not allowed'); }
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); } catch { return send(400, 'Invalid request path'); }
    if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').some(part => part.startsWith('.') && part !== '')) return send(403, 'Forbidden');
    if (pathname === '/') pathname = '/index.html';
    const candidate = path.resolve(rootDirectory, '.' + pathname);
    try {
      const [root, file] = await Promise.all([realpath(rootDirectory), realpath(candidate)]);
      if (!file.startsWith(root + path.sep) || path.relative(root, file).split(path.sep).some(part => part.startsWith('.'))) return send(403, 'Forbidden');
      const info = await stat(file);
      if (!info.isFile()) return send(403, 'Not a regular file');
      if (info.size > 5 * 1024 * 1024) return send(413, 'Asset exceeds the 5 MiB limit');
      const type = MIME[path.extname(file)]; if (!type) return send(403, 'Unsupported asset type');
      response.setHeader('Content-Length', info.size);
      if (request.method === 'HEAD') return send(200, undefined, type);
      const body = await readFile(file); return send(200, body, type);
    } catch { return send(404, 'Not found'); }
  });
  server.maxHeadersCount = 64;
  server.maxRequestsPerSocket = 100;
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 3000), host = process.env.HOST ?? '127.0.0.1';
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('PORT must be an integer from 0 to 65535.');
  const server = createAppServer();
  server.listen(port, host, () => console.log('InoQuill: http://' + host + ':' + server.address().port));
}
