
import { useEffect } from "react";
import { Player } from "@/pages/Index";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Leaderboard from "./Leaderboard";

interface VictoryScreenProps {
  winner: Player;
  players: Player[];
  onPlayAgain: () => void;
  onAnotherRound: () => void;
}

const VictoryScreen = ({ winner, players, onPlayAgain, onAnotherRound }: VictoryScreenProps) => {
  const { user } = useAuth();

  const sortedPlayers = [...players].sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.finishTime || 0) - (b.finishTime || 0);
    }
    if (a.finished && !b.finished) return -1;
    if (!a.finished && b.finished) return 1;
    return 0;
  });

  // Save race results to database
  useEffect(() => {
    const saveRaceResults = async () => {
      if (!user) return;

      const finishedPlayers = sortedPlayers.filter(player => player.finished && player.finishTime);
      
      for (const player of finishedPlayers) {
        try {
          // Get username from user metadata or profiles table
          let username = user.user_metadata?.username || user.email || 'Anonymous';
          
          if (user.user_metadata?.username) {
            username = user.user_metadata.username;
          } else {
            // Try to get username from profiles table
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', user.id)
              .single();
            
            if (profile?.username) {
              username = profile.username;
            }
          }

          // Only save the current user's result
          if (player.id === 'player-1') { // Assuming the current user is always player-1
            // Save to race_results table
            const { error: raceError } = await supabase
              .from('race_results')
              .insert({
                user_id: user.id,
                username: username,
                finish_time: player.finishTime,
                character_name: player.character.name,
                character_emoji: player.character.emoji
              });
            
            if (raceError) {
              console.error('Error saving race result:', raceError);
            }

            // Save/update personal best
            const { error: personalBestError } = await supabase.rpc('upsert_personal_best', {
              p_user_id: user.id,
              p_username: username,
              p_finish_time: player.finishTime,
              p_character_name: player.character.name,
              p_character_emoji: player.character.emoji
            });
            
            if (personalBestError) {
              console.error('Error saving personal best:', personalBestError);
            }
          }
        } catch (error) {
          console.error('Error saving race result:', error);
        }
      }
    };

    saveRaceResults();
  }, [user, sortedPlayers]);

  // Prepare current race results for leaderboard
  const currentRaceResults = sortedPlayers
    .filter(player => player.finished && player.finishTime)
    .map(player => ({
      username: player.character.name,
      finishTime: player.finishTime || 0,
      characterName: player.character.name,
      characterEmoji: player.character.emoji
    }));

  const formatTime = (timeInMs: number) => {
    const timeInSeconds = timeInMs / 1000;
    return timeInSeconds.toFixed(4);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-8 w-full max-w-6xl">
        <div className="space-y-4">
          <div className="text-8xl animate-bounce">🏆</div>
          <h1 className="text-6xl font-bold text-white drop-shadow-lg">
            Victory!
          </h1>
          <div className="space-y-2">
            <div 
              className={`w-32 h-32 rounded-full ${winner.character.color} mx-auto flex items-center justify-center text-6xl shadow-2xl animate-pulse`}
            >
              {winner.character.emoji}
            </div>
            <p className="text-3xl text-white font-bold">
              {winner.character.name} Wins!
            </p>
            {winner.finishTime && (
              <p className="text-xl text-white/80">
                Finish Time: {formatTime(winner.finishTime)}s
              </p>
            )}
          </div>
        </div>

        {/* Leaderboard Section */}
        <Leaderboard currentRaceResults={currentRaceResults} />

        <div className="space-y-4">
          <div className="flex gap-4 justify-center">
            <button
              onClick={onAnotherRound}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl px-8 py-4 rounded-full shadow-lg hover:scale-110 transition-all duration-200"
            >
              🎮 Another Round!
            </button>
            <button
              onClick={onPlayAgain}
              className="bg-green-500 hover:bg-green-600 text-white font-bold text-xl px-8 py-4 rounded-full shadow-lg hover:scale-110 transition-all duration-200"
            >
              🎯 New Game
            </button>
          </div>
          
          <div className="text-white/60 text-sm space-y-1">
            <p>🎉 Great race everyone!</p>
            <p>🔄 "Another Round!" keeps your characters</p>
            <p>🆕 "New Game" starts fresh from the lobby</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VictoryScreen;
