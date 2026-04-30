# ClubContable — Roadmap SaaS

> Documento de continuidad. Si se cierra la sesión, compartir este archivo al inicio de la nueva conversación.
> Última actualización: 2026-04-30 (sesión 4 — seguridad, anti-bot, jugador de prueba WA)

---

## CONTEXTO DEL PROYECTO

### Repositorios
- **Frontend:** https://github.com/viky20tecno-prog/city-fc-dashboard — desplegado en `city-fc-dashboard-pi.vercel.app`
- **Backend:** https://github.com/viky20tecno-prog/city-fc-api-v2 — desplegado en `city-fc-api-v2.vercel.app`

### Stack actual
- Frontend: **React + Vite** — tema azul eléctrico deep-space (`#060C18` bg, `#0A1628` cards, `#1A3A5C` borders, `#00AAFF` accent)
- Backend: **Express.js serverless en Vercel**
- Base de datos: **Supabase** (migración desde Google Sheets completada)
- Auth: **Supabase Auth** — JWT enviado vía `authFetch` en el frontend, validado con `requireAuth` middleware en el backend
- Deploy: **Vercel** (ambos repos — auto-deploy desde push a `main`)

### Estructura del backend
```
api/
├── index.js              ← servidor Express principal; auth + validateClubAccess middleware (post-SEC2 fix)
├── middleware/
│   └── auth.js           ← valida JWT Supabase, protege todas las rutas excepto /inscripcion, /health, /whatsapp
├── routes/
│   ├── arbitrage.js      ← partidos y pagos de árbitros
│   ├── config.js
│   ├── inscripcion.js    ← pública (sin auth) — inscripción de jugadores (rate-limited: 5/15min)
│   ├── invoices.js       ← mensualidades, uniformes (tabla vieja), torneos
│   ├── payments.js       ← registro de pagos manuales + sendWhatsAppMessage (Twilio)
│   ├── players.js        ← jugadores
│   ├── reports.js
│   ├── suspensiones.js   ← suspensiones de jugadores
│   ├── uniforms.js       ← pedido_uniformes (tabla nueva) — GET, POST, PUT /:id
│   └── whatsapp.js
└── services/
    ├── db.js             ← cliente Supabase (todas las funciones de BD)
    └── sheets.js         ← DEPRECADO (no se usa, pero existe)
```
> ⚠️ `debug.js` fue eliminado en sesión 4 (2026-04-30) — exponía credenciales de Google Service Account.

### Estructura del frontend
```
src/
├── App.jsx               ← rutas: /login (pública), /inscripcion (pública), /* (protegida)
├── config.js             ← API_BASE_URL, CLUB_ID hardcodeado ('city-fc')
├── lib/
│   └── supabase.js       ← cliente Supabase para el frontend
├── services/
│   ├── api.js            ← authFetch: fetch con Bearer token automático
│   └── sheets.js / writeSheets.js  ← DEPRECADOS
├── pages/
│   ├── Dashboard.jsx     ← 7 tabs: Dashboard, Jugadores, Uniformes, Pago Arbitraje, Ciclo de Cobro, WhatsApp Bot, Conciliación
│   ├── Login.jsx         ← Supabase signInWithPassword
│   ├── ArbitrajePagos.jsx
│   └── PedidoUniforme.jsx
├── components/
│   ├── StatsCards.jsx
│   ├── JugadoresTable.jsx    ← tabla de jugadores con modal EstadoCuenta
│   ├── EstadoCuenta.jsx      ← modal: mensualidades + pedido_uniformes + torneos + pagos
│   ├── MorososList.jsx
│   ├── RecaudacionChart.jsx
│   ├── TimelineCobro.jsx
│   ├── WhatsAppMockup.jsx
│   ├── PagoManualModal.jsx   ← registro manual de pagos (mensualidad/uniforme/torneo)
│   ├── Uniformes.jsx         ← módulo completo de pedidos de uniformes
│   ├── UniformesTab.jsx
│   ├── Conciliacion.jsx      ← lista de pagos WhatsApp pendientes de validación manual
│   ├── FormInscripcion.jsx   ← formulario público de inscripción (/inscripcion)
│   ├── ProtectedRoute.jsx    ← guard de autenticación
│   ├── ArbitrajeCrearPartido.jsx
│   ├── ArbitrajeGestionPagos.jsx
│   ├── ArbitrajeListadoPartidos.jsx
│   └── SuspensionModal.jsx
└── hooks/
    └── useSheetData.js       ← hook principal de datos (aún conectado al backend via API)
```

