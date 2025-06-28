
import { useEffect, useRef, useState } from "react";
import { Player, Platform } from "@/pages/Index";

interface GameArenaProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  currentMap: Platform[];
  setCurrentMap: (map: Platform[]) => void;
  maxWinners: number;
  onGameEnd: (winner: Player) => void;
}

const GRAVITY = 0.8;
const GROUND_Y = 500;
const PLATFORM_HEIGHT = 20;
const THICK_PLATFORM_HEIGHT = 60;
const FINISH_LINE_X = 1400;

type Spike = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DeathParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
};

// Sound effects using Web Audio API
const createAudioContext = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playJumpSound = () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const playDashSound = () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  };

  const playDeathSound = () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const playFinishSound = () => {
    const playNote = (freq: number, delay: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + delay);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + delay + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + 0.3);
      
      oscillator.start(audioContext.currentTime + delay);
      oscillator.stop(audioContext.currentTime + delay + 0.3);
    };
    
    // Play a cheerful melody
    playNote(523, 0);    // C
    playNote(659, 0.15); // E
    playNote(784, 0.3);  // G
    playNote(1047, 0.45); // C
  };

  return { playJumpSound, playDashSound, playDeathSound, playFinishSound };
};

// Enhanced map generation with thick platforms and spikes
const generateRandomMap = (): { platforms: Platform[], spikes: Spike[] } => {
  const maps = [
    // Map 1: Classic jumps with thick platforms
    {
      platforms: [
        { x: 0, y: GROUND_Y, width: 800, height: PLATFORM_HEIGHT },
        { x: 900, y: 450, width: 200, height: THICK_PLATFORM_HEIGHT },
        { x: 1200, y: 400, width: 200, height: PLATFORM_HEIGHT },
        { x: 1500, y: GROUND_Y, width: 300, height: PLATFORM_HEIGHT },
      ],
      spikes: [
        { x: 850, y: GROUND_Y - 30, width: 30, height: 30 },
        { x: 1150, y: 450 - 30, width: 30, height: 30 },
      ]
    },
    // Map 2: Staircase with dangers
    {
      platforms: [
        { x: 0, y: GROUND_Y, width: 400, height: PLATFORM_HEIGHT },
        { x: 500, y: 460, width: 200, height: THICK_PLATFORM_HEIGHT },
        { x: 750, y: 420, width: 200, height: PLATFORM_HEIGHT },
        { x: 1000, y: 380, width: 200, height: THICK_PLATFORM_HEIGHT },
        { x: 1250, y: 440, width: 200, height: PLATFORM_HEIGHT },
        { x: 1500, y: GROUND_Y, width: 300, height: PLATFORM_HEIGHT },
      ],
      spikes: [
        { x: 450, y: GROUND_Y - 30, width: 30, height: 30 },
        { x: 720, y: 460 - 30, width: 30, height: 30 },
        { x: 970, y: 420 - 30, width: 30, height: 30 },
      ]
    },
    // Map 3: Valley of death
    {
      platforms: [
        { x: 0, y: GROUND_Y, width: 300, height: PLATFORM_HEIGHT },
        { x: 400, y: 350, width: 150, height: THICK_PLATFORM_HEIGHT },
        { x: 650, y: 300, width: 100, height: PLATFORM_HEIGHT },
        { x: 850, y: 350, width: 150, height: THICK_PLATFORM_HEIGHT },
        { x: 1100, y: 450, width: 200, height: PLATFORM_HEIGHT },
        { x: 1400, y: GROUND_Y, width: 400, height: PLATFORM_HEIGHT },
      ],
      spikes: [
        { x: 350, y: GROUND_Y - 30, width: 30, height: 30 },
        { x: 570, y: 350 - 30, width: 30, height: 30 },
        { x: 770, y: 300 - 30, width: 30, height: 30 },
        { x: 1050, y: 350 - 30, width: 30, height: 30 },
      ]
    },
    // Map 4: Islands with thick platforms
    {
      platforms: [
        { x: 0, y: GROUND_Y, width: 250, height: PLATFORM_HEIGHT },
        { x: 350, y: 400, width: 100, height: THICK_PLATFORM_HEIGHT },
        { x: 550, y: 350, width: 150, height: PLATFORM_HEIGHT },
        { x: 800, y: 420, width: 120, height: THICK_PLATFORM_HEIGHT },
        { x: 1050, y: 380, width: 100, height: PLATFORM_HEIGHT },
        { x: 1250, y: 450, width: 150, height: THICK_PLATFORM_HEIGHT },
        { x: 1500, y: GROUND_Y, width: 300, height: PLATFORM_HEIGHT },
      ],
      spikes: [
        { x: 300, y: GROUND_Y - 30, width: 30, height: 30 },
        { x: 720, y: 350 - 30, width: 30, height: 30 },
        { x: 1020, y: 420 - 30, width: 30, height: 30 },
      ]
    }
  ];
  
  return maps[Math.floor(Math.random() * maps.length)];
};

