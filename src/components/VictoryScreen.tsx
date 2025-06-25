
import { Player } from "@/pages/Index";

interface VictoryScreenProps {
  winner: Player;
  players: Player[];
  onPlayAgain: () => void;
}

const VictoryScreen = ({ winner, players, onPlayAgain }: VictoryScreenProps) => {
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.finishTime || 0) - (b.finishTime || 0);
    }
    if (a.finished && !b.finished) return -1;
    if (!a.finished && b.finished) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-8 p-8">
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
                Finish Time: {Math.floor(winner.finishTime / 60)} seconds
              </p>
            )}
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 space-y-4">
          <h3 className="text-2xl font-bold text-white mb-4">Final Results</h3>
          {sortedPlayers.map((player, index) => (
            <div 
              key={player.id} 
              className={`flex items-center justify-between p-3 rounded-lg ${
                index === 0 ? 'bg-yellow-500/30' : 'bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white">#{index + 1}</span>
                <div 
                  className={`w-12 h-12 rounded-full ${player.character.color} flex items-center justify-center text-2xl`}
                >
                  {player.character.emoji}
                </div>
                <span className="text-white font-semibold">{player.character.name}</span>
              </div>
              <div className="text-white/80">
                {player.finished ? (
                  <>🏁 {Math.floor((player.finishTime || 0) / 60)}s</>
                ) : (
                  <>❌ Did not finish</>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <button
            onClick={onPlayAgain}
            className="bg-green-500 hover:bg-green-600 text-white font-bold text-xl px-8 py-4 rounded-full shadow-lg hover:scale-110 transition-all duration-200"
          >
            🎮 Play Again!
          </button>
          
          <div className="text-white/60 text-sm">
            <p>🎉 Great race everyone! Ready for another round?</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VictoryScreen;
