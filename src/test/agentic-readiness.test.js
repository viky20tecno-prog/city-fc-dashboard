// Bloquea la configuración de "agentic readiness" (is-agentic.com / Ora audit):
// 404s reales, contenido sin JS en la home, negociación de Markdown, llms.txt,
// páginas de confianza y schema de Organización. Si alguien agrega una ruta a
// la SPA o rompe uno de estos archivos, este test lo cacha antes del deploy.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// vitest corre desde la raíz del proyecto (dashboard/)
const root = resolve(process.cwd()) + '/';
const read = (p) => readFileSync(root + p, 'utf8');

describe('vercel.json — rutas y negociación', () => {
  const vercel = JSON.parse(read('vercel.json'));
  const rewriteSources = vercel.rewrites.map((r) => r.source);

  it('no tiene un rewrite catch-all que cause soft-404 (200 con el shell)', () => {
    for (const src of rewriteSources) {
      expect(src).not.toBe('/(.*)');
      expect(src).not.toBe('/(.*)/');
      expect(src).not.toMatch(/^\/\(\.\*\)\??$/);
    }
  });

  it('cada ruta cliente declarada en App.jsx tiene su rewrite a /index.html', () => {
    const app = read('src/App.jsx');
    // Extrae los path="..." de <Route>
    const paths = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
    expect(paths.length).toBeGreaterThan(3);

    for (const p of paths) {
      if (p === '/') continue; // Vercel sirve /index.html en "/" desde el filesystem
      // /app/* -> se cubre con "/app" + "/app/:path*"
      const normalized = p.replace('/*', '').replace(/:(\w+)/g, ':$1');
      const covered = rewriteSources.some((src) => {
        const base = src.replace(/:(\w+)\*?/g, ':x').replace('/:path*', '');
        return base === normalized.replace(/:(\w+)/g, ':x') || src.startsWith(normalized + '/');
      });
      expect(covered, `falta rewrite para la ruta ${p}`).toBe(true);
    }
  });

  it('normaliza trailing slashes (evita 404 por "/ruta/")', () => {
    expect(vercel.trailingSlash).toBe(false);
  });

  it('el link viejo /inscripcion/:slug redirige al form con ?club_id=', () => {
    const r = (vercel.redirects || []).find((x) => x.source === '/inscripcion/:slug');
    expect(r).toBeTruthy();
    expect(r.destination).toBe('/inscripcion?club_id=:slug');
  });

  it('redirige a /index.md cuando Accept pide text/markdown', () => {
    const md = (vercel.redirects || []).find((r) => r.destination === '/index.md');
    expect(md).toBeTruthy();
    expect(md.source).toBe('/');
    expect(md.has?.[0]).toMatchObject({ type: 'header', key: 'accept' });
    expect(md.has[0].value).toMatch(/markdown/);
  });

  it('sirve Vary: Accept en "/" y Content-Type markdown en /index.md', () => {
    const headerRule = (src) => vercel.headers.find((h) => h.source === src);
    const varyRoot = headerRule('/').headers.find((h) => h.key === 'Vary');
    expect(varyRoot.value).toMatch(/Accept/);

    const mdRule = headerRule('/index.md').headers;
    expect(mdRule.find((h) => h.key === 'Content-Type').value).toMatch(/text\/markdown/);
    expect(mdRule.find((h) => h.key === 'Vary').value).toMatch(/Accept/);
  });
});

describe('index.html — contenido sin JavaScript', () => {
  const html = read('index.html');
  const rootBlock = html.slice(html.indexOf('<div id="root">'), html.indexOf('<script type="module"'));

  it('tiene un <h1> y al menos un <h2> dentro de #root (jerarquía, no plana)', () => {
    expect(rootBlock).toMatch(/<h1[ >]/);
    expect(rootBlock).toMatch(/<h2[ >]/);
  });

  it('tiene 500+ caracteres de texto visible dentro de #root', () => {
    const text = rootBlock
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(text.length).toBeGreaterThan(500);
  });

  it('declara el enlace alterno a /index.md', () => {
    expect(html).toMatch(/<link[^>]+rel="alternate"[^>]+type="text\/markdown"[^>]+href="\/index\.md"/);
  });

  it('el JSON-LD trae una Organization con contactPoint (sin dirección)', () => {
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    const data = JSON.parse(m[1]);
    const nodes = data['@graph'] || [data];
    const org = nodes.find((n) => n['@type'] === 'Organization');
    expect(org).toBeTruthy();
    expect(org.contactPoint).toBeTruthy();
    expect(JSON.stringify(org)).not.toMatch(/PostalAddress|streetAddress/);
    expect(JSON.stringify(org)).toMatch(/hola@zenpra\.ai/);
  });
});

