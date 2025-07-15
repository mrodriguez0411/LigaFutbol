-- Crear tabla users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Crear política RLS para permitir a cualquier usuario ver su propio registro
CREATE POLICY "Usuarios pueden ver su propio registro"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Crear política RLS para permitir solo a los administradores ver todos los datos
CREATE POLICY "Administradores pueden ver todos los datos"
  ON users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE
  ));

-- Crear política RLS para permitir solo a los administradores modificar datos
CREATE POLICY "Administradores pueden modificar datos"
  ON users FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE
  ));
