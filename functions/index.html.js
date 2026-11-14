/* Cloudflare Pages перенаправляет /index.html на /, а Safari и Chrome не принимают
   перенаправленный ответ от офлайн-модуля (sw.js) — приложение не открывается.
   Здесь /index.html отдаётся напрямую, без перенаправления: так старые офлайн-модули
   на телефонах сами получают правильную страницу и обновляются. © 2026 Елена Кирсанова */
export async function onRequest({ request, env }) {
  const u = new URL(request.url);
  u.pathname = u.pathname.replace(/index\.html$/, '');
  const r = await env.ASSETS.fetch(new Request(u.toString(), { method: 'GET', headers: request.headers }));
  return new Response(r.body, { status: r.status, headers: r.headers });
}