### Tablas Supabase (estado actual)
- `clubs` — id, name, slug, plan, is_active, **owner_user_id** (UUID → auth.users; migrado 2026-04-30)
- `players` — cedula, nombre, apellidos, celular, municipio, activo, etc.
- `mensualidades` — cedula, anio, mes, valor_oficial, valor_pagado, saldo_pendiente, estado
- `uniformes` — tabla vieja de pagos de uniforme (valor_oficial/pagado/pendiente)
- `pedido_uniformes` — tabla nueva: id, cedula, nombre, tipo (Jugador/Familiar-Hombre/Familiar-Mujer), prendas, talla, numero_estampar, nombre_estampar, total, estado (PENDIENTE/PAGADO/ENTREGADO), club_id, player_id
- `torneos` — cedula, nombre_torneo, valor_oficial/pagado/pendiente, estado
- `pagos` — historial de pagos manuales
- `partidos` — fecha, rival, lugar, categoria
- `arbitraje_pagos` — arbitro_nombre, monto, estado, fecha_pago
- `suspensiones` — jugador, fecha_inicio/fin, motivo

---

## FUNCIONALIDADES IMPLEMENTADAS

### Seguridad — sesión 4 (2026-04-30) ✅ COMPLETADO

- **SEC1 — debug.js eliminado**: ruta legacy que exponía `clientEmail` y primeros 40 chars del `private_key` de Google Service Account. Nunca estuvo montada en index.js (riesgo teórico), pero se eliminó para evitar accidentes futuros. Commit `9ddbb62`.
- **SEC2 — Cross-club data access resuelto**:
  - `ALTER TABLE clubs ADD COLUMN owner_user_id UUID REFERENCES auth.users(id)` ejecutado en Supabase.
  - UUID del admin (`viky20.tecno@gmail.com` → `327f5286-03e2-4961-a9cc-fae9ebfefe76`) asignado al club `city-fc`.
  - `validateClubAccess` middleware agregado a `api/index.js` (post-auth): valida `clubs.owner_user_id === req.user.id`. Si `owner_user_id` es NULL → acceso permitido (retrocompatible con clubs sin migrar).
- **Rate limiting — inscripción**: `express-rate-limit` (máx 5 req/15 min por IP, usando `x-forwarded-for` para Vercel). Respuesta genérica para no revelar el límite.
- **Honeypot server-side**: campo oculto `website` en formulario de inscripción; si viene relleno → respuesta fake 200 sin guardar nada.
- **Validaciones de formato server-side**: cédula (7-15 dígitos) y celular (10 dígitos) validados con regex antes de tocar la BD.
- **Security headers**: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `Cache-Control: no-store` en todas las respuestas.
- **Jugador de prueba WA**: creado `PRUEBA001` ("Jugador Prueba WhatsApp") con celular `3023903192`, 12 mensualidades, uniforme y 4 torneos. Diego Escobar (cédula `1032401947`) movido a celular `0000000000` para evitar conflictos de prueba.
- **`SKIP_TWILIO_VALIDATION`**: ya era env var (no hardcodeado) — verificado, sin cambios necesarios.

### Avances recientes y mejoras no listadas previamente

- **Gestión avanzada de arbitraje:**
  - Tabs para partidos, registro y gestión de pagos a árbitros.
  - Registro de partidos con selección de jugadores, monto por jugador, equipos, fecha y hora.
  - Gestión de pagos individuales por partido, con métodos de pago (efectivo, transferencia, aguas), barra de progreso y métricas financieras.
  - Visualización y edición de pagos por jugador en cada partido.

- **Integración total con API REST:**
  - Todos los datos del dashboard (jugadores, mensualidades, uniformes, torneos, pagos, suspensiones, morosos) se obtienen desde el backend Express/Supabase, eliminando dependencia de Google Sheets.

