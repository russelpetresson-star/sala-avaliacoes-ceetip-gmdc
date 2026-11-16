/* Sala de Avaliações — abre na hora e funciona sem internet.
   Páginas do próprio site: mostra a cópia guardada na hora e, ao mesmo tempo, busca a versão nova.
   Se a versão nova for diferente, guarda e avisa a tela ("Nova versão pronta").
   Todo o resto (Firebase, Google, imagens de fora) passa direto, sem guardar nada. */
const CACHE = 'sala-ceetip-v1';
const FIXOS = ['./manifest.webmanifest', './icone-192.png', './icone-512.png', './icone-192-maskable.png', './icone-512-maskable.png', './apple-touch-icon.png'];
// './' = a própria página: já abre sem internet desde a 1ª visita
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => Promise.all([c.addAll(FIXOS), c.add('./').catch(() => {})])).catch(() => {})); });
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
  const foto = /\/img\/cursos\/[^/]+\.jpg$/.test(u.pathname) || /\/labs\/labs_dados\.json$/.test(u.pathname);
  // partes do app (nome muda a cada versão): se já está guardada, usa direto, sem baixar de novo
  if (/\/partes\/[^/]+\.js$/.test(u.pathname)) { e.respondWith((async () => { const c = await caches.open(CACHE); const g = await c.match(r);
    if (g) return g; const resp = await fetch(r); if (resp && resp.ok) await c.put(r, resp.clone()); return resp; })()); return; }   // fotos da página inicial: guardadas para abrir sem internet
  if (!pagina && !foto && !FIXOS.some(f => u.pathname.endsWith(f.slice(1)))) return;
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

// tocar num aviso do app: volta para a janela aberta (ou abre o app)
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil((async () => {
  const lista = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const c of lista) { if ('focus' in c) return c.focus(); }
  if (self.clients.openWindow) return self.clients.openWindow((e.notification.data && e.notification.data.url) || './');
})()); });

// aviso enviado pelo robô da escola (chega mesmo com o app fechado)
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { corpo: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Sala de Avaliações', { body: d.corpo || '', tag: d.tag || undefined, icon: 'icone-192.png', badge: 'icone-192.png', data: { url: d.url || './' } }));
});
