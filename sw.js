/* Sala de Avaliações — abre na hora e funciona sem internet.
   Páginas do próprio site: mostra a cópia guardada na hora e, ao mesmo tempo, busca a versão nova.
   Se a versão nova for diferente, guarda e avisa a tela ("Nova versão pronta").
   Todo o resto (Firebase, Google, imagens de fora) passa direto, sem guardar nada. */
const CACHE = 'sala-ceetip-v1';
const FIXOS = ['./manifest.webmanifest', './icone-192.png', './icone-512.png', './icone-192-maskable.png', './icone-512-maskable.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(FIXOS)).catch(() => {})); });
self.addEventListener('activate', e => { e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim(); })()); });
const versao = t => { const m = /id="build-tag"[^>]*>([^<]*)</.exec(t || ''); return m ? m[1] : ''; };
async function avisar(){ for (const c of await self.clients.matchAll({ type: 'window' })) c.postMessage({ tipo: 'nova-versao' }); }
let atualizando = Promise.resolve();
// a página pergunta, depois de abrir, se a cópia guardada já é mais nova do que ela
self.addEventListener('message', ev => {
  const d = ev.data || {}; if (d.tipo !== 'qual-versao' || !ev.source) return;
  ev.waitUntil((async () => { try { await atualizando; } catch (e) {}
    const cache = await caches.open(CACHE); const g = await cache.match(new Request(self.location.origin + (d.pagina || '/')));
    if (g && d.minha && versao(await g.text()) !== d.minha) ev.source.postMessage({ tipo: 'nova-versao' }); })());
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== self.location.origin) return;
  const pagina = r.mode === 'navigate';
  if (!pagina && !FIXOS.some(f => u.pathname.endsWith(f.slice(1)))) return;
  const chave = pagina ? new Request(u.origin + u.pathname) : r;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE); const guardada = await cache.match(chave); const copia = guardada && pagina ? guardada.clone() : null;
    const rede = (pagina ? fetch(u.href, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(r)).then(async resp => {
      if (resp && resp.ok && resp.type === 'basic') {
        let nova = false;
        if (pagina && guardada) { const [a, b] = await Promise.all([copia.text(), resp.clone().text()]); nova = versao(a) !== versao(b); }
        await cache.put(chave, resp.clone()); if (nova) avisar();
      }
      return resp;
    }).catch(() => null);
    if (guardada) { if (pagina) atualizando = rede; e.waitUntil(rede); return guardada; }
    return (await rede) || new Response('<h1>Sem internet</h1><p>Abra o app uma vez com internet para ele funcionar sem conexão.</p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  })());
});
