import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CharacterSelect from "@/components/CharacterSelect";
import GameArena from "@/components/GameArena";
import VictoryScreen from "@/components/VictoryScreen";
import AuthForm from "@/components/AuthForm";
import UserProfile from "@/components/UserProfile";

export type Character = {
  id: string;
  name: string;
  color: string;
  emoji: string;
};

export type Player = {
  id: string;
  character: Character;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  isGrounded: boolean;
  controls: {
    left: string;
    right: string;
    jump: string;
    dash: string;
  };
  score: number;
  finished: boolean;
  finishTime?: number;
};

export type GameState = "lobby" | "character-select" | "playing" | "victory";

export type Platform = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const Index = () => {
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [players, setPlayers] = useState<Player[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [currentMap, setCurrentMap] = useState<Platform[]>([]);
  const [maxWinners, setMaxWinners] = useState<number>(1);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const { loading } = useAuth();

  const startGame = () => {
    if (players.length > 0) {
      setGameState("playing");
    }
  };

  const resetGame = () => {
    setGameState("lobby");
    setPlayers([]);
    setWinner(null);
    setCurrentMap([]);
    setMaxWinners(1);
  };

  const playAnotherRound = () => {
    // Reset game state but keep players and their customizations
    const resetPlayers = players.map(player => ({
      ...player,
      position: { x: 100 + players.indexOf(player) * 50, y: 400 },
      velocity: { x: 0, y: 0 },
      isGrounded: false,
      score: 0,
      finished: false,
      finishTime: undefined
    }));
    
    setPlayers(resetPlayers);
    setWinner(null);
    setCurrentMap([]);
    setGameState("character-select");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      {gameState === "lobby" && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="absolute top-4 right-4">
            <UserProfile onAuthClick={() => setShowAuthForm(true)} />
          </div>
          
          <div className="text-center space-y-8 p-8">
            <div className="space-y-4">
              <h1 className="text-8xl font-bold text-white drop-shadow-lg animate-bounce">
                🟡 GOOBERS 🟡
              </h1>
              <p className="text-2xl text-white/90 font-semibold">
                The Ultimate Silly Racing Game!
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => setGameState("character-select")}
                className="bg-white text-purple-600 font-bold text-xl px-8 py-4 rounded-full shadow-lg hover:scale-110 transition-all duration-200 hover:shadow-xl"
              >
                🎮 Start Game
              </button>
              
              <div className="text-white/80 text-sm space-y-2">
                <p>• Up to 4 players can join!</p>
                <p>• Customize names, colors, and emojis!</p>
                <p>• Race on randomly generated maps!</p>
                <p>• Use special dash moves!</p>
                <p>• Don't fall off the platforms!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === "character-select" && (
        <CharacterSelect
          players={players}
          setPlayers={setPlayers}
          maxWinners={maxWinners}
          setMaxWinners={setMaxWinners}
          onStartGame={startGame}
          onBack={() => setGameState("lobby")}
        />
      )}

      {gameState === "playing" && (
        <GameArena
          players={players}
          setPlayers={setPlayers}
          currentMap={currentMap}
          setCurrentMap={setCurrentMap}
          maxWinners={maxWinners}
          onGameEnd={(winningPlayer) => {
            setWinner(winningPlayer);
            setGameState("victory");
          }}
        />
      )}

      {gameState === "victory" && winner && (
        <VictoryScreen
          winner={winner}
          players={players}
          onPlayAgain={resetGame}
          onAnotherRound={playAnotherRound}
        />
      )}

      {showAuthForm && (
        <AuthForm onClose={() => setShowAuthForm(false)} />
      )}
    </div>
  );
};

export default Index;
