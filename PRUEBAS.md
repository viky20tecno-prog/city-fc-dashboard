# Plan de Pruebas — ClubContable (City FC)

> Archivo de referencia permanente. Compartir al inicio de cada sesión si se van a hacer pruebas.
> Última actualización: 2026-04-29 (sesión 3 — diagnóstico estático integral)

---

## RESULTADOS POR SESIÓN

### Sesión 3 — 2026-04-29 (diagnóstico estático integral)

**Metodología:** análisis de código fuente completo — backend Express, Edge Function WhatsApp, frontend React.

#### Estado de módulos (análisis estático)

| Módulo | Estado | Notas |
|---|---|---|
| Autenticación | ✅ IMPLEMENTADO | JWT Supabase, ProtectedRoute, requireAuth middleware |
| Dashboard (stats, chart, morosos) | ✅ IMPLEMENTADO | Datos desde `/api/reports/summary` |
| Jugadores (tabla, búsqueda, EstadoCuenta) | ✅ IMPLEMENTADO | Búsqueda en-memoria, funcional |
| Suspensiones | ✅ IMPLEMENTADO | POST/DELETE en backend, SuspensionModal en frontend |
| Uniformes (pedido, estados, PDF, familiar) | ✅ IMPLEMENTADO | Posible bug menor en comparación de número (string vs string) |
| Pago Manual | ✅ IMPLEMENTADO | Concepto, monto, banco, referencia |
| Arbitraje | ✅ IMPLEMENTADO | Partidos, gestión pagos, resumen |
| Conciliación (filtros, editar, aprobar, rechazar) | ✅ IMPLEMENTADO | |
| WhatsApp Bot — flujos base | ✅ IMPLEMENTADO | |
| WhatsApp — esperando_concepto (WA9) | ✅ IMPLEMENTADO | Pendiente prueba end-to-end con Twilio |
| WhatsApp — excedente_pendiente (WA10/WA11) | ✅ IMPLEMENTADO | Pendiente prueba end-to-end con Twilio |
| Formulario inscripción | ✅ IMPLEMENTADO | |
| Sistema de roles | ❌ NO EXISTE | Tabla club_members no está en código; cero verificación de rol |

#### Hallazgos de seguridad (diagnóstico estático)

| Severidad | Hallazgo | Ubicación |
|---|---|---|
| 🔴 CRÍTICO | `/api/debug` expone `clientEmail` y primeros 40 chars de `private_key` de Google Service Account sin autenticación | `api/routes/debug.js` línea 33 |
| 🔴 CRÍTICO | No hay validación que el usuario autenticado pertenece al `club_id` solicitado — usuario de Club A puede leer datos de Club B con `?club_id=otro-club` | `api/index.js` línea 55-73 |
| 🟠 ALTO | `inscripcion.js` hardcodea `'city-fc'` en línea 32 — inscripción multi-club imposible | `api/routes/inscripcion.js:32` |
| 🟠 ALTO | Edge Function hardcodea `CLUB_SLUG = 'city-fc'` — bot WhatsApp solo funciona para City FC | `supabase/functions/whatsapp-webhook/index.ts:10` |
| 🟡 MEDIO | `SKIP_TWILIO_VALIDATION` debería ser env var; si se sube en código como `'true'` permite bypassear firma Twilio en producción | Edge Function línea 11 |
| 🟡 MEDIO | Webhook Make.com (`/api/whatsapp/pago-comprobante`) validado solo con header secret, sin JWT | `api/routes/whatsapp.js:12-18` |

#### Deuda técnica activa que bloquea roles

1. **Tabla `club_members` no existe** en código ni en `db.js` — hay que crearla en Supabase antes de implementar roles
2. **Middleware `requireAuth` solo verifica JWT existe**, no extrae rol del usuario
3. **`club_id` no se valida contra el usuario autenticado** — se acepta cualquier string en query param
4. **Valores duplicados en 3+ lugares**: CUOTA_MENSUAL, torneos, prendas uniformes, bancos — no bloquea roles pero complica mantenimiento

#### Casos de prueba validados estáticamente (código correcto, listos para probar manualmente)

A1-A5, D1-D4, J1-J8, U1-U4, U6-U10, PM1-PM5, AR1-AR5, C1-C11, WA1-WA8, I1-I5

