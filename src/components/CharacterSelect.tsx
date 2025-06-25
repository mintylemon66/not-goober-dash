
import { useState } from "react";
import { Character, Player } from "@/pages/Index";

const CHARACTERS: Character[] = [
  { id: "red", name: "Crimson Goober", color: "bg-red-500", emoji: "😄" },
  { id: "blue", name: "Azure Goober", color: "bg-blue-500", emoji: "😎" },
  { id: "green", name: "Lime Goober", color: "bg-green-500", emoji: "🤪" },
  { id: "yellow", name: "Golden Goober", color: "bg-yellow-500", emoji: "😊" },
];

const CONTROL_SETS = [
  { left: "a", right: "d", jump: "w", dash: "s" },
  { left: "ArrowLeft", right: "ArrowRight", jump: "ArrowUp", dash: "ArrowDown" },
  { left: "j", right: "l", jump: "i", dash: "k" },
  { left: "z", right: "c", jump: "x", dash: "v" },
];

interface CharacterSelectProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  onStartGame: () => void;
  onBack: () => void;
}

const CharacterSelect = ({ players, setPlayers, onStartGame, onBack }: CharacterSelectProps) => {
  const [selectedSlots, setSelectedSlots] = useState<{ [key: number]: string }>({});

  const addPlayer = (slotIndex: number, character: Character) => {
    const playerId = `player-${slotIndex + 1}`;
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
    setSelectedSlots({ ...selectedSlots, [slotIndex]: character.id });
  };

  const removePlayer = (slotIndex: number) => {
    const playerId = `player-${slotIndex + 1}`;
    setPlayers(players.filter(p => p.id !== playerId));
    const newSelectedSlots = { ...selectedSlots };
    delete newSelectedSlots[slotIndex];
    setSelectedSlots(newSelectedSlots);
  };

  const usedCharacterIds = Object.values(selectedSlots);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold text-white mb-4">Choose Your Goobers!</h2>
          <p className="text-white/80 text-lg">Each player picks a character and gets unique controls</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[0, 1, 2, 3].map((slotIndex) => (
            <div key={slotIndex} className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                Player {slotIndex + 1}
              </h3>
              
              <div className="text-center mb-4 text-white/80 text-sm">
                <p>Controls: {CONTROL_SETS[slotIndex].left.toUpperCase()}/{CONTROL_SETS[slotIndex].right.toUpperCase()} = Move</p>
                <p>{CONTROL_SETS[slotIndex].jump.toUpperCase()} = Jump, {CONTROL_SETS[slotIndex].dash.toUpperCase()} = Dash</p>
              </div>

              {selectedSlots[slotIndex] ? (
                <div className="text-center">
                  <div 
                    className={`w-24 h-24 rounded-full ${CHARACTERS.find(c => c.id === selectedSlots[slotIndex])?.color} mx-auto mb-4 flex items-center justify-center text-4xl shadow-lg`}
                  >
                    {CHARACTERS.find(c => c.id === selectedSlots[slotIndex])?.emoji}
                  </div>
                  <p className="text-white font-semibold mb-4">
                    {CHARACTERS.find(c => c.id === selectedSlots[slotIndex])?.name}
                  </p>
                  <button
                    onClick={() => removePlayer(slotIndex)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-full transition-all duration-200"
                  >
                    Remove Player
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {CHARACTERS.map((character) => (
                    <button
                      key={character.id}
                      onClick={() => addPlayer(slotIndex, character)}
                      disabled={usedCharacterIds.includes(character.id)}
                      className={`p-4 rounded-xl transition-all duration-200 ${
                        usedCharacterIds.includes(character.id)
                          ? 'bg-gray-400 cursor-not-allowed opacity-50'
                          : 'bg-white hover:scale-105 hover:shadow-lg'
                      }`}
                    >
                      <div className={`w-16 h-16 rounded-full ${character.color} mx-auto mb-2 flex items-center justify-center text-2xl shadow-md`}>
                        {character.emoji}
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{character.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
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
            Start Race! ({players.length} players)
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelect;
