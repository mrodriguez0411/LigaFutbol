-- Eliminar la columna 'number' de la tabla 'players' si existe
ALTER TABLE players 
DROP COLUMN IF EXISTS number;