- **Mejoras UX/UI:**
  - Botón directo para abrir el formulario de inscripción en nueva pestaña y copiar enlace.
  - Indicadores visuales de estado, errores y carga en todos los módulos.
  - Tematización consistente y componentes reutilizables.

- **WhatsApp Bot + Conciliación (COMPLETADO y PROBADO 2026-04-29):**
  - Flujo: Jugador envía foto comprobante → Twilio → Edge Function → GPT-4o Vision extrae monto/banco/referencia → guarda en `pagos` con `estado_revision='pendiente'` → responde acuse de recibo al jugador
  - El pago **NO se aplica automáticamente** — queda en lista de conciliación para validación manual
  - Admin revisa en Dashboard → tab Conciliación → puede editar datos, Aprobar (aplica a mensualidad/uniforme/torneo) o Rechazar
  - Edge Function: `supabase/functions/whatsapp-webhook/index.ts` — project-ref `olcevdnhmexaahymfzii`
  - Secrets configurados en Supabase: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (con prefijo `whatsapp:`), `OPENAI_API_KEY`, `CLUB_ID`, `SKIP_TWILIO_VALIDATION`
  - Webhook Twilio Sandbox configurado en: `https://olcevdnhmexaahymfzii.supabase.co/functions/v1/whatsapp-webhook`
  - API: `GET /payments?estado=pendiente`, `PUT /payments/:id` con `{accion: 'aprobar'|'rechazar'}` o edición de campos
  - Comprobantes: imágenes se suben al bucket público `comprobantes` en Supabase Storage — se muestran como miniatura con lightbox en Conciliación
  - Historial de transacciones en EstadoCuenta: whitelist `aprobado_manual` — excluye pendiente, rechazado, esperando_concepto, excedente_pendiente

- **Fixes de deploy 2026-04-29:**
  - `api/routes/whatsapp.js` no estaba commiteado — causaba que todos los deploys de API fallaran. Corregido.
  - Edge Function redesplegada manualmente con `supabase functions deploy`

- **WhatsApp flujo avanzado — sesión 2 (2026-04-29):**
  - **Sesión de concepto (`esperando_concepto`)**: cuando jugador envía imagen sin concepto, el pago se guarda con `estado_revision='esperando_concepto'` en vez de solo preguntar. Cuando el jugador responde el concepto en mensaje de texto, el sistema busca el pago pendiente (últimos 30 min) y lo actualiza a `estado_revision='pendiente'` con el concepto correcto. Evita que el jugador tenga que reenviar la foto.
  - **Saldo a favor (`excedente_pendiente`)**: cuando un pago supera el `valor_oficial`, el excedente se guarda como nuevo registro en `pagos` con `estado_revision='excedente_pendiente'`. El jugador recibe un WhatsApp preguntando a qué concepto abonarlo. Cuando responde, el excedente se aplica y el registro pasa a `aprobado_manual`.
  - **Fix mensualidades**: `getMensualidadesPendientes` en `db.js` y `actualizarMensualidad` en Edge Function ahora filtran `.gt('valor_oficial', 0)` — excluye meses pre-inscripción (valor_oficial = 0).
  - **Fix historial EstadoCuenta**: filtro cambiado de blacklist a whitelist → solo muestra `estado_revision === 'aprobado_manual'`. Antes `esperando_concepto` y `excedente_pendiente` podían aparecer en el historial.
  - **Fix try-catch silencioso**: las funciones `actualizarMensualidad/Uniforme/Torneo` en `payments.js` tenían try-catch que ocultaba errores. Removido — ahora los errores propagaban y devuelven HTTP 500 con mensaje visible en el toast de Conciliación.
  - **`sendWhatsAppMessage` en Express API**: función agregada a `payments.js` que usa `TWILIO_ACCOUNT_SID/AUTH_TOKEN/WHATSAPP_FROM` de Vercel env. Si no están configuradas, loguea warning y continúa (excedente sí se guarda en DB).
  - **⚠️ Pendiente manual**: agregar `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886` en Vercel → city-fc-api-v2 → Settings → Environment Variables


### Módulo Dashboard (tab principal)
- [x] StatsCards: totales de jugadores, recaudación, morosos, pendientes
- [x] RecaudacionChart: gráfica de recaudación mensual
- [x] MorososList: listado de jugadores en mora
- [x] TimelineCobro: ciclo visual de cobro

