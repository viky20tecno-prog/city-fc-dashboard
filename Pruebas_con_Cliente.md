# Pruebas con Cliente — ClubContable (City FC)

> Sesión de validación funcional completa  
> Jugador de prueba: **Diego Escobar** — Cédula `1032401947`  
> Fecha: _______________  | Asistentes: _______________

---

## Antes de comenzar

- [ ] Datos de prueba reseteados (ejecutar `reset_datos_prueba.sql` en Supabase)
- [ ] Navegador abierto en: **https://city-fc-dashboard-pi.vercel.app**
- [ ] WhatsApp unido al Sandbox de Twilio (`join <palabra>` al número `+14155238886`)
- [ ] Credenciales de acceso disponibles

---

## 1. AUTENTICACIÓN

| # | Qué se prueba | Pasos | Resultado esperado | ✓ |
|---|---|---|---|---|
| A1 | Login correcto | Ir a `/login` → ingresar email y contraseña correctos | Entra al Dashboard | ☐ |
| A2 | Login incorrecto | Ingresar contraseña equivocada | Mensaje de error, no entra | ☐ |
| A3 | Ruta protegida sin sesión | Cerrar sesión → intentar ir a `/` directamente | Redirige al login | ☐ |
| A4 | Acceso público sin login | Ir a `/inscripcion` sin estar logueado | Carga el formulario normalmente | ☐ |
| A5 | Cerrar sesión | Click en botón Cerrar Sesión | Vuelve al login, no puede volver atrás | ☐ |

---

## 2. DASHBOARD — Panel Principal

| # | Qué se prueba | Qué mirar | Resultado esperado | ✓ |
|---|---|---|---|---|
| D1 | Tarjetas de resumen | Las 4 tarjetas superiores | Muestra: total jugadores, recaudación del mes, morosos y pagos pendientes con valores reales | ☐ |
| D2 | Gráfica de recaudación | Sección de gráfica | Barras por mes con montos recaudados | ☐ |
| D3 | Lista de morosos | Sección morosos | Lista de jugadores con saldo pendiente | ☐ |
| D4 | Actualizar datos | Botón de refrescar (si existe) | Datos se recargan sin error | ☐ |

---

## 3. JUGADORES

| # | Qué se prueba | Pasos | Resultado esperado | ✓ |
|---|---|---|---|---|
| J1 | Tabla de jugadores carga | Click en tab **Jugadores** | Lista de jugadores activos con nombre, cédula, estado | ☐ |
| J2 | Búsqueda por nombre | Escribir "Diego" en el buscador | Filtra y muestra solo jugadores que coincidan | ☐ |
| J3 | Búsqueda por cédula | Escribir `1032401947` | Muestra solo Diego Escobar | ☐ |
| J4 | Abrir Estado de Cuenta | Click en Diego Escobar | Modal se abre con datos del jugador | ☐ |
| J5 | Mensualidades en Estado de Cuenta | Ver sección Mensualidades | Muestra cada mes de 2026 con estado PENDIENTE (tras el reset) | ☐ |
| J6 | Uniforme en Estado de Cuenta | Ver sección Uniforme | Muestra sin pedido activo (tras el reset) | ☐ |
| J7 | Torneos en Estado de Cuenta | Ver sección Torneos | Torneos con estado PENDIENTE | ☐ |
| J8 | Historial de transacciones | Ver sección Historial | Vacío (ningún pago aprobado aún) | ☐ |
| J9 | Registrar suspensión | Click en ícono de suspensión → completar formulario | Suspensión guardada, aparece en la lista del jugador | ☐ |

---

## 4. UNIFORMES — Pedidos

