-- Primero, eliminar la restricción si existe
ALTER TABLE match_events 
DROP CONSTRAINT IF EXISTS match_events_player_match_event_unique;

-- Luego, crear la restricción con la sintaxis correcta para PostgreSQL
-- Usando un índice único parcial para manejar correctamente los valores NULL
CREATE UNIQUE INDEX IF NOT EXISTS match_events_player_match_event_unique 
ON match_events (player_id, match_id, event_type) 
WHERE player_id IS NOT NULL;