### Módulo Jugadores
- [x] Tabla de jugadores activos con búsqueda
- [x] Modal EstadoCuenta por jugador:
  - [x] Mensualidades mes a mes con estado (AL_DIA / PENDIENTE / PARCIAL / MORA)
  - [x] Pedido de uniforme (pedido_uniformes) con prendas, talla, número, nombre y badge de estado
  - [x] Torneos inscritos
  - [x] Historial de pagos
- [x] SuspensionModal: registrar y ver suspensiones de jugadores

### Módulo Uniformes
- [x] Búsqueda de jugador por cédula para nuevo pedido
- [x] Formulario multi-step:
  - Step 1: buscar jugador
  - Step 2: seleccionar prendas (multi-selección con total acumulado), toggle "Para familiar" (Hombre/Mujer)
  - Step 3: talla, número a estampar, nombre a estampar
- [x] Tabla de pedidos con 3 pestañas: PENDIENTE / PAGADO / ENTREGADO
- [x] Cambio de estado: PENDIENTE → PAGADO (click en badge), PAGADO → ENTREGADO (botón)
- [x] Editar pedido (modal pre-llenado): prendas, talla, número, nombre, total
- [x] Badge "Familiar - Hombre/Mujer" en tabla cuando tipo ≠ Jugador
- [x] Descarga PDF: listado de pendientes, pagados y entregados (jsPDF, A4 landscape)
- [x] Validación de número duplicado

### Módulo Pago Arbitraje
- [x] Listado de partidos
- [x] Crear partido (fecha, rival, lugar, categoría)
- [x] Gestión de pagos por partido (árbitro principal/asistentes)
- [x] Marcar árbitros como pagados

### Módulo Ciclo de Cobro
- [x] TimelineCobro: visual del ciclo mensual de cobros

### Módulo WhatsApp Bot
- [x] WhatsAppMockup: vista de mensajes tipo WhatsApp

### Módulo Conciliación (2026-04-28/29)
- [x] Tab "Conciliación" en Dashboard (después de WhatsApp Bot)
- [x] Lista de pagos recibidos por WhatsApp con filtros: Pendiente / Aprobado / Rechazado
- [x] Columnas: Fecha, Jugador, Concepto, Monto, Banco, Referencia, Comprobante (link), Acciones
- [x] Modal de edición: concepto, monto, banco, referencia (con datalist de bancos)
- [x] Aprobar → aplica pago a mensualidad/uniforme/torneo y marca `aprobado_manual`
- [x] Rechazar → marca `rechazado` sin tocar tablas de estado
- [x] Total acumulado en footer de tabla
- [x] Toast de confirmación con error HTTP 500 visible (fix try-catch silencioso)
- [x] Saldo a favor: excedente guardado como `excedente_pendiente` + WhatsApp al jugador
- [ ] **Pendiente:** Notificación WhatsApp al jugador al aprobar/rechazar pago normal

### WhatsApp Bot — estados de sesión (2026-04-29)
- `pendiente` — pago recibido, listo para conciliación
- `aprobado_manual` — pago aprobado por admin
- `rechazado` — rechazado por admin
- `esperando_concepto` — imagen recibida, esperando respuesta del jugador con concepto (TTL 30 min)
- `excedente_pendiente` — saldo a favor, esperando respuesta del jugador sobre dónde abonar

### Formulario de Inscripción (público)
- [x] Ruta pública `/inscripcion` sin autenticación
- [x] Formulario con 5 secciones: personal, contacto, datos adicionales, residencia, emergencia
- [x] Validaciones: cédula (7-15 dígitos), celular (10 dígitos), email, campos obligatorios
- [x] Honeypot anti-spam
- [x] Pantalla de éxito tras inscripción
- [x] Tema azul eléctrico consistente con el dashboard

### Autenticación
- [x] Login con email/contraseña via Supabase Auth
- [x] ProtectedRoute: redirige a /login si no hay sesión
- [x] authFetch: envía Bearer token en todas las peticiones autenticadas
- [x] Backend: requireAuth middleware valida JWT en todas las rutas excepto /inscripcion, /health, /whatsapp
- [x] validateClubAccess: verifica que el usuario autenticado sea dueño del club solicitado (2026-04-30)