#### Casos que requieren prueba end-to-end con dispositivo/Twilio

WA9, WA10, WA11 — implementados en código, no verificables estáticamente

#### Casos con riesgo potencial (verificar en prueba manual)

- **J9** (jugador suspendido no aparece en morosos): lógica de suspensiones en reports.js debe excluirlos — verificar
- **U5** (número duplicado): comparación string vs string en Uniformes.jsx línea 74/110 — puede fallar si uno es número y el otro string
- **WA10** (saldo a favor): `excedente_pendiente` se crea en BD pero la UI de Conciliación no tiene filtro para ese estado — el admin no lo verá en ningún tab

---

### Sesión 2 — 2026-04-29 (continuación)

| Caso | Resultado | Observación |
|---|---|---|
| WA3 — Mensualidades actualizadas | ✅ APROBADO | Fix: excluir meses valor_oficial=0; fix: try-catch silencioso removido |
| WA9 — Concepto en mensaje separado | ✅ IMPLEMENTADO | esperando_concepto TTL 30 min — pendiente prueba end-to-end |
| WA10 — Pago con saldo a favor | ✅ IMPLEMENTADO | excedente_pendiente + WhatsApp al jugador — pendiente prueba (requiere Twilio en Vercel) |
| WA11 — Respuesta a saldo a favor | ✅ IMPLEMENTADO | Aplica excedente al concepto elegido — pendiente prueba |

**Fixes confirmados esta sesión:**
- Historial EstadoCuenta: whitelist `aprobado_manual` — estados nuevos (esperando_concepto, excedente_pendiente) no aparecen
- Mensualidades: meses con valor_oficial=0 excluidos del cálculo de pendientes
- Errores de aprobación ahora visibles en el toast (antes se ocultaban silenciosamente)

**Pendientes de prueba:** WA4, WA7, WA8, WA9, WA10, WA11, A1-A5, D1-D4, J1-J9, U1-U10, PM1-PM5, AR1-AR5, C2-C3, C5-C10, I1-I5

---

### Sesión 1 — 2026-04-29

| Caso | Resultado | Observación |
|---|---|---|
| WA1 — Sin imagen | ✅ APROBADO | |
| WA2 — Imagen sin concepto | ✅ APROBADO | |
| WA3 — Flujo completo mensualidad | ✅ APROBADO | Banco "No especificado" manejado correctamente |
| WA5 — Número no registrado | ✅ APROBADO | |
| WA6 — Imagen ilegible | ✅ APROBADO | OCR sensible a calidad de imagen |
| C1 — Ver pendientes | ✅ APROBADO | |
| C4 — Aprobar pago | ✅ APROBADO | |
| C11 — Historial tras aprobación | ✅ APROBADO | Solo pagos aprobados visibles |

---

## URLS

| Entorno | URL |
|---|---|
| Frontend (Vercel) | https://city-fc-dashboard-pi.vercel.app |
| Backend API (Vercel) | https://city-fc-api-v2.vercel.app |
| Supabase Dashboard | https://supabase.com/dashboard/project/olcevdnhmexaahymfzii |
| Edge Function logs | https://supabase.com/dashboard/project/olcevdnhmexaahymfzii/functions |
| Formulario inscripción | https://city-fc-dashboard-pi.vercel.app/inscripcion |
| Twilio WhatsApp Sandbox | https://console.twilio.com → Messaging → Try it out → WhatsApp |

---

## DATOS DE PRUEBA

- **Jugador:** Diego Escobar — cédula `1032401947`
- **Número WhatsApp jugador:** el registrado en la tabla `players` para esa cédula
- **WhatsApp Sandbox:** enviar mensaje a `+14155238886` con código `join <palabra>`
- **Club slug:** `city-fc`

---

## 1. AUTENTICACIÓN

| # | Caso | Pasos | Esperado |
|---|---|---|---|
| A1 | Login válido | Ir a `/login`, ingresar credenciales correctas | Redirige al Dashboard |
| A2 | Login inválido | Ingresar email o contraseña incorrectos | Mensaje de error, no redirige |
| A3 | Ruta protegida sin sesión | Ir a `/` sin estar logueado | Redirige a `/login` |
| A4 | Ruta pública sin sesión | Ir a `/inscripcion` sin estar logueado | Carga el formulario normalmente |
| A5 | Cerrar sesión | Click en botón de logout | Redirige a `/login`, token eliminado |

