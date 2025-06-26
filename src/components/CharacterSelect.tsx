import { useState } from "react";
import { Character, Player } from "@/pages/Index";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", 
  "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4",
  "#f59e0b", "#10b981", "#6366f1", "#f43f5e"
];

const DEFAULT_EMOJIS = [
  "😄", "😎", "🤪", "😊", "🥳", "😈", "🤠", "🥸",
  "🤓", "😋", "🤨", "😏", "🙃", "😇", "🤗", "🥰"
];

const CONTROL_SETS = [
  { left: "q", right: "e", jump: "w", dash: "2" },
  { left: "v", right: "n", jump: "b", dash: "g" },
  { left: ",", right: "/", jump: ".", dash: "l" },
  { left: "[", right: "]", jump: "\\", dash: "=" },
];

interface CharacterSelectProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  maxWinners: number;
  setMaxWinners: (maxWinners: number) => void;
  onStartGame: () => void;
  onBack: () => void;
}

interface PlayerCustomization {
  name: string;
  color: string;
  emoji: string;
}

const CharacterSelect = ({ players, setPlayers, maxWinners, setMaxWinners, onStartGame, onBack }: CharacterSelectProps) => {
  const [playerCustomizations, setPlayerCustomizations] = useState<{
    [key: number]: PlayerCustomization
  }>({});

  const updateCustomization = (slotIndex: number, field: keyof PlayerCustomization, value: string) => {
    setPlayerCustomizations(prev => ({
      ...prev,
      [slotIndex]: {
        name: prev[slotIndex]?.name || "",
        color: prev[slotIndex]?.color || DEFAULT_COLORS[slotIndex],
        emoji: prev[slotIndex]?.emoji || DEFAULT_EMOJIS[slotIndex],
        ...prev[slotIndex],
        [field]: value
      }
    }));
  };

  const addPlayer = (slotIndex: number) => {
    const customization = playerCustomizations[slotIndex];
    if (!customization?.name?.trim()) return;

    const playerId = `player-${slotIndex + 1}`;
    const character: Character = {
      id: playerId,
      name: customization.name.trim(),
      color: customization.color || DEFAULT_COLORS[slotIndex],
      emoji: customization.emoji || DEFAULT_EMOJIS[slotIndex]
    };

    const newPlayer: Player = {
      id: playerId,
      character,
      position: { x: 100 + slotIndex * 50, y: 400 },
      velocity: { x: 0, y: 0 },
      isGrounded: false,
      controls: CONTROL_SETS[slotIndex],
      score: 0,
      finished: false,
    };

    const updatedPlayers = [...players];
    const existingIndex = updatedPlayers.findIndex(p => p.id === playerId);
    
    if (existingIndex >= 0) {
      updatedPlayers[existingIndex] = newPlayer;
    } else {
      updatedPlayers.push(newPlayer);
    }
    
    setPlayers(updatedPlayers);
  };

  const removePlayer = (slotIndex: number) => {
    const playerId = `player-${slotIndex + 1}`;
    setPlayers(players.filter(p => p.id !== playerId));
    
    // Clear customization
    const newCustomizations = { ...playerCustomizations };
    delete newCustomizations[slotIndex];
    setPlayerCustomizations(newCustomizations);
  };

  const getPlayerForSlot = (slotIndex: number) => {
    return players.find(p => p.id === `player-${slotIndex + 1}`);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold text-white mb-4">Customize Your Goobers!</h2>
          <p className="text-white/80 text-lg">Create unique characters with custom names, colors, and emojis</p>
        </div>

        {/* Winner Selection Section */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <h3 className="text-2xl font-bold text-white mb-4 text-center">🏆 Race Settings</h3>
          <div className="flex items-center justify-center gap-4">
            <Label className="text-white text-lg">Number of Winners:</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setMaxWinners(num)}
                  disabled={num > players.length && players.length > 0}
                  className={`w-12 h-12 rounded-full font-bold text-lg transition-all duration-200 ${
                    maxWinners === num
                      ? 'bg-yellow-500 text-white scale-110 shadow-lg'
                      : num > players.length && players.length > 0
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-white/30 text-white hover:bg-white/40 hover:scale-105'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          <p className="text-white/70 text-sm text-center mt-2">
            Game ends when {maxWinners} player{maxWinners > 1 ? 's' : ''} reach{maxWinners === 1 ? 'es' : ''} the finish line
          </p>
        </div>

        {/* Player Customization Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[0, 1, 2, 3].map((slotIndex) => {
            const existingPlayer = getPlayerForSlot(slotIndex);
            const customization = playerCustomizations[slotIndex];
            
            return (
              <div key={slotIndex} className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-white mb-4 text-center">
                  Player {slotIndex + 1}
                </h3>
                
                <div className="text-center mb-4 text-white/80 text-sm">
                  <p>Controls: {CONTROL_SETS[slotIndex].left.toUpperCase()}/{CONTROL_SETS[slotIndex].right.toUpperCase()} = Move</p>
                  <p>{CONTROL_SETS[slotIndex].jump.toUpperCase()} = Jump, {CONTROL_SETS[slotIndex].dash.toUpperCase()} = Dash</p>
                </div>

                {existingPlayer ? (
                  <div className="text-center">
                    <div 
                      className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-lg"
                      style={{ backgroundColor: existingPlayer.character.color }}
                    >
                      {existingPlayer.character.emoji}
                    </div>
                    <p className="text-white font-semibold mb-4">
                      {existingPlayer.character.name}
                    </p>
                    <button
                      onClick={() => removePlayer(slotIndex)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-full transition-all duration-200"
                    >
                      Remove Player
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`name-${slotIndex}`} className="text-white">Name</Label>
                      <Input
                        id={`name-${slotIndex}`}
                        placeholder="Enter player name"
                        value={customization?.name || ''}
                        onChange={(e) => updateCustomization(slotIndex, 'name', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-white">Color</Label>
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {DEFAULT_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => updateCustomization(slotIndex, 'color', color)}
                            className={`w-8 h-8 rounded-full transition-all duration-200 ${
                              (customization?.color || DEFAULT_COLORS[slotIndex]) === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-white">Emoji</Label>
                      <div className="grid grid-cols-8 gap-2 mt-2">
                        {DEFAULT_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => updateCustomization(slotIndex, 'emoji', emoji)}
                            className={`w-8 h-8 text-lg transition-all duration-200 ${
                              (customization?.emoji || DEFAULT_EMOJIS[slotIndex]) === emoji ? 'bg-white/20 rounded scale-110' : 'hover:bg-white/10 rounded hover:scale-105'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div 
                        className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl shadow-lg"
                        style={{ backgroundColor: customization?.color || DEFAULT_COLORS[slotIndex] }}
                      >
                        {customization?.emoji || DEFAULT_EMOJIS[slotIndex]}
                      </div>
                      <button
                        onClick={() => addPlayer(slotIndex)}
                        disabled={!customization?.name?.trim()}
                        className={`font-bold px-4 py-2 rounded-full transition-all duration-200 ${
                          customization?.name?.trim()
                            ? 'bg-green-500 hover:bg-green-600 text-white hover:scale-105'
                            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        Add Player
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center space-x-4">
          <button
            onClick={onBack}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-6 py-3 rounded-full transition-all duration-200"
          >
            ← Back
          </button>
          <button
            onClick={onStartGame}
            disabled={players.length === 0}
            className={`font-bold px-8 py-3 rounded-full transition-all duration-200 ${
              players.length > 0
                ? 'bg-green-500 hover:bg-green-600 text-white hover:scale-105'
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
          >
            Start Race! ({players.length} players, {maxWinners} winner{maxWinners > 1 ? 's' : ''})
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelect;