### PagoManualModal
- [x] Registro de pago por jugador (busca por cédula)
- [x] Conceptos: Mensualidad, Uniformes (11 prendas actuales), Torneo, Otro
- [x] Registra pago en tabla `pagos` de Supabase

---

## ROADMAP — LO QUE FALTA

### ENTREGA CLIENTE — Pruebas inmediatas (esta semana)

- [x] **Verificar Conciliación en producción**: ✅ PROBADO 2026-04-29
- [x] **Prueba de flujo completo**: ✅ PROBADO 2026-04-29 — WA1, WA2, WA3, WA5, WA6, C1, C4, C11 aprobados
- [x] **Deploy API a producción**: ✅ Corregido y redesplegado 2026-04-29
- [x] **Saldo a favor (excedente)**: ✅ Implementado — guarda excedente_pendiente + WhatsApp al jugador
- [x] **Sesión de concepto**: ✅ Implementado — esperando_concepto con TTL 30 min
- [x] **Fix mensualidades**: ✅ Excluye meses con valor_oficial=0
- [x] **Twilio env vars en Vercel**: ✅ `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` configurados en Vercel → city-fc-api-v2
- [ ] **Notificación al jugador al aprobar/rechazar pago normal**: WhatsApp de confirmación cuando admin aprueba o rechaza
- [x] **SEC1 — debug.js eliminado**: ✅ 2026-04-30
- [x] **SEC2 — Cross-club data access**: ✅ owner_user_id + validateClubAccess middleware 2026-04-30
- [x] **Rate limiting inscripción**: ✅ express-rate-limit 5/15min 2026-04-30
- [x] **Security headers**: ✅ X-Content-Type-Options, X-Frame-Options, etc. 2026-04-30
- [x] **Anti-bot inscripción**: ✅ honeypot server-side + validaciones regex 2026-04-30
- [x] **Jugador de prueba WA9/WA10/WA11**: ✅ PRUEBA001 (3023903192) creado en Supabase 2026-04-30
- [ ] **Notificación al jugador al aprobar/rechazar pago normal**: WhatsApp de confirmación cuando admin aprueba o rechaza
- [ ] **Completar set de pruebas WA9/WA10/WA11**: ⬅ PRÓXIMO — número 3023903192 debe unirse al Sandbox de Twilio (`join <palabra>` a `+14155238886`) antes de probar
- [ ] **Completar set de pruebas restante**: A1-A5, D1-D4, J1-J9, U1-U10, PM1-PM5, AR1-AR5, C2-C3, C5-C10, WA4, WA7, WA8, I1-I5 (ver PRUEBAS.md)

### PRIORIDAD ALTA — Funcional / Negocio

- [ ] **Multi-club real**: eliminar `CLUB_ID = 'city-fc'` hardcodeado en `config.js`, leerlo desde la sesión del usuario autenticado
- [ ] **Onboarding**: formulario para crear un club nuevo al registrarse (nombre, ciudad, slug)
- [ ] **Sistema de roles**: owner / admin / tesorero / viewer (tabla `club_members` ya existe en schema)
- [ ] **Invitar usuarios al club**: enviar email de invitación a un co-admin o tesorero

### PRIORIDAD MEDIA — Monetización SaaS

- [ ] **Stripe Checkout**: planes Básico ($9 USD) / Pro ($19 USD) / Premium ($29 USD)
- [ ] **Webhook Stripe** en `/api/webhooks/stripe`: actualizar `plan` y `plan_expires_at` en tabla `clubs`
- [ ] **Página de precios** en el frontend
- [ ] **Limitar features por plan**: ej. PDF solo en Básico+, reportes avanzados en Pro+

### PRIORIDAD MEDIA — Mejoras de producto

- [ ] **Reportes PDF generales**: estado de mensualidades de todos los jugadores (actualmente solo PDF de uniformes)
- [ ] **Gráficas mejoradas**: más métricas en RecaudacionChart (tendencia mes a mes, morosos histórico)
- [ ] **Logs de auditoría**: tabla `audit_logs` ya definida en schema, pero sin implementar
- [x] **WhatsApp + Conciliación**: Edge Function completa con GPT-4o Vision + flujo de conciliación manual en dashboard
- [ ] **Búsqueda de jugadores**: mejorar la búsqueda global (por nombre, apellido, cédula) en JugadoresTable
- [ ] **Editar jugador**: modal para actualizar datos del jugador (celular, dirección, etc.)
- [ ] **Dar de baja jugador**: marcar `activo = false` con fecha de baja

