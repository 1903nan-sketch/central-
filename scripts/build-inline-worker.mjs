// Gera um Worker que serve os arquivos de public/ embutidos no próprio script.
// Útil quando o envio de "assets" não é possível (ex.: proxies que reescrevem o Authorization).
// Uso: node scripts/build-inline-worker.mjs && npx wrangler deploy -c wrangler.inline.jsonc
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
const ROOT = 'public', TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.css': 'text/css; charset=utf-8' };
const files = {};
const walk = d => readdirSync(d).forEach(n => { const p = join(d, n); if (statSync(p).isDirectory()) return walk(p); const rel = '/' + relative(ROOT, p).split('\\').join('/'); if (rel === '/_headers') return; files[rel] = [TYPES[extname(p)] || 'application/octet-stream', readFileSync(p).toString('base64')]; });
walk(ROOT);
const code = `const F=${JSON.stringify(files)};
const NOCACHE=new Set(['/','/index.html','/sw.js','/manifest.webmanifest']);
const dec=b=>Uint8Array.from(atob(b),c=>c.charCodeAt(0));const C={};
export default{fetch(req){const u=new URL(req.url);let p=decodeURIComponent(u.pathname);if(p==='/')p='/index.html';
let f=F[p];if(!f){if(/\\.[a-z0-9]+$/i.test(p))return new Response('Não encontrado',{status:404});p='/index.html';f=F[p]}
const h={'Content-Type':f[0],'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'SAMEORIGIN','Permissions-Policy':'camera=(self), microphone=(), geolocation=()','Cache-Control':NOCACHE.has(p)?'no-cache':'public, max-age=86400'};
return new Response(C[p]||(C[p]=dec(f[1])),{headers:h})}};`;
mkdirSync('.build', { recursive: true }); writeFileSync('.build/worker.js', code);
console.log('worker gerado:', Object.keys(files).join(', '), (code.length / 1024 | 0) + ' KB');
