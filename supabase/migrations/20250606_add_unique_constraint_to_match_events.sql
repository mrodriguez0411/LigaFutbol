-- Add a unique constraint to prevent duplicate events for the same player in a match
ALTER TABLE match_events
ADD CONSTRAINT match_events_player_match_event_unique 
UNIQUE (player_id, match_id, event_type)
WHERE player_id IS NOT NULL;