### PRIORIDAD BAJA — Escalamiento

- [ ] **Integración GoHighLevel**: webhook GHL → crear cuenta trial al registrarse
- [ ] **PWA**: app instalable en celular (manifest + service worker)
- [ ] **App móvil**: React Native en el futuro
- [ ] **Sistema de torneos avanzado**: inscripción por categorías, cuadros de playoff
- [ ] **API pública**: endpoints documentados para integraciones externas
- [ ] **Programa de afiliados**: referidos con comisión

### LIMPIEZA TÉCNICA (deuda)

- [ ] Eliminar `src/services/sheets.js` y `src/services/writeSheets.js` (ya deprecados, no se usan en nuevas features)
- [ ] Eliminar `api/services/sheets.js` del backend (deprecado)
- [ ] Limpiar `config.js`: remover SHEET_ID, API_KEY, APPS_SCRIPT_URL, SHEETS (todo Google Sheets)
- [ ] Eliminar `src/hooks/useSheetData.js` y migrar Dashboard a llamadas directas al API REST
- [ ] Revisar si `invoices.js` aún es necesario o si ya todo migró a `uniforms.js` y `payments.js`

---

## NOTAS IMPORTANTES

- El frontend usa **Vite**, no webpack — los imports de env son `import.meta.env.VITE_*`
- El backend corre Express como serverless en Vercel via `api/index.js`
- `/inscripcion` y `/pedido-uniforme` son **rutas públicas** — sin login
- El tema visual es **azul eléctrico deep-space**: `#060C18` fondo, `#0A1628` cards, `#1A3A5C` borders, `#00AAFF` acento. Al cambiar colores, actualizar TODOS los componentes
- jsPDF con fuente Helvetica **no soporta emojis Unicode** — usar solo texto ASCII en PDFs
- `pedido_uniformes.tipo` acepta: `'Jugador'` | `'Familiar - Hombre'` | `'Familiar - Mujer'`
- `pedido_uniformes.estado` acepta: `'PENDIENTE'` | `'PAGADO'` | `'ENTREGADO'`
- El diseño visual del frontend está consolidado — NO refactorizar UI sin razón de producto

---

## CÓMO CONTINUAR EN NUEVA SESIÓN

Pegar esto al inicio de la sesión (reemplazar la última línea según lo que se quiera hacer):

```
Continúa el proyecto ClubContable (City FC). Lee Roadmap.md y PRUEBAS.md para contexto completo.

Stack: React+Vite (frontend) + Express.js serverless Vercel (backend) + Supabase BD + Supabase Auth.
Repos: github.com/viky20tecno-prog/city-fc-dashboard y city-fc-api-v2 — deploy automático en Vercel al push a main.

Estado actual (2026-04-30):
- WhatsApp bot completo con GPT-4o Vision, conciliación manual, sesión de concepto (esperando_concepto) y saldo a favor (excedente_pendiente).
- Credenciales Twilio configuradas en Vercel (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM).
- Pagos: estado_revision puede ser pendiente / aprobado_manual / rechazado / esperando_concepto / excedente_pendiente.
- EstadoCuenta historial: solo muestra aprobado_manual (whitelist).
- Mensualidades: excluye meses con valor_oficial=0 (pre-inscripción).
- Seguridad: SEC1 y SEC2 resueltos, rate limiting, security headers, honeypot server-side.
- Jugador prueba WA: PRUEBA001 (celular 3023903192), Diego Escobar → celular 0000000000.
- DB: clubs.owner_user_id = '327f5286-03e2-4961-a9cc-fae9ebfefe76' para city-fc.

Siguiente tarea: [INDICAR — ej: "continuar pruebas WA9/WA10/WA11" (unir 3023903192 al Sandbox primero) o "notificación WhatsApp al aprobar/rechazar pago normal" o ver PRUEBAS.md]
```
