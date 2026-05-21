# ZenSports — Plan Maestro Checklist
**ZENPRA · Versión Mayo 2026**

> ✅ Completado · ⏳ En progreso · ❌ Pendiente · 🔑 Requiere acción externa de Diego

---

## FASE 1 — FUNDACIÓN PREMIUM

### Branding & Producto
- [x] ✅ Fix crítico: "ClubContable" → "ZenSports" en `Login.jsx`
- [x] ✅ Fix crítico: "ClubContable" → "ZenSports" en `RegistroClub.jsx`
- [x] ✅ Fix crítico: "ClubContable" → "ZenSports" en `OnboardingWizard.jsx`
- [x] ✅ "Hablar con Diego" → "Hablar con un Consultor ZenSports"
- [x] ✅ Footer: "ZENPRA © 2026" en todas las páginas
- [x] ✅ Fondo `Tony tech.jpg` eliminado → blobs CSS animados en Login y Registro
- [x] ✅ Iconos únicos por color en RegistroClub (Timer, Palette, Globe, ShieldCheck / MonitorPlay, Paintbrush, KeyRound, Gift)
- [ ] 🔑 Logo oficial en alta resolución (archivo .svg / .png)
- [ ] 🔑 Guía de marca formal (colores, tipografía, tono)
- [ ] 🔑 Dominio `zensports.co` comprado y apuntando a Vercel

