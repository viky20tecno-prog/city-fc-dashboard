# ZENSPORTS UI AUDIT — Brand Book v1.0 vs. estado actual del código

**Fecha:** 25 agosto 2026
**Alcance:** Audit + Foundation (Task 01 del `CLAUDE_CODE_HANDOFF.md`). Solo análisis — no se tocó código en esta fase.
**Fuente de verdad evaluada:** `ZENSPORTS_Brand_Book_v1.0_Master.pdf` + `CLAUDE_CODE_HANDOFF.md` + `tokens.colors.css` / `tokens.typography.css` / `tokens.motion.css` + `ASSET_MANIFEST.json` (paquete entregado por Diego, generado con ChatGPT).

---

## 1. Sistema actual (verificado en el código, no supuesto)

- **Color**: `--brand-primary: #6A00FF` / `--brand-secondary: #AE68FF` ya existen como tokens en `src/index.css`. Pero 5 archivos hardcodean el hex directo en vez de usar el token:
  - `src/pages/Login.jsx`
  - `src/pages/LandingPage.jsx`
  - `src/components/landing/Hero.jsx`
  - `src/pages/AsistenciaPublica.jsx`
  - `src/components/PlantillasMensajes.jsx`
  - Además, `Login.jsx` tiene su propio `CYCLE_COLORS` (5 morados que ciclan cada 4s), sin relación con los tokens de `index.css`.

- **Tipografía**: solo hay dos fuentes realmente *cargadas* como webfont:
  - `Sport Event` — OTF propio, self-hosted (`index.html`).
  - `Space Grotesk` — Google Fonts (`index.html`).
  - **`Inter` no está cargada en ningún lado.** Aunque `Login.jsx` declara `fontFamily: "'Inter', system-ui, sans-serif"`, el navegador nunca la descarga — cae en la fuente del sistema (San Francisco en Mac, Segoe en Windows, Roboto en Android), no en Inter real.
  - `src/index.css:288` → `--font-body: 'Space Grotesk', 'Inter', system-ui, sans-serif` — este es el default de **toda la app** (dashboard, landing, todo), no solo Login.
  - `src/index.css:287` → `--font-display: 'Sport Event', 'Space Grotesk', system-ui, sans-serif`.

- **Logo**: hoy `variant="icon"` y `variant="zz"` de `ZenSportsLogo.jsx` apuntan a `Z_Digital.webp` (reemplazo de `Logo_1.webp`/`Logo_ZZ.webp`, hecho hoy mismo). Se usa en 5 pantallas: navbar landing (32px), otra sección landing (40px), panel izquierdo Login (100px), panel izquierdo RegistroClub (100px), Hero landing (76px).

---

## 2. Brechas contra el Brand Book

### 2.1 Color no coincide
El book define `Primary Violet #7B3CFF` / `Secondary Violet #B26BFF`. La app usa `#6A00FF` / `#AE68FF`. Son morados distintos — el del book es más "violeta puro", el actual tira más a azul.
**Decisión pendiente:** ¿recoloreamos todo al valor oficial del book?

### 2.2 Exo 2 no existe en el proyecto
Cero archivos, cero referencias. La regla central del book — *"EXO 2 = IMPACTO · INTER = CLARIDAD"* — hoy no se cumple: usamos Space Grotesk donde el book pide Inter, y no usamos Exo 2 donde pide impacto (H1, hero, KPIs).

### 2.3 Cambiar el body font es una migración grande, no chica
`--font-body` es el default de toda la app. Pasar de Space Grotesk a Inter no es "cambiar Login", es un cambio de tipografía global — afecta dashboard, landing, todo.

### 2.4 El logo integrado puede no ser el correcto en cada contexto
El book distingue:
- **Isotipo Z** — "App, favicon, avatar y UI" (implica algo optimizado para tamaños chicos).
- **Brand Z** — "Versión dimensional/gradient para branding".
- **Digital Z** — "Versión **plana** para UI y loading".

El archivo `Z_Digital.png` que Diego pasó es visualmente un render 3D con reflejos fuertes — eso describe mejor a *Brand Z* que a un *Digital Z* plano. Hoy está integrado en los 5 usos de `variant="icon"` (incluyendo navbar a 32px), asumiendo que era la versión universal.
**Pendiente de confirmar:** ¿cuál de las 3 versiones es exactamente este archivo? ¿Existen o se van a generar las otras dos por separado?

### 2.5 El fondo del Login puede ser el asset equivocado
Este es el hallazgo más directamente accionable para la pregunta de "mejorar visualmente el Login":