| # | Qué se prueba | Pasos | Resultado esperado | ✓ |
|---|---|---|---|---|
| U1 | Buscar jugador para pedido | Tab **Uniformes** → ingresar cédula `1032401947` | Muestra nombre: Diego Escobar | ☐ |
| U2 | Seleccionar prendas | Click en camiseta, pantaloneta y medias | Total se acumula correctamente con cada selección | ☐ |
| U3 | Pedido para familiar | Activar "Para familiar" → seleccionar Hombre | Tipo cambia a Familiar - Hombre | ☐ |
| U4 | Completar y guardar pedido | Llenar talla, número (ej. 10), nombre → Guardar | Pedido aparece en tab **PENDIENTE** con badge "Familiar - Hombre" | ☐ |
| U5 | Número duplicado | Intentar crear otro pedido con número 10 | Sistema bloquea y muestra mensaje de validación | ☐ |
| U6 | Cambiar estado a PAGADO | En tab PENDIENTE → click en badge de estado | Estado cambia a PAGADO | ☐ |
| U7 | Cambiar estado a ENTREGADO | En tab PAGADO → click en botón Entregado | Pedido pasa a tab ENTREGADO | ☐ |
| U8 | Editar pedido | Click en ícono editar | Modal pre-llenado, se puede modificar talla/número/nombre | ☐ |
| U9 | Descargar PDF | Click en botón PDF | Descarga archivo con listado de pedidos | ☐ |

---

## 5. PAGO MANUAL

| # | Qué se prueba | Pasos | Resultado esperado | ✓ |
|---|---|---|---|---|
| PM1 | Buscar jugador | Abrir modal Pago Manual → ingresar cédula `1032401947` | Nombre del jugador aparece | ☐ |
| PM2 | Registrar pago de mensualidad | Concepto: Mensualidad, monto: 65000, banco: Nequi → Registrar | Pago guardado; en Estado de Cuenta la mensualidad más antigua cambia a AL DÍA | ☐ |
| PM3 | Verificar en historial | Abrir Estado de Cuenta de Diego | El pago recién registrado aparece en sección Historial | ☐ |
| PM4 | Registrar pago de uniforme | Nuevo pago, concepto: Uniforme → Registrar | Pago guardado, estado de uniforme actualizado | ☐ |
| PM5 | Registrar pago de torneo | Nuevo pago, concepto: Torneo → Registrar | Pago guardado, torneo actualizado | ☐ |

---

## 6. ARBITRAJE — Pagos a Árbitros

| # | Qué se prueba | Pasos | Resultado esperado | ✓ |
|---|---|---|---|---|
| AR1 | Ver listado de partidos | Tab **Pago Arbitraje** | Lista de partidos con fecha, rival y lugar | ☐ |
| AR2 | Crear partido | Click en Crear Partido → completar: fecha, rival, lugar, categoría → Guardar | Partido nuevo aparece en la lista | ☐ |
| AR3 | Registrar árbitros | Click en el partido → agregar árbitro principal con monto | Árbitro registrado con monto asignado | ☐ |
| AR4 | Marcar árbitro como pagado | Click en árbitro → marcar pagado | Estado cambia a PAGADO | ☐ |
| AR5 | Barra de progreso | Ver partido con árbitros pagados y pendientes | Barra refleja el porcentaje de árbitros pagados | ☐ |

---

## 7. CICLO DE COBRO

| # | Qué se prueba | Qué mirar | Resultado esperado | ✓ |
|---|---|---|---|---|
| CC1 | Timeline visual | Tab **Ciclo de Cobro** | Muestra el calendario de cobro mensual con las fechas clave (días 1-5 al día, 6-7 mora leve, 8+ mora) | ☐ |

---

## 8. CONCILIACIÓN — Pagos por WhatsApp

| # | Qué se prueba | Pasos | Resultado esperado | ✓ |
|---|---|---|---|---|
| C1 | Ver pagos pendientes | Tab **Conciliación** → filtro Pendiente | Lista de pagos recibidos por WhatsApp sin revisar | ☐ |
| C2 | Ver pagos aprobados | Filtro Aprobados | Lista de pagos aprobados anteriormente | ☐ |
| C3 | Ver pagos rechazados | Filtro Rechazados | Lista de pagos rechazados | ☐ |
| C4 | Ver comprobante | Click en miniatura de imagen | Se abre la imagen del comprobante en tamaño completo | ☐ |
| C5 | Editar datos antes de aprobar | Click en ✏ → cambiar monto o banco → Guardar | Los nuevos datos quedan guardados | ☐ |
| C6 | Aprobar pago | Click en ✓ en un pago pendiente | Pago pasa a Aprobados; mensualidad del jugador se actualiza | ☐ |
| C7 | Rechazar pago | Click en ✗ en un pago pendiente | Pago pasa a Rechazados; estado del jugador no cambia | ☐ |
| C8 | Pago aprobado aparece en historial | Abrir Estado de Cuenta del jugador tras aprobar | El pago aprobado aparece en la sección Historial | ☐ |
| C9 | Pago rechazado NO aparece en historial | Abrir Estado de Cuenta del jugador tras rechazar | El pago rechazado NO aparece en historial | ☐ |
| C10 | Total en footer | Ver la suma al pie de la tabla | Suma correcta de montos según el filtro activo | ☐ |

