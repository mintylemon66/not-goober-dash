
-- Create rooms table for private multiplayer games
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  host_user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 4,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room_players table to track who's in each room
CREATE TABLE public.room_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  username TEXT NOT NULL,
  character_data JSONB,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create personal_bests table for tracking user's best times
CREATE TABLE public.personal_bests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  username TEXT NOT NULL,
  best_time INTEGER NOT NULL,
  character_name TEXT,
  character_emoji TEXT,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Rooms policies
CREATE POLICY "Anyone can view active rooms" 
  ON public.rooms 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Users can create rooms" 
  ON public.rooms 
  FOR INSERT 
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Room hosts can update their rooms" 
  ON public.rooms 
  FOR UPDATE 
  USING (auth.uid() = host_user_id);

-- Enable RLS for room_players
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

-- Room players policies
CREATE POLICY "Anyone can view room players" 
  ON public.room_players 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can join rooms" 
  ON public.room_players 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" 
  ON public.room_players 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable RLS for personal_bests
ALTER TABLE public.personal_bests ENABLE ROW LEVEL SECURITY;

-- Personal bests policies
CREATE POLICY "Users can view all personal bests" 
  ON public.personal_bests 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own personal best" 
  ON public.personal_bests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal best" 
  ON public.personal_bests 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Function to generate unique room codes
CREATE OR REPLACE FUNCTION generate_room_code() 
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update or insert personal best
CREATE OR REPLACE FUNCTION upsert_personal_best(
  p_user_id UUID,
  p_username TEXT,
  p_finish_time INTEGER,
  p_character_name TEXT,
  p_character_emoji TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.personal_bests (user_id, username, best_time, character_name, character_emoji)
  VALUES (p_user_id, p_username, p_finish_time, p_character_name, p_character_emoji)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    best_time = CASE 
      WHEN p_finish_time < personal_bests.best_time THEN p_finish_time 
      ELSE personal_bests.best_time 
    END,
    username = p_username,
    character_name = CASE 
      WHEN p_finish_time < personal_bests.best_time THEN p_character_name 
      ELSE personal_bests.character_name 
    END,
    character_emoji = CASE 
      WHEN p_finish_time < personal_bests.best_time THEN p_character_emoji 
      ELSE personal_bests.character_emoji 
    END,
    achieved_at = CASE 
      WHEN p_finish_time < personal_bests.best_time THEN now() 
      ELSE personal_bests.achieved_at 
    END;
END;
$$ LANGUAGE plpgsql;
