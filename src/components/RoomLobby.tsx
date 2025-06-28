import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Room {
  id: string;
  code: string;
  name: string;
  host_user_id: string;
  max_players: number;
  is_active: boolean;
  created_at: string;
}

interface RoomPlayer {
  id: string;
  username: string;
  character_data: any;
  joined_at: string;
}

interface RoomLobbyProps {
  onStartPrivateGame: (roomCode: string) => void;
  onBack: () => void;
}

const RoomLobby = ({ onStartPrivateGame, onBack }: RoomLobbyProps) => {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (currentRoom) {
      fetchRoomPlayers(currentRoom.id);
    }
  }, [currentRoom]);

  // Set up real-time subscriptions when user joins a room
  useEffect(() => {
    if (!currentRoom) return;

    console.log('Setting up real-time subscriptions for room:', currentRoom.id);
    
    // Subscribe to room_players changes
    const playersChannel = supabase
      .channel(`room_players_${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${currentRoom.id}`
        },
        (payload) => {
          console.log('Room players change:', payload);
          // Refetch players when there's any change
          fetchRoomPlayers(currentRoom.id);
        }
      )
      .subscribe();

    // Subscribe to room changes (in case host updates room settings)
    const roomChannel = supabase
      .channel(`room_${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${currentRoom.id}`
        },
        (payload) => {
          console.log('Room change:', payload);
          // Update current room data
          if (payload.new) {
            setCurrentRoom(payload.new as Room);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [currentRoom]);

  const fetchRoomPlayers = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching room players:', error);
        return;
      }

      console.log('Fetched room players:', data);
      setRoomPlayers(data || []);
    } catch (error) {
      console.error('Error fetching room players:', error);
    }
  };

  const createRoom = async () => {
    if (!user || !roomName.trim()) return;

    setLoading(true);
    try {
      // Generate room code
      const { data: codeData, error: codeError } = await supabase.rpc('generate_room_code');
      
      if (codeError) {
        console.error('Error generating room code:', codeError);
        return;
      }

      const generatedCode = codeData;

      // Create room
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          code: generatedCode,
          host_user_id: user.id,
          name: roomName,
          max_players: 4
        })
        .select()
        .single();

      if (roomError) {
        console.error('Error creating room:', roomError);
        return;
      }

      // Join the room as host
      const username = user.user_metadata?.username || user.email || 'Anonymous';
      const { error: joinError } = await supabase
        .from('room_players')
        .insert({
          room_id: roomData.id,
          user_id: user.id,
          username: username
        });

      if (joinError) {
        console.error('Error joining room:', joinError);
        return;
      }

      setCurrentRoom(roomData);
      setRoomCode(generatedCode);
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!user || !roomCode.trim()) return;

    setLoading(true);
    try {
      // Find room by code
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (roomError) {
        console.error('Room not found:', roomError);
        alert('Room not found or inactive!');
        return;
      }

      // Check if user is already in this room
      const { data: existingPlayer, error: existingError } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', roomData.id)
        .eq('user_id', user.id)
        .single();

      if (existingPlayer) {
        // User is already in the room, just set current room
        setCurrentRoom(roomData);
        return;
      }

      // Check if room is full
      const { data: playersData, error: playersError } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', roomData.id);

      if (playersError) {
        console.error('Error checking room capacity:', playersError);
        return;
      }

      if (playersData.length >= roomData.max_players) {
        alert('Room is full!');
        return;
      }

      // Join the room
      const username = user.user_metadata?.username || user.email || 'Anonymous';
      const { error: joinError } = await supabase
        .from('room_players')
        .insert({
          room_id: roomData.id,
          user_id: user.id,
          username: username
        });

      if (joinError) {
        console.error('Error joining room:', joinError);
        return;
      }

      setCurrentRoom(roomData);
    } catch (error) {
      console.error('Error joining room:', error);
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = async () => {
    if (!user || !currentRoom) return;

    try {
      const { error } = await supabase
        .from('room_players')
        .delete()
        .eq('room_id', currentRoom.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving room:', error);
        return;
      }

      setCurrentRoom(null);
      setRoomPlayers([]);
      setMode('select');
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="bg-white/20 backdrop-blur-sm border-white/30">
          <CardContent className="p-8 text-center">
            <p className="text-white text-xl mb-4">Please log in to access multiplayer features!</p>
            <Button onClick={onBack} variant="secondary">
              Back to Main Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="bg-white/20 backdrop-blur-sm border-white/30 w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-white text-2xl text-center">
              Room: {currentRoom.name}
            </CardTitle>
            <p className="text-white/80 text-center text-lg">
              Room Code: <span className="font-bold text-yellow-300">{currentRoom.code}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-white text-xl">Players ({roomPlayers.length}/{currentRoom.max_players})</h3>
              <div className="space-y-2">
                {roomPlayers.map((player, index) => (
                  <div key={player.id} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-white">
                      {index === 0 && '👑'} {player.username}
                    </span>
                    {index === 0 && <span className="text-yellow-300 text-sm">Host</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              {currentRoom.host_user_id === user.id && roomPlayers.length >= 2 && (
                <Button 
                  onClick={() => onStartPrivateGame(currentRoom.code)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 text-lg"
                >
                  🚀 Start Game
                </Button>
              )}
              <Button onClick={leaveRoom} variant="destructive">
                Leave Room
              </Button>
            </div>

            {currentRoom.host_user_id === user.id && roomPlayers.length < 2 && (
              <p className="text-white/70 text-center">
                Waiting for at least 2 players to start the game...
              </p>
            )}
            
            {currentRoom.host_user_id !== user.id && (
              <p className="text-white/70 text-center">
                Waiting for the host to start the game...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="space-y-8 w-full max-w-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Multiplayer</h1>
          <p className="text-white/80">Play with friends online!</p>
        </div>

        {mode === 'select' && (
          <Card className="bg-white/20 backdrop-blur-sm border-white/30">
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => setMode('create')}
                  className="bg-blue-500 hover:bg-blue-600 h-20 text-lg"
                >
                  🏠 Create Private Room
                </Button>
                <Button 
                  onClick={() => setMode('join')}
                  className="bg-green-500 hover:bg-green-600 h-20 text-lg"
                >
                  🚀 Join Room
                </Button>
              </div>
              <Button onClick={onBack} variant="secondary" className="w-full">
                Back to Main Menu
              </Button>
            </CardContent>
          </Card>
        )}

        {mode === 'create' && (
          <Card className="bg-white/20 backdrop-blur-sm border-white/30">
            <CardHeader>
              <CardTitle className="text-white text-xl">Create Private Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-white">Room Name</label>
                <Input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name..."
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                />
              </div>
              <div className="flex gap-4">
                <Button 
                  onClick={createRoom} 
                  disabled={loading || !roomName.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </Button>
                <Button onClick={() => setMode('select')} variant="secondary">
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {mode === 'join' && (
          <Card className="bg-white/20 backdrop-blur-sm border-white/30">
            <CardHeader>
              <CardTitle className="text-white text-xl">Join Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-white">Room Code</label>
                <Input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit room code..."
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  maxLength={6}
                />
              </div>
              <div className="flex gap-4">
                <Button 
                  onClick={joinRoom} 
                  disabled={loading || roomCode.length !== 6}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </Button>
                <Button onClick={() => setMode('select')} variant="secondary">
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RoomLobby;
