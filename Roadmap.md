# ClubContable — Roadmap SaaS

> Documento de continuidad. Si se cierra la sesión, compartir este archivo al inicio de la nueva conversación.
> Última actualización: 2026-04-28

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
├── index.js              ← servidor Express principal (auth middleware en línea 81)
├── middleware/
│   └── auth.js           ← valida JWT Supabase, protege todas las rutas excepto /inscripcion, /debug, /health
├── routes/
│   ├── arbitrage.js      ← partidos y pagos de árbitros
│   ├── config.js
│   ├── debug.js
│   ├── inscripcion.js    ← pública (sin auth) — inscripción de jugadores
│   ├── invoices.js       ← mensualidades, uniformes (tabla vieja), torneos
│   ├── payments.js       ← registro de pagos manuales
│   ├── players.js        ← jugadores
│   ├── reports.js
│   ├── suspensiones.js   ← suspensiones de jugadores
│   ├── uniforms.js       ← pedido_uniformes (tabla nueva) — GET, POST, PUT /:id
│   └── whatsapp.js
└── services/
    ├── db.js             ← cliente Supabase (todas las funciones de BD)
    └── sheets.js         ← DEPRECADO (no se usa, pero existe)
```

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
- `clubs` — id, name, slug, plan, is_active
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

- **WhatsApp Bot + Conciliación (COMPLETADO 2026-04-28):**
  - Flujo: Jugador envía foto comprobante → Twilio → Edge Function → GPT-4o Vision extrae monto/banco/referencia → guarda en `pagos` con `estado_revision='pendiente'` → responde acuse de recibo al jugador
  - El pago **NO se aplica automáticamente** — queda en lista de conciliación para validación manual
  - Admin revisa en Dashboard → tab Conciliación → puede editar datos, Aprobar (aplica a mensualidad/uniforme/torneo) o Rechazar
  - Edge Function: `supabase/functions/whatsapp-webhook/index.ts` — project-ref `olcevdnhmexaahymfzii`
  - Secrets configurados en Supabase: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (con prefijo `whatsapp:`), `OPENAI_API_KEY`, `CLUB_ID`, `SKIP_TWILIO_VALIDATION`
  - Webhook Twilio Sandbox configurado en: `https://olcevdnhmexaahymfzii.supabase.co/functions/v1/whatsapp-webhook`
  - API: `GET /payments?estado=pendiente`, `PUT /payments/:id` con `{accion: 'aprobar'|'rechazar'}` o edición de campos


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

### Módulo Conciliación (NUEVO — 2026-04-28)
- [x] Tab "Conciliación" en Dashboard (después de WhatsApp Bot)
- [x] Lista de pagos recibidos por WhatsApp con filtros: Pendiente / Aprobado / Rechazado
- [x] Columnas: Fecha, Jugador, Concepto, Monto, Banco, Referencia, Comprobante (link), Acciones
- [x] Modal de edición: concepto, monto, banco, referencia (con datalist de bancos)
- [x] Aprobar → aplica pago a mensualidad/uniforme/torneo y marca `aprobado_manual`
- [x] Rechazar → marca `rechazado` sin tocar tablas de estado
- [x] Total acumulado en footer de tabla
- [x] Toast de confirmación en cada acción
- [ ] **Pendiente:** Notificación WhatsApp al jugador al aprobar/rechazar

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
- [x] Backend: requireAuth middleware valida JWT en todas las rutas excepto /inscripcion, /debug, /health

### PagoManualModal
- [x] Registro de pago por jugador (busca por cédula)
- [x] Conceptos: Mensualidad, Uniformes (11 prendas actuales), Torneo, Otro
- [x] Registra pago en tabla `pagos` de Supabase

---

## ROADMAP — LO QUE FALTA

### ENTREGA CLIENTE — Pruebas inmediatas (esta semana)

- [ ] **Verificar Conciliación en producción**: confirmar que la tab aparece y carga pagos pendientes en Vercel
- [ ] **Prueba de flujo completo**: jugador envía foto → aparece en conciliación → admin aprueba → mensualidad se actualiza
- [ ] **Notificación al jugador al aprobar/rechazar**: enviar WhatsApp de confirmación final cuando el admin aprueba (llamar `sendWhatsAppMessage` desde el endpoint PUT /payments/:id con número del jugador)
- [ ] **Deploy API a producción**: los cambios de `payments.js` y `db.js` deben estar en Vercel (push ya hecho, verificar auto-deploy)

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

Pegar esto al inicio de la sesión:
```
Continúa el proyecto ClubContable (City FC). Lee el archivo Roadmap.md para contexto completo.
Stack: React+Vite (frontend) + Express.js serverless (backend) + Supabase (BD) + Supabase Auth.
Repos: github.com/viky20tecno-prog/city-fc-dashboard y city-fc-api-v2
Deploy automático en Vercel al hacer push a main.
Siguiente tarea: [INDICAR TAREA DEL ROADMAP]
```
