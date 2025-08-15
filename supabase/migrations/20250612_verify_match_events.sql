-- Verificar la estructura de la tabla match_events
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length,
    udt_name
FROM 
    information_schema.columns 
WHERE 
    table_name = 'match_events'
ORDER BY 
    ordinal_position;

-- Verificar las restricciones
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_type
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.table_name = 'match_events';

-- Verificar las políticas RLS
SELECT 
    * 
FROM 
    pg_policies 
WHERE 
    tablename = 'match_events';
