-- Agrega campos para recuperación de contraseña en admin_users
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS reset_token            TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

-- Índice para lookup rápido por token
CREATE INDEX IF NOT EXISTS idx_admin_users_reset_token ON admin_users(reset_token) WHERE reset_token IS NOT NULL;
