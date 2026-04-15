# ClubContable — Roadmap SaaS

> Documento de continuidad. Si se cierra la sesión, compartir este archivo al inicio de la nueva conversación.
> Última actualización: 2026-04-15

---

## CONTEXTO DEL PROYECTO

### Repositorios
- **Frontend:** https://github.com/viky20tecno-prog/city-fc-dashboard
- **Backend:** https://github.com/viky20tecno-prog/city-fc-api-v2
- **Google Sheets (BD actual):** https://docs.google.com/spreadsheets/d/1LuqQipb1_MD7WoVy0064mZ1vwWgWCg9ikBRUN_-F0-A

### Stack actual
- Frontend: **React + Vite** (no Next.js) — desplegado en `city-fc-dashboard-theta.vercel.app`
- Backend: **Express.js** — desplegado en `city-fc-api-v2.vercel.app`
- Base de datos: **Google Sheets** via googleapis
- Deploy: **Vercel** (ambos repos)

### Estructura del backend (city-fc-api-v2)
```
api/
├── index.js              ← servidor Express principal
├── package.json
├── vercel.json
├── routes/
│   ├── config.js
│   ├── debug.js
│   ├── inscripcion.js    ← inscripción pública de jugadores
│   ├── invoices.js
│   ├── payments.js       ← registro de pagos manuales
│   ├── players.js        ← jugadores activos
│   ├── reports.js
│   └── uniforms.js
└── services/
    └── sheets.js         ← cliente Google Sheets (a reemplazar por Supabase)
```

### Estructura del frontend (city-fc-dashboard)
```
src/
├── App.jsx
├── config.js             ← CLUB_ID hardcodeado como 'city-fc'
├── services/
│   ├── api.js            ← llamadas al backend
│   ├── sheets.js
│   └── writeSheets.js
├── pages/
│   ├── Dashboard.jsx     ← 6 tabs: stats, jugadores, uniformes, árbitros, cobros, WhatsApp
│   ├── ArbitrajePagos.jsx
│   └── PedidoUniforme.jsx
├── components/           ← componentes reutilizables
└── hooks/
    └── useSheetData.js   ← hook principal de datos
```

### Hojas en Google Sheets (estructura de datos actual)
- `JUGADORES` — cedula, nombre, apellidos, celular, municipio, activo
- `REGISTRO_PAGOS` — historial de pagos
- `ESTADO_MENSUALIDADES` — club_id, cedula, anio, mes, valor_oficial, valor_pagado, saldo_pendiente, estado (AL_DIA/PENDIENTE/PARCIAL/MORA)
- `ESTADO_UNIFORMES` — pagos de uniformes por jugador
- `ESTADO_TORNEOS` — inscripciones a torneos
- `PEDIDO_UNIFORMES` — pedidos de uniformes
- `SALDOS_A_FAVOR` — saldos a favor
- `PARTIDOS` — partidos registrados
- `ARBITRAJE_PAGOS` — pagos a árbitros
- `PLANTILLAS_CUOTAS` — plantillas

### Problemas críticos identificados
1. **Sin autenticación** — cualquiera puede llamar la API
2. **CORS inconsistente** — players.js tiene `origin: '*'`, index.js restringe al dashboard
3. **club_id hardcodeado** — 'city-fc' en config.js y localStorage
4. **Google Sheets como BD** — límite 300 req/min, sin transacciones, sin rollback
5. **Datos de negocio hardcodeados** — precios ($65.000, $90.000) y torneos fijos en inscripcion.js
6. **Sin logs ni auditoría**

### Lo que ya funciona bien (NO tocar)
- UI con diseño oscuro, 6 tabs, glassmorphism — está bien hecha
- Módulo árbitros: listado de partidos, creación, gestión de pagos
- Sistema de inscripción con generación automática de mensualidades
- Módulo uniformes y torneos
- Reportes con filtros
- 166 commits en frontend — mucha lógica de negocio ya implementada

---

## ROADMAP DE MIGRACIÓN

### FASE 1 — MVP Vendible (3 semanas)