const GameArena = ({ players, setPlayers, currentMap, setCurrentMap, maxWinners, onGameEnd }: GameArenaProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysPressed = useRef<Set<string>>(new Set());
  const audioRef = useRef<ReturnType<typeof createAudioContext> | null>(null);
  const lastJumpRef = useRef<{[key: string]: number}>({});
  const lastDashRef = useRef<{[key: string]: number}>({});
  const gameEndTriggeredRef = useRef<boolean>(false);
  const gameStartTimeRef = useRef<number>(Date.now());
  
  const [gameTime, setGameTime] = useState(0);
  const [currentSpikes, setCurrentSpikes] = useState<Spike[]>([]);
  const [deathParticles, setDeathParticles] = useState<DeathParticle[]>([]);
  const [finishLineParticles, setFinishLineParticles] = useState<{x: number, y: number, vy: number, life: number}[]>([]);

  // Initialize game start time
  useEffect(() => {
    gameStartTimeRef.current = Date.now();
  }, []);

  // Initialize audio on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioRef.current) {
        audioRef.current = createAudioContext();
      }
    };
    
    const handleClick = () => {
      initAudio();
      document.removeEventListener('click', handleClick);
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Generate random map with spikes on component mount
  useEffect(() => {
    if (currentMap.length === 0) {
      const mapData = generateRandomMap();
      setCurrentMap(mapData.platforms);
      setCurrentSpikes(mapData.spikes);
    }
  }, [currentMap, setCurrentMap]);

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

  const checkCollision = (player: Player, platforms: Platform[]) => {
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
        // Side collision for thick platforms
        if (platform.height >= THICK_PLATFORM_HEIGHT) {
          if (playerRect.x + playerRect.width > platform.x && playerRect.x < platform.x + 10 && player.velocity.x > 0) {
            return { collision: true, platform, side: 'left' };
          }
          if (playerRect.x < platform.x + platform.width && playerRect.x + playerRect.width > platform.x + platform.width - 10 && player.velocity.x < 0) {
            return { collision: true, platform, side: 'right' };
          }
        }
      }
    }
    return { collision: false, platform: null, side: null };
  };

  const checkSpikeCollision = (player: Player, spikes: Spike[]) => {
    const playerRect = {
      x: player.position.x,
      y: player.position.y,
      width: 30,
      height: 30
    };

    for (const spike of spikes) {
      if (
        playerRect.x < spike.x + spike.width &&
        playerRect.x + playerRect.width > spike.x &&
        playerRect.y < spike.y + spike.height &&
        playerRect.y + playerRect.height > spike.y
      ) {
        return true;
      }
    }
    return false;
  };

  const createDeathParticles = (player: Player) => {
    const particles: DeathParticle[] = [];
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: player.position.x + 15,
        y: player.position.y + 15,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 5,
        color: player.character.color,
        life: 60
      });
    }
    setDeathParticles(prev => [...prev, ...particles]);
  };

  const updateGame = () => {
    const currentTime = Date.now();
    const elapsedSeconds = (currentTime - gameStartTimeRef.current) / 1000;
    
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
        const lastJump = lastJumpRef.current[player.id] || 0;
        if (currentTime - lastJump > 200) { // Prevent spam
          newPlayer.velocity.y = -15;
          newPlayer.isGrounded = false;
          lastJumpRef.current[player.id] = currentTime;
          audioRef.current?.playJumpSound();
        }
      }

      if (keys.has(player.controls.dash.toLowerCase())) {
        const lastDash = lastDashRef.current[player.id] || 0;
        if (currentTime - lastDash > 500) { // Dash cooldown
          if (newPlayer.velocity.x > 0) newPlayer.velocity.x = Math.min(newPlayer.velocity.x + 3, 12);
          if (newPlayer.velocity.x < 0) newPlayer.velocity.x = Math.max(newPlayer.velocity.x - 3, -12);
          lastDashRef.current[player.id] = currentTime;
          audioRef.current?.playDashSound();
        }
      }

      // Apply gravity
      if (!newPlayer.isGrounded) {
        newPlayer.velocity.y += GRAVITY;
      }

      // Update position
      newPlayer.position.x += newPlayer.velocity.x;
      newPlayer.position.y += newPlayer.velocity.y;

      // Check platform collisions
      const collision = checkCollision(newPlayer, currentMap);
      if (collision.collision) {
        if (collision.side === 'top') {
          newPlayer.position.y = collision.platform!.y - 30;
          newPlayer.velocity.y = 0;
          newPlayer.isGrounded = true;
        } else if (collision.side === 'left') {
          newPlayer.position.x = collision.platform!.x - 30;
          newPlayer.velocity.x = 0;
        } else if (collision.side === 'right') {
          newPlayer.position.x = collision.platform!.x + collision.platform!.width;
          newPlayer.velocity.x = 0;
        }
      } else {
        newPlayer.isGrounded = false;
      }

      // Check spike collisions
      if (checkSpikeCollision(newPlayer, currentSpikes)) {
        createDeathParticles(newPlayer);
        audioRef.current?.playDeathSound();
        // Reset player to start
        newPlayer.position = { x: 50 + Math.random() * 100, y: 400 };
        newPlayer.velocity = { x: 0, y: 0 };
      }

      // Reset if fallen off screen
      if (newPlayer.position.y > 600) {
        newPlayer.position = { x: 50 + Math.random() * 100, y: 400 };
        newPlayer.velocity = { x: 0, y: 0 };
      }

      // Check finish line
      if (newPlayer.position.x >= FINISH_LINE_X && !newPlayer.finished) {
        newPlayer.finished = true;
        newPlayer.finishTime = elapsedSeconds;
        audioRef.current?.playFinishSound();
        
        // Create finish line particles
        const particles = [];
        for (let i = 0; i < 10; i++) {
          particles.push({
            x: FINISH_LINE_X + Math.random() * 50,
            y: Math.random() * 400,
            vy: -Math.random() * 5 - 2,
            life: 120
          });
        }
        setFinishLineParticles(prev => [...prev, ...particles]);
      }

      return newPlayer;
    });

    // Update death particles
    setDeathParticles(prev => prev.map(particle => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vy: particle.vy + 0.3, // gravity
      life: particle.life - 1
    })).filter(particle => particle.life > 0));

    // Update finish line particles
    setFinishLineParticles(prev => prev.map(particle => ({
      ...particle,
      y: particle.y + particle.vy,
      vy: particle.vy + 0.1,
      life: particle.life - 1
    })).filter(particle => particle.life > 0));

    // Check if enough players have finished to end the game
    const finishedPlayers = updatedPlayers.filter(p => p.finished);
    
    // End game when the required number of winners finish
    if (finishedPlayers.length >= maxWinners && !gameEndTriggeredRef.current) {
      gameEndTriggeredRef.current = true;
      const winner = finishedPlayers.sort((a, b) => (a.finishTime || 0) - (b.finishTime || 0))[0];
      setTimeout(() => onGameEnd(winner), 2000);
    } else if (elapsedSeconds > 60 && !gameEndTriggeredRef.current) { // 60 seconds max
      // Time limit reached
      if (finishedPlayers.length > 0) {
        gameEndTriggeredRef.current = true;
        const winner = finishedPlayers.sort((a, b) => (a.finishTime || 0) - (b.finishTime || 0))[0];
        setTimeout(() => onGameEnd(winner), 2000);
      }
    }

    setPlayers(updatedPlayers);
    setGameTime(elapsedSeconds);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw platforms with different styles for thick ones
    currentMap.forEach(platform => {
      if (platform.height >= THICK_PLATFORM_HEIGHT) {
        // Thick platform with gradient
        const gradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(1, '#654321');
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = '#654321';
      }
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Add highlight for thick platforms
      if (platform.height >= THICK_PLATFORM_HEIGHT) {
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(platform.x, platform.y, platform.width, 5);
      }
    });

    // Draw spikes
    ctx.fillStyle = '#FF4444';
    currentSpikes.forEach(spike => {
      ctx.beginPath();
      ctx.moveTo(spike.x, spike.y + spike.height);
      ctx.lineTo(spike.x + spike.width / 2, spike.y);
      ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
      ctx.closePath();
      ctx.fill();
      
      // Add glow effect
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw animated finish line
    const time = gameTime * 0.1;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 8;
    ctx.setLineDash([15, 15]);
    ctx.lineDashOffset = time * 20;
    ctx.beginPath();
    ctx.moveTo(FINISH_LINE_X, 0);
    ctx.lineTo(FINISH_LINE_X, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw finish line particles
    finishLineParticles.forEach(particle => {
      ctx.fillStyle = `rgba(255, 215, 0, ${particle.life / 120})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw death particles
    deathParticles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / 60;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw players
    players.forEach(player => {
      if (!player.finished || gameTime % 20 < 10) { // Blinking effect for finished players
        // Player body with bounce effect
        const bounceOffset = player.isGrounded ? 0 : Math.sin(gameTime * 0.3) * 2;
        ctx.fillStyle = player.character.color;
        
        ctx.beginPath();
        ctx.arc(player.position.x + 15, player.position.y + 15 + bounceOffset, 15, 0, Math.PI * 2);
        ctx.fill();

        // Player emoji face
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.character.emoji, player.position.x + 15, player.position.y + 22 + bounceOffset);

        // Player name
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(player.character.name, player.position.x + 15, player.position.y - 5);

        // Finished indicator with pulsing effect
        if (player.finished) {
          const pulse = Math.sin(gameTime * 0.2) * 0.3 + 0.7;
          ctx.font = `${16 * pulse}px Arial`;
          ctx.fillStyle = 'gold';
          ctx.fillText('🏆', player.position.x + 15, player.position.y - 20);
        }
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
  }, [players, currentMap, currentSpikes]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 p-4">
      <div className="max-w-full mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center text-white">
            <h2 className="text-2xl font-bold">🏁 Goober Race!</h2>
            <div className="text-lg">Time: {Math.floor(gameTime)}s</div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="flex gap-4">
              {players.map(player => (
                <div key={player.id} className="text-white text-sm">
                  {player.character.emoji} {player.character.name}
                  {player.finished && <span className="text-yellow-300"> - Finished! 🏆</span>}
                </div>
              ))}
            </div>
            <div className="text-white text-sm">
              🏆 Winners needed: {maxWinners} | Finished: {players.filter(p => p.finished).length}
            </div>
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

        <div className="mt-4 text-center text-white/80 text-sm space-y-1">
          <p>🎮 Use your assigned keys to move, jump, and dash! Race to the golden finish line!</p>
          <p>⚠️ Avoid the red spikes - they'll send you back to the start!</p>
          <p>🧱 Some platforms are thicker - you can grab onto their sides!</p>
          <p>🎵 Sound effects included - click anywhere to enable audio!</p>
        </div>
      </div>
    </div>
  );
};

export default GameArena;