---

## 2. DASHBOARD (tab principal)

| # | Caso | Esperado |
|---|---|---|
| D1 | StatsCards carga | 4 tarjetas con valores reales: jugadores activos, recaudación total, morosos, pendientes |
| D2 | RecaudacionChart | Barras por mes con montos |
| D3 | MorososList | Lista de jugadores con saldo pendiente |
| D4 | Refresh manual | Botón de actualizar recarga datos |

---

## 3. JUGADORES

| # | Caso | Pasos | Esperado |
|---|---|---|---|
| J1 | Tabla carga | Entrar a tab Jugadores | Listado de jugadores activos |
| J2 | Búsqueda | Escribir "Diego" en buscador | Filtra resultados en tiempo real |
| J3 | EstadoCuenta — abrir | Click en jugador | Modal se abre con datos del jugador |
| J4 | EstadoCuenta — mensualidades | Ver sección mensualidades | Muestra cada mes con estado: AL_DIA / PENDIENTE / PARCIAL / MORA |
| J5 | EstadoCuenta — uniforme | Ver sección uniforme | Muestra prendas, talla, número, nombre, estado del pedido |
| J6 | EstadoCuenta — historial | Ver sección historial | Solo muestra pagos **aprobados** (no pendientes) |
| J7 | EstadoCuenta — torneos | Ver sección torneos | Torneos inscritos con estado de pago |
| J8 | Suspensión — registrar | Click ícono suspensión → completar formulario | Suspensión guardada, aparece en lista |
| J9 | Suspensión — jugador suspendido | Jugador con suspensión activa | No aparece en morosos durante el período |

---

## 4. UNIFORMES

| # | Caso | Pasos | Esperado |
|---|---|---|---|
| U1 | Buscar jugador | Ingresar cédula `1032401947` | Muestra nombre del jugador |
| U2 | Seleccionar prendas | Click en prendas (camiseta, pantaloneta, etc.) | Total se acumula correctamente |
| U3 | Toggle familiar | Activar "Para familiar" → seleccionar Hombre/Mujer | Tipo cambia a `Familiar - Hombre` o `Familiar - Mujer` |
| U4 | Completar pedido | Llenar talla, número, nombre → Guardar | Pedido aparece en tab PENDIENTE |
| U5 | Número duplicado | Intentar pedir con número ya existente | Validación bloquea el envío |
| U6 | Cambio PENDIENTE → PAGADO | Click en badge PENDIENTE en la tabla | Estado cambia a PAGADO |
| U7 | Cambio PAGADO → ENTREGADO | Click en botón Entregado | Estado cambia a ENTREGADO, pasa a tab ENTREGADO |
| U8 | Editar pedido | Click en ícono editar | Modal pre-llenado, guardar actualiza datos |
| U9 | Descargar PDF | Click en botón PDF | Descarga archivo con pedidos pendientes, pagados y entregados |
| U10 | Badge familiar en tabla | Pedido tipo Familiar | Badge "Familiar - Hombre/Mujer" visible en tabla |

---

## 5. PAGO MANUAL (PagoManualModal)

| # | Caso | Pasos | Esperado |
|---|---|---|---|
| PM1 | Buscar jugador | Ingresar cédula | Nombre del jugador aparece |
| PM2 | Pago mensualidad | Concepto: mensualidad, monto, banco → Registrar | Pago guardado, mensualidad del mes más antiguo pendiente se actualiza |
| PM3 | Pago uniforme | Concepto: uniforme → Registrar | Pago guardado, tabla `uniformes` actualizada |
| PM4 | Pago torneo | Concepto: torneo → Registrar | Pago guardado, tabla `torneos` actualizada |
| PM5 | Aparece en historial | Abrir EstadoCuenta del jugador | El pago recién registrado aparece en historial |

---

## 6. ARBITRAJE

