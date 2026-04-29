# Plan de Pruebas — ClubContable (City FC)

> Archivo de referencia permanente. Compartir al inicio de cada sesión si se van a hacer pruebas.
> Última actualización: 2026-04-29

---

## RESULTADOS POR SESIÓN

### Sesión 2026-04-29

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

**Pendientes esta sesión:** WA4, WA7, WA8, A1-A5, D1-D4, J1-J9, U1-U10, PM1-PM5, AR1-AR5, C2-C3, C5-C10, I1-I5

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
| WA8 | Aprobar → mensualidad actualizada | Aprobar el pago del WA3 | Mensualidad del mes más antiguo pendiente pasa a AL_DIA o PARCIAL |

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

## BUGS CONOCIDOS / LIMITACIONES ACTUALES

- Los 4 pagos existentes con URLs de Twilio muestran "Sin imagen" (las URLs originales fueron borradas por requerir auth de Twilio). Los nuevos pagos funcionan correctamente con Supabase Storage.
- El historial de transacciones en EstadoCuenta solo muestra pagos aprobados (correcto por diseño).

---

## CHECKLIST DE REGRESIÓN RÁPIDA (smoke test)

Antes de cada despliegue verificar mínimo:

- [ ] Login funciona
- [ ] Tabla de jugadores carga
- [ ] EstadoCuenta de Diego Escobar (cédula 1032401947) abre y muestra mensualidades
- [ ] Tab Conciliación carga sin error
- [ ] Formulario `/inscripcion` accesible sin login
- [ ] `GET /api/health` retorna 200
