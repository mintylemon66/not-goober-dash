
-- Enable real-time updates for the rooms and room_players tables
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_players REPLICA IDENTITY FULL;

-- Add the tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