`ASSET_MANIFEST.json` lista `login-mobile-background.webp` y `hero-background.webp` como **dos archivos P2 distintos**. El PDF también los separa:
- Página 17 ("Referencia · Login Móvil") — fondo **sutil**: un par de íconos de línea fina + un trazo de luz delgado, discreto.
- Página 18 ("Referencia · Brand Background / Hero") — composición densa con 4 atletas + stats + mapa + gráficas.

Lo integrado hoy en el Login (`Fondo_Login_movil.webp`, generado por Diego) se parece mucho más a la referencia de página 18 (**Hero**) que a la de página 17 (**Login**).

El book es explícito en la sección 11 (Login/Mobile): *"Si el fondo compite con el formulario: 1) reducir contraste, 2) aplicar overlay, 3) reducir glow, 4) reducir partículas — no rediseñar la identidad para resolver un problema de legibilidad."*

Ya se aplicó un degradado para que no tape el formulario, pero la causa raíz probablemente es que esa imagen densa estaba pensada para el Hero de la landing, no para el Login.

### 2.6 Radios no coinciden
El book pide `12px` para cards. La tarjeta del Login hoy usa `24px`. Los inputs sí están alineados (`12px`).

### 2.7 Login.jsx no respeta `prefers-reduced-motion`
El book lo exige explícitamente (sección 11 y checklist final de Definition of Done). `conoce-a-zen.html` sí lo respeta — `Login.jsx` no tiene ese guard en ninguna de sus animaciones (pulse-glow, shimmer, marquee, blobs).

### 2.8 La marquesina de features no está en la referencia del book
Página 17 muestra la grilla de 4 features **estática**, no animada en loop. No es necesariamente un error — fue un pedido explícito de Diego después de ver la versión estática — queda registrado como decisión suya, no descuido, por si se quiere alinear 1:1 con la referencia más adelante.

### 2.9 Punto a favor: la estructura general ya coincide
El layout armado hoy (logo grande + wordmark + headline "Bienvenido a tu club" + check de email + botón gradiente con flecha + grilla de features + footer de confianza) es **casi idéntico** a la referencia oficial del book (página 17). No fue guiado por este documento — se llegó por buen criterio de diseño de forma independiente — lo cual significa que no hay que rehacer la estructura, solo afinar color / tipografía / fondo / radios / motion.

---

## 3. Componentes afectados si se aprueba avanzar

| Impacto | Componentes |
|---|---|
| **Alto / global** | `index.css` (tokens de color y `--font-body`), `index.html` (cargar Inter + Exo 2), cualquier componente que use `var(--font-body)` — prácticamente toda la app |
| **Medio** | Los 5 archivos con hex hardcodeado, `Login.jsx` (`CYCLE_COLORS`, radios, motion, fondo), `ZenSportsLogo.jsx` (posible separación de variantes) |
| **Bajo / no tocar** | Dashboards de club — usan color *configurable por club*, no el violeta de marca ZenSports. Sistema aparte a propósito, no debe forzarse al violeta oficial |

---

## 4. Riesgos

- Cambiar `--font-body` globalmente sin probar puede romper anchos/alturas calculados en componentes que asumen las métricas de Space Grotesk (line-height, letter-spacing).
- Recolorear el violeta afecta visualmente cualquier pantalla propia de ZenSports (Login, landing, RegistroClub, superadmin) — no el dashboard de clubes, que debe quedar intacto.
- Si `Z_Digital.png` resulta ser "Brand Z" y no "Isotipo Z", hoy está mal aplicado en navbar (32px) y sitios chicos — se ve bien pero técnicamente no es el uso que el book documenta para esos contextos.

---

## 5. Siguiente paso recomendado

No tocar código todavía. Se necesita de Diego:

1. Confirmar qué versión del logo es exactamente `Z_Digital.png` (¿Isotipo, Brand Z, o Digital Z plano?) — o pasar las 3 variantes si existen/se van a generar.
2. Decidir si se genera un `login-mobile-background.webp` más sutil (siguiendo la referencia de página 17) en vez de reusar el Hero denso.
3. Luz verde para migrar `--font-body` a Inter + cargar Exo 2 — el cambio de mayor alcance, se prefiere confirmar antes de tocarlo.

Con eso, la Fase 1 (tokens: color + tipografía + radios + motion) queda lista para ejecutar, y de ahí se pasa directo a mejorar visualmente el Login con todo alineado al book real.