#### Semana 1 — Base de datos real
- [ ] Crear proyecto en Supabase (supabase.com — gratis hasta 500MB)
- [ ] Ejecutar schema SQL en Supabase (ver sección SCHEMA)
- [ ] Crear script de migración Sheets → Supabase
- [ ] Correr migración con datos reales de city-fc
- [ ] Verificar datos migrados

#### Semana 2 — Autenticación
- [ ] Crear `api/middleware/auth.js` en el backend
- [ ] Aplicar middleware a todas las rutas (excepto /api/inscripcion y /api/health)
- [ ] Reemplazar `api/services/sheets.js` por `api/services/db.js` (Supabase)
- [ ] Actualizar routes uno por uno para usar db.js en vez de sheets.js
- [ ] Página Login.jsx en el frontend
- [ ] Modificar `src/services/api.js` para enviar Bearer token en cada request
- [ ] Proteger rutas con guard de autenticación

#### Semana 3 — Cobros y multi-club
- [ ] Crear cuenta Stripe
- [ ] Agregar Stripe Checkout al frontend (planes básico/pro/premium)
- [ ] Webhook de Stripe en `/api/webhooks/stripe`
- [ ] Onboarding: formulario de creación de club al registrarse
- [ ] Eliminar CLUB_ID hardcodeado — leerlo desde sesión del usuario
- [ ] Primer cliente pagando ← META

---

### FASE 2 — Escalamiento (mes 2-3)
- [ ] Integración GoHighLevel (webhook GHL → crear cuenta trial)
- [ ] Automatizaciones onboarding en GHL (secuencia día 0, 1, 7, 12, 14)
- [ ] Reportes PDF descargables (react-pdf)
- [ ] Dashboard con gráficas mejoradas (Recharts ya instalado)
- [ ] Sistema de roles (owner, admin, treasurer, viewer)
- [ ] Invitación de usuarios al club
- [ ] Logs de auditoría
- [ ] PWA (app instalable en celular)

---

### FASE 3 — Crecimiento (mes 4+)
- [ ] Módulo de torneos avanzado
- [ ] Control de inventario completo
- [ ] Integración bancaria (Belvo API Colombia)
- [ ] API pública para integraciones
- [ ] Programa de afiliados
- [ ] App móvil nativa (React Native)

---

## SCHEMA SQL (Supabase)

