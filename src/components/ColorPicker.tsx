
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const ColorPicker = ({ selectedColor, onColorSelect }: ColorPickerProps) => {
  const [hexInput, setHexInput] = useState(selectedColor);
  const [isColorWheelActive, setIsColorWheelActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const PRESET_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", 
    "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4",
    "#f59e0b", "#10b981", "#6366f1", "#f43f5e",
    "#84cc16", "#06b6d4", "#8b5cf6", "#f43f5e",
    "#1f2937", "#374151", "#6b7280", "#9ca3af",
    "#d1d5db", "#e5e7eb", "#f3f4f6", "#ffffff"
  ];

  useEffect(() => {
    if (canvasRef.current && isColorWheelActive) {
      drawColorWheel();
    }
  }, [isColorWheelActive]);

  const drawColorWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Draw color wheel
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = angle * Math.PI / 180;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineWidth = 2;
      ctx.strokeStyle = `hsl(${angle}, 100%, 50%)`;
      ctx.stroke();
    }

    // Draw inner brightness gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.8);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, 'transparent');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.8, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = Math.min(centerX, centerY) - 10;
    
    if (distance <= radius) {
      const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
      const saturation = Math.min(distance / radius * 100, 100);
      const lightness = 50;
      
      const hslColor = `hsl(${angle}, ${saturation}%, ${lightness}%)`;
      const hexColor = hslToHex(angle, saturation, lightness);
      
      onColorSelect(hexColor);
      setHexInput(hexColor);
    }
  };

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const handleHexInputChange = (value: string) => {
    setHexInput(value);
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onColorSelect(value);
    }
  };

  const isValidHex = (hex: string) => /^#[0-9A-F]{6}$/i.test(hex);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <h3 className="text-lg font-semibold mb-4">Choose a Color</h3>
      
      {/* Hex Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Hex Color Code</label>
        <div className="flex gap-2">
          <Input
            value={hexInput}
            onChange={(e) => handleHexInputChange(e.target.value)}
            placeholder="#000000"
            className="flex-1"
          />
          <div 
            className="w-10 h-10 rounded border-2 border-gray-300"
            style={{ backgroundColor: isValidHex(hexInput) ? hexInput : '#ffffff' }}
          />
        </div>
        {!isValidHex(hexInput) && hexInput && (
          <p className="text-red-500 text-xs mt-1">Invalid hex format (use #RRGGBB)</p>
        )}
      </div>

      {/* Preset Colors */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Preset Colors</label>
        <div className="grid grid-cols-8 gap-1">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => {
                onColorSelect(color);
                setHexInput(color);
              }}
              className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                selectedColor === color ? 'border-gray-800 ring-2 ring-blue-500' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Color Wheel Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setIsColorWheelActive(!isColorWheelActive)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          {isColorWheelActive ? 'Hide' : 'Show'} Color Wheel
        </button>
      </div>

      {/* Color Wheel */}
      {isColorWheelActive && (
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            onClick={handleCanvasClick}
            className="cursor-crosshair border rounded"
            title="Click to select a color"
          />
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
