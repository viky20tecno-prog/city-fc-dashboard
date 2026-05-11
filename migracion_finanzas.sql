-- ============================================================
-- Módulo Finanzas: Ingresos, Gastos y Nómina
-- ============================================================

-- Tabla de movimientos financieros (ingresos y gastos)
CREATE TABLE IF NOT EXISTS finanzas (
  id            BIGSERIAL PRIMARY KEY,
  club_id       UUID         NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  tipo          TEXT         NOT NULL CHECK (tipo IN ('ingreso','gasto')),
  categoria     TEXT         NOT NULL,
  descripcion   TEXT         NOT NULL DEFAULT '',
  monto         NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  fecha         DATE         NOT NULL,
  comprobante_url TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finanzas_club_idx  ON finanzas(club_id);
CREATE INDEX IF NOT EXISTS finanzas_fecha_idx ON finanzas(club_id, fecha);

-- Empleados / nómina
CREATE TABLE IF NOT EXISTS nomina_empleados (
  id             BIGSERIAL PRIMARY KEY,
  club_id        UUID         NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  nombre         TEXT         NOT NULL,
  cargo          TEXT         NOT NULL DEFAULT '',
  salario_mensual NUMERIC(12,2) NOT NULL DEFAULT 0,
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nomina_empleados_club_idx ON nomina_empleados(club_id);

-- Historial de pagos de nómina
CREATE TABLE IF NOT EXISTS nomina_pagos (
  id           BIGSERIAL PRIMARY KEY,
  club_id      UUID         NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  empleado_id  BIGINT       NOT NULL REFERENCES nomina_empleados(id) ON DELETE CASCADE,
  mes          TEXT         NOT NULL, -- formato YYYY-MM
  monto        NUMERIC(12,2) NOT NULL,
  fecha_pago   DATE         NOT NULL DEFAULT CURRENT_DATE,
  notas        TEXT         NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (empleado_id, mes)
);

CREATE INDEX IF NOT EXISTS nomina_pagos_club_idx      ON nomina_pagos(club_id);
CREATE INDEX IF NOT EXISTS nomina_pagos_empleado_idx  ON nomina_pagos(empleado_id);

-- RLS
ALTER TABLE finanzas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE nomina_empleados  ENABLE ROW LEVEL SECURITY;
ALTER TABLE nomina_pagos      ENABLE ROW LEVEL SECURITY;

-- Políticas: el service role puede hacer todo (la API usa service role)
CREATE POLICY "service_role_finanzas"
  ON finanzas FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_nomina_empleados"
  ON nomina_empleados FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_nomina_pagos"
  ON nomina_pagos FOR ALL TO service_role USING (true) WITH CHECK (true);
