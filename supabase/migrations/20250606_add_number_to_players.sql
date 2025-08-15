-- Add number column to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS number INTEGER CHECK (number > 0 AND number < 1000);

-- Add comment for documentation
COMMENT ON COLUMN players.number IS 'Player''s jersey number (1-999)';
