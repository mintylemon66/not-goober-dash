
import { useState } from "react";
import CharacterSelect from "@/components/CharacterSelect";
import GameArena from "@/components/GameArena";
import VictoryScreen from "@/components/VictoryScreen";

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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      {gameState === "lobby" && (
        <div className="min-h-screen flex items-center justify-center">
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
        />
      )}
    </div>
  );
};

export default Index;