```sql
-- Ejecutar en Supabase SQL Editor

CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  country TEXT DEFAULT 'CO',
  city TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'trial', 'basic', 'pro', 'premium')),
  plan_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'treasurer', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  cedula TEXT NOT NULL,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  celular TEXT,
  municipio TEXT,
  contacto_emergencia TEXT,
  activo BOOLEAN DEFAULT true,
  fecha_inscripcion DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, cedula)
);

CREATE TABLE mensualidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  cedula TEXT NOT NULL,
  anio INT NOT NULL,
  mes TEXT NOT NULL,
  numero_mes INT NOT NULL,
  valor_oficial DECIMAL(10,2) NOT NULL DEFAULT 65000,
  valor_pagado DECIMAL(10,2) DEFAULT 0,
  saldo_pendiente DECIMAL(10,2),
  estado TEXT CHECK (estado IN ('AL_DIA', 'PENDIENTE', 'PARCIAL', 'MORA')) DEFAULT 'PENDIENTE',
  fecha_ultima_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE uniformes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  cedula TEXT NOT NULL,
  valor_oficial DECIMAL(10,2) DEFAULT 90000,
  valor_pagado DECIMAL(10,2) DEFAULT 0,
  saldo_pendiente DECIMAL(10,2),
  estado TEXT DEFAULT 'PENDIENTE',
  fecha_ultima_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE torneos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  cedula TEXT NOT NULL,
  nombre_torneo TEXT NOT NULL,
  valor_oficial DECIMAL(10,2) NOT NULL,
  valor_pagado DECIMAL(10,2) DEFAULT 0,
  saldo_pendiente DECIMAL(10,2),
  estado TEXT DEFAULT 'PENDIENTE',
  fecha_ultima_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  cedula TEXT,
  monto DECIMAL(10,2) NOT NULL,
  banco TEXT,
  concepto TEXT CHECK (concepto IN ('mensualidad', 'uniforme', 'torneo', 'arbitraje', 'otro')),
  referencia TEXT,
  revisado BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE partidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  rival TEXT,
  lugar TEXT,
  categoria TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE arbitraje_pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  partido_id UUID REFERENCES partidos(id),
  arbitro_nombre TEXT NOT NULL,
  arbitro_cedula TEXT,
  monto DECIMAL(10,2) NOT NULL,
  estado TEXT DEFAULT 'PENDIENTE',
  fecha_pago DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensualidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE uniformes ENABLE ROW LEVEL SECURITY;
ALTER TABLE torneos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitraje_pagos ENABLE ROW LEVEL SECURITY;

-- Función helper
CREATE OR REPLACE FUNCTION get_user_club_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY(
    SELECT club_id FROM club_members 
    WHERE user_id = auth.uid() AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Políticas RLS (aplicar a cada tabla)
CREATE POLICY "club_members_access" ON players
  FOR ALL USING (club_id = ANY(get_user_club_ids()));

CREATE POLICY "club_members_access" ON mensualidades
  FOR ALL USING (club_id = ANY(get_user_club_ids()));

CREATE POLICY "club_members_access" ON pagos
  FOR ALL USING (club_id = ANY(get_user_club_ids()));

CREATE POLICY "club_members_access" ON partidos
  FOR ALL USING (club_id = ANY(get_user_club_ids()));

CREATE POLICY "club_members_access" ON arbitraje_pagos
  FOR ALL USING (club_id = ANY(get_user_club_ids()));
```

---

## PLANES Y PRECIOS

| Plan | Precio COP/mes | Precio USD/mes | Límites |
|---|---|---|---|
| Free | Gratis | - | 100 transacciones/mes, 2 usuarios |
| Básico | $29.900 | $9 | Ilimitado, 5 usuarios, PDF |
| Pro | $59.900 | $19 | Ilimitado, 15 usuarios, API, multi-torneo |
| Premium | $99.900 | $29 | Todo ilimitado, soporte WhatsApp |

---

## ESTADO ACTUAL DE TAREAS

### Completado
- [x] Análisis completo del código real
- [x] Identificación de problemas críticos
- [x] Schema SQL definido
- [x] Código de auth middleware listo
- [x] Código de db.js (reemplazo de sheets.js) listo
- [x] Código de webhook Stripe listo
- [x] Código de webhook GHL listo
- [x] Planes y precios definidos
- [x] Estrategia primeros 50 clientes definida

### Pendiente — Próxima sesión
- [ ] **SIGUIENTE PASO:** Crear proyecto en Supabase + ejecutar schema
- [ ] Script de migración de Sheets a Supabase
- [ ] Crear middleware/auth.js en el backend
- [ ] Reemplazar sheets.js por db.js en el backend
- [ ] Página de Login en el frontend

---

## NOTAS IMPORTANTES

- El frontend usa **Vite**, no webpack — los imports de env son `import.meta.env.VITE_*`
- El backend corre Express como serverless en Vercel via `api/index.js`
- La inscripción de jugadores es **pública** (sin auth) — diseño intencional para que jugadores se inscriban solos
- Los precios están hardcodeados en `api/routes/inscripcion.js` — mover a tabla `club_config` en Supabase
- El diseño visual del frontend está bien — NO refactorizar UI, solo cambiar la capa de datos

---

## CÓMO CONTINUAR EN NUEVA SESIÓN

Pegar esto al inicio de la sesión:
```
Continúa el proyecto ClubContable. Lee el archivo ROADMAP.md para contexto completo.
Stack: React+Vite (frontend) + Express.js (backend) + migrando de Google Sheets a Supabase.
Repos: github.com/viky20tecno-prog/city-fc-dashboard y city-fc-api-v2
Siguiente tarea: [INDICAR TAREA DEL CHECKLIST]
```
