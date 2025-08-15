-- Verificar la estructura de la tabla match_events
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'match_events';

-- Verificar las políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'match_events';

-- Verificar si hay triggers que puedan estar afectando
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'match_events';