| # | Caso | Esperado |
|---|---|---|
| AR1 | Listado de partidos | Tab Pago Arbitraje → lista de partidos cargados |
| AR2 | Crear partido | Completar formulario (fecha, rival, lugar, categoría) → partido aparece en lista |
| AR3 | Gestión pagos | Seleccionar partido → registrar árbitro principal y asistentes con montos |
| AR4 | Marcar pagado | Click en árbitro → marcar como pagado |
| AR5 | Barra de progreso | Según árbitros pagados, barra de progreso se actualiza |

---

## 7. CICLO DE COBRO

| # | Caso | Esperado |
|---|---|---|
| CC1 | TimelineCobro carga | Visual del ciclo mensual: días 1-5, 6-7, 8+ |

---

## 8. WHATSAPP BOT (tab)

| # | Caso | Esperado |
|---|---|---|
| WB1 | WhatsAppMockup | Muestra vista de conversación estilo WhatsApp |

---

## 9. CONCILIACIÓN

| # | Caso | Pasos | Esperado |
|---|---|---|---|
| C1 | Tab Pendiente | Click en Pendiente | Lista de pagos WhatsApp sin revisar |
| C2 | Tab Aprobados | Click en Aprobados | Pagos previamente aprobados |
| C3 | Tab Rechazados | Click en Rechazados | Pagos previamente rechazados |
| C4 | Aprobar pago | Click en ✓ en un pago pendiente | Pago se mueve a Aprobados; mensualidad/uniforme/torneo se actualiza en Supabase |
| C5 | Rechazar pago | Click en ✗ en un pago pendiente | Pago se mueve a Rechazados; ninguna tabla de estado se modifica |
| C6 | Editar antes de aprobar | Click en ✏ → cambiar monto, banco, concepto → Guardar → Aprobar | Los datos editados son los que se aplican |
| C7 | Comprobante (nuevo) | Pago con imagen subida a Supabase Storage | Miniatura visible en columna Comprobante, click abre lightbox |
| C8 | Comprobante (sin imagen) | Pago sin url_comprobante | Muestra "Sin imagen" |
| C9 | Total en footer | Ver footer de tabla | Suma correcta de montos en el filtro activo |
| C10 | No aparece en historial | Verificar EstadoCuenta del jugador | Pagos pendientes NO aparecen en historial de transacciones |
| C11 | Sí aparece en historial tras aprobar | Aprobar → abrir EstadoCuenta | Pago aprobado aparece en historial |

---

## 10. FLUJO WHATSAPP END-TO-END

> Prerequisito: estar unido al Sandbox de Twilio enviando el código de join.

| # | Caso | Pasos | Esperado |
|---|---|---|---|
| WA1 | Sin imagen → pide foto | Enviar texto plano al número de Twilio | Bot responde pidiendo foto del comprobante |
| WA2 | Con imagen sin concepto | Enviar foto sin texto | Bot extrae datos y pide que se especifique concepto (mensualidad/uniforme/torneo) |
| WA3 | Flujo completo mensualidad | Enviar foto + texto "mensualidad" | Bot confirma extracción → acuse de recibo → pago aparece en Conciliación como pendiente |
| WA4 | Flujo completo uniforme | Enviar foto + texto "uniforme" | Igual que WA3 pero concepto = uniforme |
| WA5 | Jugador no registrado | Enviar desde número no registrado | Bot responde "no encontramos un jugador registrado con tu número" |
| WA6 | Imagen ilegible | Enviar imagen sin datos claros | Bot pide reenviar con mejor resolución |
| WA7 | Imagen en Supabase Storage | Revisar pago en Conciliación | url_comprobante apunta a `supabase.co/storage`, miniatura visible |
| WA8 | Aprobar → mensualidad actualizada | Aprobar el pago del WA3 | Mensualidad del mes más antiguo pendiente (valor_oficial > 0) pasa a AL_DIA o PARCIAL |
| WA9 | Concepto en mensaje separado | (1) Enviar foto sin texto de concepto → (2) Responder con "mensualidad" en nuevo mensaje | Bot guarda pago como `esperando_concepto` al recibir la foto; al responder el concepto, actualiza el pago a `pendiente` y envía acuse de recibo. No pide reenviar la foto. |
| WA10 | Saldo a favor — pago excedente | Aprobar un pago cuyo monto supere el valor_oficial de la mensualidad | Admin aprueba desde Conciliación → mensualidad se marca AL_DIA → jugador recibe WhatsApp preguntando a qué concepto abonar el excedente (`excedente_pendiente` creado en BD) |
| WA11 | Respuesta saldo a favor | Jugador responde "uniforme" (o "mensualidad" / "torneo") al mensaje del excedente | Bot aplica el monto del excedente al concepto elegido → pago excedente pasa a `aprobado_manual` → jugador recibe confirmación |