### Landing Page (`zensports.vercel.app`)
- [x] ✅ Trial "5 días" → "14 días" en hero badge, CTA y pricing
- [x] ✅ Nav links con scroll suave (#producto, #automatizacion, #precios, #zcup)
- [ ] 🔑 Botones de pago activos — reemplazar `_REF` en `PAYMENT_LINKS` (~líneas 556-559 de LandingPage.jsx) con links reales Wompi/MercadoPago
- [ ] ❌ Social proof / casos de éxito reales (testimonios, logos de clubes)
- [ ] ❌ Video demo o mockup animado en el hero

### Sistema de Email
- [x] ✅ `services/email.js` creado con fetch nativo (sin npm) — templates dark ZenSports
- [x] ✅ `sendWelcomeClub()` — trigger automático al registrar club
- [x] ✅ `sendTrialExpiring()` — disponible para uso
- [x] ✅ `sendPlanActivated()` — disponible para uso
- [x] ✅ Degradación graceful si no hay API key
- [ ] 🔑 Crear cuenta Resend → obtener `RESEND_API_KEY`
- [ ] 🔑 Agregar `RESEND_API_KEY` en Vercel env vars (city-fc-api-v2 + zensports-admin)
- [ ] 🔑 Agregar `EMAIL_FROM=ZenSports <noreply@zensports.co>` en Vercel
- [ ] 🔑 Verificar dominio `zensports.co` en Resend DNS

### Admin Panel (`zensports-admin.vercel.app`)
- [x] ✅ Columna "Facturación" en tabla clubs (verde/amarillo/rojo)
- [x] ✅ Botón "Crear Demo Club" (super_admin only)
- [x] ✅ Club demo `Academia ZenSports FC` — 20 jugadores + 3 meses + todos los módulos
- [x] ✅ Menú acciones: "Ver dashboard" + "Enviar recordatorio" (trial/expired)
- [x] ✅ `lib/audit.ts` — AuditAction ampliado (DEMO_SEEDED, PAYMENT_REMINDER_SENT, CLUB_DELETED)
- [x] ✅ Email recordatorio de pago con template premium
- [x] ✅ Dashboard ejecutivo (KPIs, MRR, gráficas)
- [x] ✅ Gestión de administradores (CRUD, roles RBAC)
- [x] ✅ Audit Logs completos
- [x] ✅ Analytics SaaS (MRR, churn, revenue)
- [x] ✅ Detalle de club (5 tabs: jugadores, pagos, auditoría, notas, módulos)
- [x] ✅ Módulos por plan con toggle y lock

### Backend API (`city-fc-api-v2`)
- [x] ✅ Trial corregido de 5 → 14 días en `routes/registro.js`
- [x] ✅ Trigger email bienvenida al registrar club

### Infraestructura
- [x] ✅ `zensports.vercel.app` — frontend clubs en producción
- [x] ✅ `city-fc-api-v2.vercel.app` — backend en producción
- [x] ✅ `zensports-admin.vercel.app` — admin panel en producción
- [ ] 🔑 Conectar `zensports-admin` a GitHub (sin remote actualmente — deploy manual)
- [ ] ❌ Error tracking (Sentry o similar) — sin observabilidad hoy
- [ ] ❌ Custom domain en Vercel (`app.zensports.co`, `admin.zensports.co`, `api.zensports.co`)

---

## FASE 2 — VALIDACIÓN COMERCIAL

### Monetización
- [ ] 🔑 Elegir proveedor de pagos: Wompi (Colombia) o MercadoPago (América)
- [ ] 🔑 Crear links de pago por plan (Starter/Pro/Total) y reemplazar en landing
- [ ] ❌ Integración nativa de pagos en plataforma (PSE, Nequi, Wompi, Daviplata)
- [ ] ❌ Flujo trial → pago automatizado (secuencia de emails por días restantes: -7, -3, -1, vencido)
- [ ] ❌ Webhook de confirmación de pago → activar plan automáticamente
- [ ] ❌ Pricing definitivo validado con mercado (actualmente en código: $59K/$99K/$149K vs Master Plan: $149K/$399K/$799K — inconsistencia pendiente de resolver)

### Adquisición de clientes
- [ ] ❌ 5 clubes pagando (meta mínima de validación)
- [ ] ❌ 20 clubes pagando (meta Fase 2)
- [ ] ❌ Primer caso de éxito documentado con métricas (City FC candidato natural)
- [ ] ❌ Testimonios en landing
- [ ] ❌ Programa de referidos (un club trae otro club)

### Portal Atleta / Padre
- [ ] ❌ Página pública `zensports.vercel.app/p/:cedula` — consulta de mensualidades sin login
- [ ] ❌ Generación de QR por jugador para compartir por WhatsApp
- [ ] ❌ Vista: estado mensualidades, saldo pendiente, historial de pagos
- [ ] ❌ Pago online desde el portal del atleta

### Onboarding optimizado
- [ ] ❌ Onboarding guiado step-by-step para nuevos clubs (wizard post-registro)
- [ ] ❌ Checklist de activación visible en el dashboard del club
- [ ] ❌ Email de onboarding (día 1, día 3, día 7 tras registro)
- [ ] ❌ Video de bienvenida / tour del producto

### WhatsApp Producción
- [ ] 🔑 Migrar de Twilio Sandbox a número WABA (WhatsApp Business API) propio
- [ ] ❌ Flujo de cobro automático verificado en número de producción

---

## FASE 3 — MOTOR DE CRECIMIENTO

### WhatsApp Bot IA
- [ ] ❌ Agente Claude integrado en WhatsApp del club
- [ ] ❌ Q&A del club (horarios, costos, eventos)
- [ ] ❌ Difusiones segmentadas por equipo/categoría
- [ ] ❌ Notificaciones de pago conversacionales
- [ ] ❌ Cobranza conversacional ("¿Cuánto debo?" → respuesta automática)

### Torneos
- [ ] ❌ Fixture automático (eliminación directa, todos contra todos)
- [ ] ❌ Llaves visuales y bracket
- [ ] ❌ Resultados en tiempo real
- [ ] ❌ Tabla de posiciones automática

### Marketing & Crecimiento
- [ ] ❌ Canal de contenido (LinkedIn, TikTok, Instagram) — casos de éxito
- [ ] ❌ Google Ads / Meta Ads configurados
- [ ] ❌ Partnership con 2-3 federaciones departamentales
- [ ] ❌ Programa de afiliados para entrenadores

### Expansión Colombia
- [ ] ❌ 50 clubes pagando en Colombia
- [ ] ❌ Presencia en las 5 ciudades principales (Bogotá, Medellín, Cali, Barranquilla, Bucaramanga)

---

## FASE 4 — MOAT TECNOLÓGICO

### IA en producto
- [ ] ❌ Copiloto IA para el administrador del club (sugerencias, alertas)
- [ ] ❌ Predicción de churn (detectar clubs que van a cancelar)
- [ ] ❌ Predicción de mora (detectar jugadores que no van a pagar)
- [ ] ❌ Reportes automáticos generados por IA

### App Móvil
- [ ] ❌ PWA installable (sin App Store)
- [ ] ❌ Push notifications nativas
- [ ] ❌ Modo offline básico

### Marketplace
- [ ] ❌ Catálogo de uniformes con proveedores integrados
- [ ] ❌ Perfil público del atleta (scouting)
- [ ] ❌ API pública para integraciones de terceros

### Analytics Avanzado
- [ ] ❌ Sentry / error tracking en los 3 repos
- [ ] ❌ Analytics de producto (qué módulos se usan más, dónde se caen)
- [ ] ❌ Business Intelligence para directivos del club

---

## FASE 5 — EXPANSIÓN GLOBAL

- [ ] ❌ México — localización, proveedor de pagos local (Conekta/OpenPay), GTM local
- [ ] ❌ Chile — localización, Transbank/Khipu
- [ ] ❌ Perú — localización, Culqi/Izipay
- [ ] ❌ España — SEPA, facturación electrónica
- [ ] ❌ USA Latino — Stripe, inglés/español

---

## CAMPOS PENDIENTES DE COMPLETAR (Input Diego)

- [ ] 🔑 Dominio comprado y URLs definitivas confirmadas
- [ ] 🔑 Logo oficial en alta resolución (.svg / .png)
- [ ] 🔑 Visión/misión formal de la empresa
- [ ] 🔑 Objeciones reales recibidas de prospectos
- [ ] 🔑 Análisis competidores (Cluubi, SportEasy, Spond, Pitchero, TeamSnap, PlayMetrics)
- [ ] 🔑 Feedback cualitativo de City FC (primer cliente)
- [ ] 🔑 Costo real de operación por mes (Vercel + Supabase + Twilio)
- [ ] 🔑 Segmento objetivo confirmado (academias formativas 50-200 atletas recomendado)
- [ ] 🔑 Proveedor de pagos elegido (Wompi / MercadoPago / ambos)
- [ ] 🔑 Número WhatsApp Business propio para producción
- [ ] 🔑 Resolución del pricing: $59K/$99K/$149K (en código) vs $149K/$399K/$799K (Master Plan)

---

## RESUMEN DE PROGRESO

| Fase | Total items | Completados | Pendiente código | Pendiente externo |
|------|-------------|-------------|-----------------|-------------------|
| Fase 1 | 32 | 22 | 2 | 8 |
| Fase 2 | 22 | 0 | 18 | 4 |
| Fase 3 | 13 | 0 | 13 | 0 |
| Fase 4 | 11 | 0 | 11 | 0 |
| Fase 5 | 5 | 0 | 5 | 0 |
| Input Diego | 11 | 0 | 0 | 11 |
| **Total** | **94** | **22 (23%)** | **49** | **23** |

---

*Generado: Mayo 2026 · ZenSports — ZENPRA · Roadmap Top 1% SaaS Global*
