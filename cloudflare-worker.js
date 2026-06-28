// Cloudflare Worker — Auth gate for /admin.html
// Como usar: https://dash.cloudflare.com → Workers & Pages → Create Worker → pegar este código
// Luego: Workers & Pages → tu Worker → Triggers → Add Route → la-oficina.pages.dev/admin.html*

const ADMIN_HASH = 'd8a07aa665857d3b8b480f5ae27f9584edcab9d6b882d03b2f5d298fa7d2c514';
const COOKIE_NAME = 'admin_sesh';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/admin.html')) {
      return env.ASSETS.fetch(request);
    }

    const cookie = request.headers.get('Cookie') || '';
    const cookies = Object.fromEntries(
      cookie.split(';').filter(Boolean).map(c => c.trim().split('=').map(s => s.trim()))
    );

    // Logout
    if (url.searchParams.has('logout')) {
      const res = new Response(null, { status: 302 });
      res.headers.set('Location', '/admin.html');
      res.headers.set('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
      return res;
    }

    // Session válida
    if (cookies[COOKIE_NAME] === ADMIN_HASH) {
      const response = await env.ASSETS.fetch(request);
      const html = await response.text();
      const patched = html.replace('</head>', '<script>window.__workerAuth=true</script></head>');
      return new Response(patched, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }

    // Login POST
    if (request.method === 'POST') {
      const formData = await request.formData();
      const pass = formData.get('adminPass') || '';
      const hash = await sha256(pass);
      if (hash === ADMIN_HASH) {
        const res = new Response(null, { status: 302 });
        res.headers.set('Location', '/admin.html');
        res.headers.set('Set-Cookie', `${COOKIE_NAME}=${ADMIN_HASH}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`);
        return res;
      }
      return new Response('Contraseña incorrecta', { status: 403 });
    }

    // Mostrar login
    return new Response(LOGIN_HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }
    });
  }
};

async function sha256(str) {
  const data = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin — La Oficina</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Poppins', sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .login-box { background: #111; border: 1px solid rgba(139,195,74,0.15); border-radius: 16px; padding: 48px 36px; width: 100%; max-width: 400px; text-align: center; }
    .login-box h1 { font-size: 1.5rem; font-weight: 800; letter-spacing: 2px; margin-bottom: 4px; }
    .login-box h1 span { color: #8BC34A; }
    .login-box p { color: #888; font-size: 0.85rem; margin-bottom: 28px; }
    .login-box form { display: flex; flex-direction: column; gap: 16px; }
    .login-box input { background: #1a1a1a; border: 1px solid #333; border-radius: 10px; padding: 14px 18px; color: #fff; font-family: inherit; font-size: 0.95rem; outline: none; transition: 0.2s; }
    .login-box input:focus { border-color: #8BC34A; box-shadow: 0 0 0 3px rgba(139,195,74,0.1); }
    .login-box button { background: #8BC34A; border: none; border-radius: 10px; padding: 14px; color: #0a0a0a; font-family: inherit; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .login-box button:hover { background: #9dce5c; }
    .login-box .error { color: #ff4444; font-size: 0.82rem; }
  </style>
</head>
<body>
  <div class="login-box">
    <h1>LA <span>OFICINA</span></h1>
    <p>Panel de administraci\u00f3n</p>
    <form method="POST" action="/admin.html">
      <input type="password" name="adminPass" placeholder="Contrase\u00f1a" required autofocus />
      <button type="submit">Ingresar</button>
      <p id="error" class="error"></p>
    </form>
  </div>
</body>
</html>`;