---

## 11. FORMULARIO DE INSCRIPCIÓN (público)

| # | Caso | Pasos | Esperado |
|---|---|---|---|
| I1 | Acceso sin login | Ir a `/inscripcion` directamente | Carga sin redirigir a login |
| I2 | Validación cédula | Ingresar menos de 7 dígitos | Error de validación |
| I3 | Validación celular | Ingresar número distinto de 10 dígitos | Error de validación |
| I4 | Campos obligatorios | Intentar enviar sin llenar campos requeridos | Validación bloquea el envío |
| I5 | Envío exitoso | Completar todo correctamente → Enviar | Pantalla de éxito. Jugador aparece en tabla de jugadores |

---

## 12. API — VERIFICACIÓN DE SEGURIDAD

```bash
# Health check (público)
curl https://city-fc-api-v2.vercel.app/api/health

# Ruta protegida sin token → debe retornar 401
curl https://city-fc-api-v2.vercel.app/api/players?club_id=city-fc

# Ruta pública → debe retornar 200
curl -X POST https://city-fc-api-v2.vercel.app/api/inscripcion \
  -H "Content-Type: application/json" \
  -d '{"cedula":"9999999","nombre":"Test","apellidos":"Test","celular":"3001234567","municipio":"Bogotá"}'
```

---

## 13. SEGURIDAD — HALLAZGOS DEL DIAGNÓSTICO ESTÁTICO

> Sección agregada en sesión 3 (2026-04-29). Estos casos deben resolverse antes de abrir el sistema a múltiples clubs.

| # | Caso | Severidad | Pasos | Esperado | Estado actual |
|---|---|---|---|---|---|
| SEC1 | `/api/debug` expone credenciales | 🔴 CRÍTICO | `curl https://city-fc-api-v2.vercel.app/api/debug` sin token | Debe retornar 401 o no exponer private_key/clientEmail | ❌ Expone datos sin auth |
| SEC2 | Cross-club data access | 🔴 CRÍTICO | Con token válido de City FC, hacer GET `/api/players?club_id=otro-club-slug` | Debe retornar 403 o array vacío | ❌ Retorna datos del club solicitado |
| SEC3 | Inscripción multi-club | 🟠 ALTO | POST `/api/inscripcion` con datos de club distinto | Debe respetar el club_id enviado | ❌ Siempre registra en city-fc |
| SEC4 | Bot WhatsApp multi-club | 🟠 ALTO | Configurar segundo club con bot propio | Debe enrutar al club correcto | ❌ Hardcodeado a city-fc |

---

## BUGS CONOCIDOS / LIMITACIONES ACTUALES

- Los 4 pagos existentes con URLs de Twilio muestran "Sin imagen" (las URLs originales fueron borradas por requerir auth de Twilio). Los nuevos pagos funcionan correctamente con Supabase Storage.
- El historial de transacciones en EstadoCuenta solo muestra pagos `aprobado_manual` (correcto por diseño — whitelist).
- WA10/WA11 (saldo a favor con WhatsApp): credenciales Twilio ya configuradas en Vercel. Listo para prueba.
- Meses pre-inscripción (valor_oficial=0) ya se excluyen del cálculo de pendientes — no deben aparecer como PENDIENTE en EstadoCuenta.

---

## CHECKLIST DE REGRESIÓN RÁPIDA (smoke test)

Antes de cada despliegue verificar mínimo:

- [ ] Login funciona
- [ ] Tabla de jugadores carga
- [ ] EstadoCuenta de Diego Escobar (cédula 1032401947) abre y muestra mensualidades
- [ ] Tab Conciliación carga sin error
- [ ] Formulario `/inscripcion` accesible sin login
- [ ] `GET /api/health` retorna 200
