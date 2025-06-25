import { useEffect, useRef, useState } from "react";
import { Player } from "@/pages/Index";

interface GameArenaProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  onGameEnd: (winner: Player) => void;
}

const GRAVITY = 0.8;
const GROUND_Y = 500;
const PLATFORM_HEIGHT = 20;
const FINISH_LINE_X = 1400;

// Simple obstacle course layout
const PLATFORMS = [
  { x: 0, y: GROUND_Y, width: 800, height: PLATFORM_HEIGHT }, // Starting platform
  { x: 900, y: 450, width: 200, height: PLATFORM_HEIGHT }, // Jump platform
  { x: 1200, y: 400, width: 200, height: PLATFORM_HEIGHT }, // Higher platform
  { x: 1500, y: GROUND_Y, width: 300, height: PLATFORM_HEIGHT }, // Finish platform
];

const GameArena = ({ players, setPlayers, onGameEnd }: GameArenaProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysPressed = useRef<Set<string>>(new Set());
  const [gameTime, setGameTime] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const checkCollision = (player: Player, platforms: typeof PLATFORMS) => {
    const playerRect = {
      x: player.position.x,
      y: player.position.y,
      width: 30,
      height: 30
    };

    for (const platform of platforms) {
      if (
        playerRect.x < platform.x + platform.width &&
        playerRect.x + playerRect.width > platform.x &&
        playerRect.y < platform.y + platform.height &&
        playerRect.y + playerRect.height > platform.y
      ) {
        // Landing on top of platform
        if (player.velocity.y > 0 && playerRect.y < platform.y) {
          return { collision: true, platform, side: 'top' };
        }
      }
    }
    return { collision: false, platform: null, side: null };
  };

  const updateGame = () => {
    const updatedPlayers = players.map(player => {
      if (player.finished) return player;

      const newPlayer = { ...player };
      
      // Handle input
      const keys = keysPressed.current;
      let moveSpeed = 5;
      
      if (keys.has(player.controls.left.toLowerCase())) {
        newPlayer.velocity.x = -moveSpeed;
      } else if (keys.has(player.controls.right.toLowerCase())) {
        newPlayer.velocity.x = moveSpeed;
      } else {
        newPlayer.velocity.x *= 0.8; // Friction
      }

      if (keys.has(player.controls.jump.toLowerCase()) && newPlayer.isGrounded) {
        newPlayer.velocity.y = -15;
        newPlayer.isGrounded = false;
      }

      if (keys.has(player.controls.dash.toLowerCase())) {
        if (newPlayer.velocity.x > 0) newPlayer.velocity.x = Math.min(newPlayer.velocity.x + 3, 12);
        if (newPlayer.velocity.x < 0) newPlayer.velocity.x = Math.max(newPlayer.velocity.x - 3, -12);
      }

      // Apply gravity
      if (!newPlayer.isGrounded) {
        newPlayer.velocity.y += GRAVITY;
      }

      // Update position
      newPlayer.position.x += newPlayer.velocity.x;
      newPlayer.position.y += newPlayer.velocity.y;

      // Check platform collisions
      const collision = checkCollision(newPlayer, PLATFORMS);
      if (collision.collision && collision.side === 'top') {
        newPlayer.position.y = collision.platform!.y - 30;
        newPlayer.velocity.y = 0;
        newPlayer.isGrounded = true;
      } else {
        newPlayer.isGrounded = false;
      }

      // Reset if fallen off screen
      if (newPlayer.position.y > 600) {
        newPlayer.position = { x: 100, y: 400 };
        newPlayer.velocity = { x: 0, y: 0 };
      }

      // Check finish line
      if (newPlayer.position.x >= FINISH_LINE_X && !newPlayer.finished) {
        newPlayer.finished = true;
        newPlayer.finishTime = gameTime;
      }

      return newPlayer;
    });

    // Check for winner (first to finish)
    const winner = updatedPlayers.find(p => p.finished);
    if (winner && !players.some(p => p.finished)) {
      setTimeout(() => onGameEnd(winner), 1000);
    }

    setPlayers(updatedPlayers);
    setGameTime(time => time + 1);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw platforms
    ctx.fillStyle = '#654321';
    PLATFORMS.forEach(platform => {
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Draw finish line
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(FINISH_LINE_X, 0);
    ctx.lineTo(FINISH_LINE_X, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw players
    players.forEach(player => {
      // Player body
      ctx.fillStyle = player.character.color.replace('bg-', '#').replace('-500', '');
      const colorMap: { [key: string]: string } = {
        'red': '#ef4444',
        'blue': '#3b82f6', 
        'green': '#22c55e',
        'yellow': '#eab308'
      };
      ctx.fillStyle = colorMap[player.character.id] || '#ef4444';
      
      ctx.beginPath();
      ctx.arc(player.position.x + 15, player.position.y + 15, 15, 0, Math.PI * 2);
      ctx.fill();

      // Player emoji face
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.character.emoji, player.position.x + 15, player.position.y + 22);

      // Player name
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(player.character.name, player.position.x + 15, player.position.y - 5);

      // Finished indicator
      if (player.finished) {
        ctx.fillStyle = 'gold';
        ctx.font = '16px Arial';
        ctx.fillText('🏆', player.position.x + 15, player.position.y - 20);
      }
    });
  };

  useEffect(() => {
    const gameLoop = () => {
      updateGame();
      draw();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [players]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 p-4">
      <div className="max-w-full mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center text-white">
            <h2 className="text-2xl font-bold">🏁 Goober Race!</h2>
            <div className="text-lg">Time: {Math.floor(gameTime / 60)}s</div>
          </div>
          <div className="flex gap-4 mt-2">
            {players.map(player => (
              <div key={player.id} className="text-white text-sm">
                {player.character.emoji} {player.character.name}
                {player.finished && <span className="text-yellow-300"> - Finished! 🏆</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-2 shadow-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={1800}
            height={600}
            className="border-2 border-gray-300 w-full max-w-full"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <div className="mt-4 text-center text-white/80 text-sm">
          <p>🎮 Use your assigned keys to move, jump, and dash! Race to the golden finish line!</p>
        </div>
      </div>
    </div>
  );
};

export default GameArena;
