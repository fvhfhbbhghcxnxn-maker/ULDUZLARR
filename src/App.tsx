/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Orbit, 
  Zap, 
  Trash2, 
  Plus, 
  Minus, 
  Sparkles, 
  CircleDot,
  Settings2,
  Info,
  Maximize2,
  Eraser,
  MousePointer2,
  Heart,
  Star,
  Circle as CircleIcon,
  Play,
  Pause
} from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

interface GravityWell {
  id: string;
  x: number;
  y: number;
  strength: number;
  type: 'attractor' | 'repeller';
  shape: 'circle' | 'heart' | 'star';
  color: string;
  size: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wells, setWells] = useState<GravityWell[]>([]);
  const [mode, setMode] = useState<'add' | 'delete'>('add');
  const [selectedColor, setSelectedColor] = useState<string>('random');
  const [selectedWellColor, setSelectedWellColor] = useState<string>('#00FFFF');
  const [selectedWellSize, setSelectedWellSize] = useState<number>(12);
  const [selectedShape, setSelectedShape] = useState<'circle' | 'heart' | 'star'>('circle');
  const [isPaused, setIsPaused] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const particles = useRef<Particle[]>([]);
  const requestRef = useRef<number>(0);
  const wellsRef = useRef<GravityWell[]>([]);

  // Sync ref with state for use in the animation loop without re-triggering effects
  useEffect(() => {
    wellsRef.current = wells;
  }, [wells]);

  const initParticles = () => {
    const count = 800;
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      let color = selectedColor;
      if (selectedColor === 'random') {
        color = `hsl(${Math.random() * 40 + 180}, 100%, 70%)`;
      }
      
      newParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        color: color,
        size: Math.random() * 1.5 + 0.5,
      });
    }
    particles.current = newParticles;
  };

  const update = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with trail effect
    ctx.fillStyle = 'rgba(5, 5, 10, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    if (!isPaused) {
      const currentWells = wellsRef.current;
      const width = canvas.width;
      const height = canvas.height;

      particles.current.forEach(p => {
        // Apply gravity from wells
        currentWells.forEach(well => {
          const dx = well.x - p.x;
          const dy = well.y - p.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);
          
          if (dist < 600) {
            const force = (well.strength * 150) / (distSq + 1500);
            const angle = Math.atan2(dy, dx);
            
            if (well.type === 'attractor') {
              p.vx += Math.cos(angle) * force;
              p.vy += Math.sin(angle) * force;
            } else {
              p.vx -= Math.cos(angle) * force;
              p.vy -= Math.sin(angle) * force;
            }
          }
        });

        // Friction
        p.vx *= 0.985;
        p.vy *= 0.985;

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      });
    }

    // Draw particles
    particles.current.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    const currentWells = wellsRef.current;
    // Draw wells
    currentWells.forEach(well => {
      ctx.save();
      ctx.translate(well.x, well.y);
      ctx.shadowBlur = well.size * 2;
      ctx.shadowColor = well.color;
      ctx.fillStyle = well.color.replace(')', ', 0.6)').replace('rgb', 'rgba').replace('#', 'rgba(');
      
      // Helper to handle hex to rgba for the fill
      if (well.color.startsWith('#')) {
        const r = parseInt(well.color.slice(1, 3), 16);
        const g = parseInt(well.color.slice(3, 5), 16);
        const b = parseInt(well.color.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;

      if (well.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, well.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (well.shape === 'heart') {
        ctx.beginPath();
        const size = well.size * 1.25;
        ctx.moveTo(0, size / 4);
        ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, size / 4);
        ctx.bezierCurveTo(-size / 2, size / 2, 0, size * 0.75, 0, size);
        ctx.bezierCurveTo(0, size * 0.75, size / 2, size / 2, size / 2, size / 4);
        ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, size / 4);
        ctx.fill();
        ctx.stroke();
      } else if (well.shape === 'star') {
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = well.size * 1.25;
        const innerRadius = outerRadius / 2;
        let rot = Math.PI / 2 * 3;
        let x = 0;
        let y = 0;
        const step = Math.PI / spikes;

        ctx.moveTo(0, -outerRadius);
        for (let i = 0; i < spikes; i++) {
          x = Math.cos(rot) * outerRadius;
          y = Math.sin(rot) * outerRadius;
          ctx.lineTo(x, y);
          rot += step;

          x = Math.cos(rot) * innerRadius;
          y = Math.sin(rot) * innerRadius;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(0, -outerRadius);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });

    ctx.restore();
    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    handleResize();
    if (particles.current.length === 0) {
      initParticles();
    }
    requestRef.current = requestAnimationFrame(update);

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.001;
      setZoom(prev => Math.max(0.1, Math.min(5, prev - e.deltaY * zoomSpeed)));
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('wheel', handleWheel);
      }
      cancelAnimationFrame(requestRef.current);
    };
  }, [isPaused, zoom, offset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isPanning) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Convert screen coordinates to world coordinates
    const canvas = canvasRef.current!;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    const worldX = (screenX - (canvas.width / 2 + offset.x)) / zoom + canvas.width / 2;
    const worldY = (screenY - (canvas.height / 2 + offset.y)) / zoom + canvas.height / 2;

    if (mode === 'delete') {
      const existingIndex = wells.findIndex(w => Math.hypot(w.x - worldX, w.y - worldY) < 30 / zoom);
      if (existingIndex !== -1) {
        const newWells = [...wells];
        newWells.splice(existingIndex, 1);
        setWells(newWells);
      }
    } else {
      setWells([...wells, { 
        id: Math.random().toString(36).substr(2, 9),
        x: worldX, 
        y: worldY, 
        strength: 1, 
        type: e.shiftKey ? 'repeller' : 'attractor',
        shape: selectedShape,
        color: selectedWellColor,
        size: selectedWellSize
      }]);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#05050a] overflow-hidden font-sans text-white">
      <canvas 
        ref={canvasRef} 
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`absolute inset-0 ${isPanning ? 'cursor-grabbing' : mode === 'delete' ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
      />

      {/* UI Overlay */}
      <AnimatePresence>
        {showUI && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-6 left-6 w-72 pointer-events-none"
          >
            <div className="bg-black/70 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl space-y-6 pointer-events-auto shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Orbit className="text-cyan-400" size={20} />
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-widest uppercase">Astro-Dynamics</h1>
                  <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">CR : @fikawz0</p>
                </div>
              </div>

              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => setMode('add')}
                  className={`flex-1 py-2 rounded-lg text-[10px] uppercase font-bold transition-all flex items-center justify-center gap-2 ${mode === 'add' ? 'bg-cyan-500 text-black' : 'text-white/60 hover:text-white'}`}
                >
                  <MousePointer2 size={14} />
                  Yerləşdir
                </button>
                <button 
                  onClick={() => setMode('delete')}
                  className={`flex-1 py-2 rounded-lg text-[10px] uppercase font-bold transition-all flex items-center justify-center gap-2 ${mode === 'delete' ? 'bg-red-500 text-white' : 'text-white/60 hover:text-white'}`}
                >
                  <Eraser size={14} />
                  Sil
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Ulduz Rəngi</span>
                </div>
                <div className="flex flex-wrap gap-2 px-1">
                  {[
                    { name: 'random', value: 'random', bg: 'bg-gradient-to-tr from-cyan-400 to-magenta-400' },
                    { name: 'red', value: '#FF0000', bg: 'bg-[#FF0000]' },
                    { name: 'crimson', value: '#DC143C', bg: 'bg-[#DC143C]' },
                    { name: 'orange-red', value: '#FF4500', bg: 'bg-[#FF4500]' },
                    { name: 'deep-pink', value: '#FF1493', bg: 'bg-[#FF1493]' },
                    { name: 'cyan', value: '#00FFFF', bg: 'bg-[#00FFFF]' },
                    { name: 'magenta', value: '#FF00FF', bg: 'bg-[#FF00FF]' },
                    { name: 'lime', value: '#00FF00', bg: 'bg-[#00FF00]' },
                    { name: 'gold', value: '#FFD700', bg: 'bg-[#FFD700]' },
                    { name: 'white', value: '#FFFFFF', bg: 'bg-[#FFFFFF]' },
                  ].map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.value)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${c.bg} ${selectedColor === c.value ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Mərkəz Rəngi</span>
                </div>
                <div className="flex flex-wrap gap-2 px-1">
                  {[
                    { name: 'cyan', value: '#00FFFF', bg: 'bg-[#00FFFF]' },
                    { name: 'magenta', value: '#FF00FF', bg: 'bg-[#FF00FF]' },
                    { name: 'red', value: '#FF0000', bg: 'bg-[#FF0000]' },
                    { name: 'crimson', value: '#DC143C', bg: 'bg-[#DC143C]' },
                    { name: 'lime', value: '#00FF00', bg: 'bg-[#00FF00]' },
                    { name: 'gold', value: '#FFD700', bg: 'bg-[#FFD700]' },
                    { name: 'white', value: '#FFFFFF', bg: 'bg-[#FFFFFF]' },
                  ].map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedWellColor(c.value)}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${c.bg} ${selectedWellColor === c.value ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Mərkəz Ölçüsü</span>
                  <span className="text-[10px] font-mono text-cyan-400">{selectedWellSize}px</span>
                </div>
                <div className="px-1">
                  <input 
                    type="range" 
                    min="5" 
                    max="40" 
                    value={selectedWellSize} 
                    onChange={(e) => setSelectedWellSize(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Mərkəz Forması</span>
                </div>
                <div className="flex gap-3 px-1">
                  {[
                    { id: 'circle', icon: CircleIcon },
                    { id: 'heart', icon: Heart },
                    { id: 'star', icon: Star },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedShape(s.id as any)}
                      className={`p-2 rounded-xl border transition-all ${selectedShape === s.id ? 'bg-white/20 border-white text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                    >
                      <s.icon size={16} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Zoom</span>
                  <span className="text-[10px] font-mono text-cyan-400">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex gap-2 px-1">
                  <button 
                    onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
                  >
                    <Minus size={14} />
                  </button>
                  <button 
                    onClick={() => {
                      setZoom(1);
                      setOffset({ x: 0, y: 0 });
                    }}
                    className="flex-1 text-[10px] uppercase font-bold bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
                  >
                    Reset View
                  </button>
                  <button 
                    onClick={() => setZoom(prev => Math.min(5, prev + 0.1))}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] leading-relaxed opacity-80">
                  <div className="flex items-start gap-2 mb-2">
                    <Info size={12} className="text-cyan-400 mt-0.5" />
                    <span className="font-bold uppercase tracking-tighter">Təlimat:</span>
                  </div>
                  <ul className="space-y-1 list-disc list-inside">
                    {mode === 'add' ? (
                      <>
                        <li>Kliklə: <span className="text-cyan-400 font-bold">Cazibə</span></li>
                        <li>Shift + Klik: <span className="text-[#FF00FF] font-bold">İtələmə</span></li>
                      </>
                    ) : (
                      <li>Mərkəzin üzərinə klikləyərək <span className="text-red-400 font-bold">Sil</span></li>
                    )}
                    <li>Scroll: <span className="text-cyan-400 font-bold">Zoom</span></li>
                    <li>Alt + Drag: <span className="text-cyan-400 font-bold">Pan</span></li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className={`flex-1 py-3 border rounded-xl text-[10px] uppercase font-bold transition-all flex items-center justify-center gap-2 ${isPaused ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'}`}
                >
                  {isPaused ? <Play size={14} /> : <Pause size={14} />}
                  {isPaused ? 'Davam Et' : 'Dayandır'}
                </button>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setWells([])}
                  className="flex-1 py-3 bg-white/5 hover:bg-red-500/20 border border-white/10 text-white/60 hover:text-red-500 rounded-xl text-[10px] uppercase font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  Hamısını Sil
                </button>
                <button 
                  onClick={() => initParticles()}
                  className="flex-1 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl text-[10px] uppercase font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} />
                  Ulduzları Yenilə
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle UI Button */}
      <button 
        onClick={() => setShowUI(!showUI)}
        className="absolute top-6 right-6 p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-white/60 hover:text-white"
      >
        <Settings2 size={20} />
      </button>

      {/* Footer Info */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-center space-y-2">
        <p className="text-[10px] uppercase tracking-[0.6em] opacity-20">
          Manipulate the fabric of space-time
        </p>
        <p className="text-[12px] font-black text-cyan-400 uppercase tracking-[0.2em] opacity-60">
          CR : @fikawz0
        </p>
      </div>

      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-magenta-500/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