describe('archivos machine-readable y páginas de confianza', () => {
  it('existen todos los archivos públicos nuevos', () => {
    for (const f of [
      'public/404.html',
      'public/llms.txt',
      'public/index.md',
      'public/nosotros.html',
      'public/contacto.html',
      'public/privacidad.html',
      'public/faq.html',
      'public/humans.txt',
      'public/.well-known/security.txt',
    ]) {
      expect(existsSync(root + f), `falta ${f}`).toBe(true);
    }
  });

  it('faq.html: FAQPage en JSON-LD + preguntas visibles en HTML crudo', () => {
    const faq = read('public/faq.html');
    const m = faq.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    const data = JSON.parse(m[1]);
    expect(data['@type']).toBe('FAQPage');
    expect(data.mainEntity.length).toBeGreaterThanOrEqual(6);
    // cada pregunta del schema debe aparecer como texto visible (requisito de Google)
    for (const q of data.mainEntity) {
      expect(faq).toContain(q.name);
      expect(faq).toContain(q.acceptedAnswer.text.slice(0, 40));
    }
    const h2s = faq.match(/<h2[ >]/g) || [];
    expect(h2s.length).toBeGreaterThanOrEqual(6);
  });

  it('el archivo de verificación de Google Search Console sigue presente', () => {
    // Si se borra, GSC pierde la verificación y el sitio deja de indexarse.
    const f = 'public/google7d920d728340c45f.html';
    expect(existsSync(root + f), `falta ${f} (verificación de Search Console)`).toBe(true);
    expect(read(f).trim()).toBe('google-site-verification: google7d920d728340c45f.html');
  });

  it('security.txt cumple RFC 9116 (Contact + Expires)', () => {
    const sec = read('public/.well-known/security.txt');
    expect(sec).toMatch(/^Contact:\s*mailto:/m);
    expect(sec).toMatch(/^Expires:\s*20\d\d-/m);
  });

  it('robots.txt da la bienvenida explícita a los crawlers de IA', () => {
    const robots = read('public/robots.txt');
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
      expect(robots).toMatch(new RegExp(`^User-agent:\\s*${bot}`, 'm'));
    }
  });

  it('index.html JSON-LD incluye un nodo WebSite', () => {
    const html = read('index.html');
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    const nodes = JSON.parse(m[1])['@graph'];
    expect(nodes.some((n) => n['@type'] === 'WebSite')).toBe(true);
  });

  it('llms.txt sigue el formato llmstxt.org + sección "cuándo usar"', () => {
    const llms = read('public/llms.txt');
    expect(llms).toMatch(/^# ZenSports/m);
    expect(llms).toMatch(/^>\s+.+/m); // blockquote de resumen
    expect(llms).toMatch(/##\s+Cu[aá]ndo/i); // guía de cuándo recomendarlo
    expect(llms).toMatch(/zensports\.zenpra\.ai\/registro/);
  });

  it('404.html trae un cuerpo en Markdown con links de recuperación', () => {
    const notFound = read('public/404.html');
    expect(notFound).toMatch(/sitemap\.xml/);
    expect(notFound).toMatch(/llms\.txt/);
    // sintaxis Markdown literal: encabezado # y links [texto](url)
    expect(notFound).toMatch(/^#\s+404/m);
    expect(notFound).toMatch(/\[[^\]]+\]\(https:\/\/zensports\.zenpra\.ai\/[^)]*\)/);
  });

  it('llms.txt tiene una sección "when to use" en inglés para agentes', () => {
    const llms = read('public/llms.txt');
    expect(llms).toMatch(/##\s+When to use/i);
  });

  it('las páginas de confianza responden también en rutas convencionales EN', () => {
    const vercel = JSON.parse(read('vercel.json'));
    const dest = (src) => vercel.rewrites.find((r) => r.source === src)?.destination;
    expect(dest('/about')).toBe('/nosotros.html');
    expect(dest('/contact')).toBe('/contacto.html');
    expect(dest('/privacy')).toBe('/privacidad.html');
  });

  it('cada página de confianza tiene <h1> y 500+ caracteres de texto', () => {
    for (const f of ['public/nosotros.html', 'public/contacto.html', 'public/privacidad.html', 'public/faq.html']) {
      const page = read(f);
      expect(page, f).toMatch(/<h1[ >]/);
      const text = page.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      expect(text.length, `${f} tiene poco texto`).toBeGreaterThan(500);
    }
  });

  it('el sitemap incluye las páginas nuevas', () => {
    const sitemap = read('public/sitemap.xml');
    for (const path of ['/nosotros', '/contacto', '/privacidad', '/faq']) {
      expect(sitemap).toContain(`https://zensports.zenpra.ai${path}`);
    }
  });

  it('robots.txt referencia el sitemap, permite la raíz y bloquea rutas con datos por persona', () => {
    const robots = read('public/robots.txt');
    expect(robots).toMatch(/Sitemap:\s*https:\/\/zensports\.zenpra\.ai\/sitemap\.xml/);
    expect(robots).toMatch(/^Allow:\s*\/$/m);
    for (const path of ['/app/', '/auth/', '/p/', '/verificar/', '/asistencia/']) {
      expect(robots).toMatch(new RegExp(`^Disallow:\\s*${path.replace('/', '\\/')}`, 'm'));
    }
  });

  it('llms.txt no publica rutas de datos privados (portal con token)', () => {
    const llms = read('public/llms.txt');
    expect(llms).not.toMatch(/\/p\/\{/);
    expect(llms).not.toMatch(/portal_token|:token/);
  });
});