---

## 9. WHATSAPP BOT — Flujo End-to-End

> **Prerequisito:** Enviar el código de activación al número `+14155238886` desde el WhatsApp del jugador.

| # | Qué se prueba | Pasos | Resultado esperado | ✓ |
|---|---|---|---|---|
| WA1 | Mensaje sin imagen | Enviar texto plano (ej. "hola") | Bot responde pidiendo foto del comprobante | ☐ |
| WA2 | Foto sin concepto | Enviar solo la foto del comprobante, sin texto | Bot extrae datos y pide que se indique el concepto | ☐ |
| WA3 | Flujo mensualidad completo | Enviar foto + texto "mensualidad" | Bot confirma recibo; pago aparece en Conciliación como Pendiente | ☐ |
| WA4 | Flujo uniforme completo | Enviar foto + texto "uniforme" | Bot confirma recibo; pago aparece en Conciliación | ☐ |
| WA5 | Número no registrado | Enviar desde número que no está en la BD | Bot responde que no encuentra un jugador con ese número | ☐ |
| WA6 | Imagen ilegible | Enviar imagen borrosa o sin datos claros | Bot pide reenviar con mejor resolución | ☐ |
| WA7 | Comprobante guardado | Revisar el pago en Conciliación | Miniatura del comprobante visible; al hacer click se abre la imagen | ☐ |
| WA8 | Aprobar → mensualidad actualizada | Aprobar el pago del WA3 desde Conciliación | Mensualidad del mes más antiguo pendiente pasa a AL DÍA | ☐ |
| WA9 | Concepto en mensaje separado | (1) Enviar solo la foto → (2) en nuevo mensaje escribir "mensualidad" | Bot no pide reenviar la foto; actualiza el pago con el concepto y envía acuse de recibo | ☐ |
| WA10 | Saldo a favor | Aprobar un pago cuyo monto supere el valor de la mensualidad (ej. pagar 100.000 cuando la mensualidad es 65.000) | Mensualidad queda AL DÍA; jugador recibe WhatsApp preguntando a qué concepto abonar el excedente | ☐ |
| WA11 | Respuesta al saldo a favor | Responder al bot "uniforme" o "mensualidad" | Bot aplica el excedente al concepto elegido y envía confirmación | ☐ |

---

## 10. FORMULARIO DE INSCRIPCIÓN (público)

| # | Qué se prueba | Pasos | Resultado esperado | ✓ |
|---|---|---|---|---|
| I1 | Acceso sin login | Ir a `https://city-fc-dashboard-pi.vercel.app/inscripcion` sin sesión iniciada | Carga el formulario sin pedir login | ☐ |
| I2 | Validación cédula | Ingresar menos de 7 dígitos en cédula | Mensaje de error de validación | ☐ |
| I3 | Validación celular | Ingresar número de 9 dígitos | Mensaje de error de validación | ☐ |
| I4 | Campos obligatorios vacíos | Intentar enviar el formulario incompleto | Sistema bloquea y resalta los campos faltantes | ☐ |
| I5 | Inscripción exitosa | Completar todos los campos correctamente → Enviar | Pantalla de éxito; jugador aparece en la tabla de Jugadores del dashboard | ☐ |

---

## Resumen de resultados

| Módulo | Total casos | Aprobados | Fallidos | Pendientes |
|---|---|---|---|---|
| 1. Autenticación | 5 | | | |
| 2. Dashboard | 4 | | | |
| 3. Jugadores | 9 | | | |
| 4. Uniformes | 9 | | | |
| 5. Pago Manual | 5 | | | |
| 6. Arbitraje | 5 | | | |
| 7. Ciclo de Cobro | 1 | | | |
| 8. Conciliación | 10 | | | |
| 9. WhatsApp Bot | 11 | | | |
| 10. Inscripción | 5 | | | |
| **TOTAL** | **64** | | | |

---

## Bugs / Observaciones encontradas durante las pruebas

| # | Módulo | Descripción | Severidad |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

*Documento generado para sesión de pruebas con cliente — ClubContable v1.0*
