// Коммуналка — учёт коммунальных платежей · © 2026 Елена Кирсанова. Все права защищены.
// Офлайн-режим: приложение ВСЕГДА открывается из памяти устройства, обновления скачиваются в фоне.
// Данные пользователя (записи, тарифы, фото) этот файл не трогает.
const CACHE='kommunal-v2';
const SHELL=['./','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./favicon.png'];
const LIBS=['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'];
const good=r=>r&&r.ok&&!r.redirected&&(r.type==='basic'||r.type==='cors');

self.addEventListener('install',e=>{e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  await Promise.allSettled([...SHELL,...LIBS].map(async u=>{const r=await fetch(new Request(u,{cache:'reload'}));if(good(r))await c.put(u,r)}));
  // если новые файлы не скачались — переносим из старой версии, чтобы не остаться без приложения
  for(const k of await caches.keys()){if(k===CACHE||!k.startsWith('kommunal-'))continue;const old=await caches.open(k);
    for(const u of [...SHELL,...LIBS]){if(!(await c.match(u))){const m=await old.match(u);if(m)await c.put(u,m)}}}
  await self.skipWaiting()})())});

self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  const c=await caches.open(CACHE);const ok=await c.match('./');
  for(const k of await caches.keys())if(k!==CACHE&&k.startsWith('kommunal-')&&ok)await caches.delete(k); // старое удаляем, только если новое на месте
  await self.clients.claim()})())});

const withTimeout=(p,ms)=>Promise.race([p,new Promise(r=>setTimeout(()=>r(null),ms))]);

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const u=new URL(req.url);
  if(/\/(migrate|perenos)(\.html)?$/.test(u.pathname))return; // страницы переноса данных — всегда из сети
  if(u.origin!==location.origin&&u.hostname!=='cdnjs.cloudflare.com')return;

  if(req.mode==='navigate'){
    e.respondWith((async()=>{
      const c=await caches.open(CACHE);
      const cached=await c.match('./',{ignoreSearch:true});
      const net=fetch(req,{cache:'no-store'}).then(async r=>{
        if(good(r)&&u.origin===location.origin){const t=await r.clone().text();if(t.includes('utility_records_data'))await c.put('./',r.clone())}
        return r}).catch(()=>null);
      if(cached){e.waitUntil(net);return cached}
      const r=await withTimeout(net,10000);
      return r||new Response('<meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font:18px -apple-system;padding:40px;text-align:center">Нет интернета, а приложение ещё не сохранено на устройстве.<br><br>Откройте его один раз с интернетом.</body>',{headers:{'Content-Type':'text/html;charset=utf-8'}});
    })());return}

  e.respondWith((async()=>{
    const c=await caches.open(CACHE);const m=await c.match(req,{ignoreSearch:true});
    if(m)return m;
    try{const r=await fetch(req);if(good(r)||(r.type==='opaque'&&u.hostname==='cdnjs.cloudflare.com'))c.put(req,r.clone());return r}
    catch(err){return new Response('',{status:504})}
  })());
});
