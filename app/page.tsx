'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Battery, BatteryMedium, BatteryLow, Moon } from 'lucide-react';

type Mode = 'off' | 'mindfulness' | 'resonance' | '478';
type Tab = 'therapy' | 'alarms' | 'jetlag';

type Alarm = {
  id: number;
  time: string;
  label: string;
  active: boolean;
  repeat: number[];
};

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [activeMode, setActiveMode] = useState<Mode>('off');
  const [timerDuration, setTimerDuration] = useState(30);
  const [activeTab, setActiveTab] = useState<Tab>('therapy');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [scalePulse, setScalePulse] = useState(1);
  const [alarms, setAlarms] = useState<Alarm[]>([
    { id: 1, time: '07:00', label: '晨间唤醒', active: true, repeat: [1, 1, 1, 1, 1, 0, 0] },
    { id: 2, time: '08:30', label: '周末赖床', active: false, repeat: [0, 0, 0, 0, 0, 1, 1] },
  ]);
  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (intensity === 'light') navigator.vibrate(10);
      else if (intensity === 'heavy') navigator.vibrate([30, 50, 30]);
      else navigator.vibrate(20);
    }
    if (intensity !== 'light') {
      setScalePulse(intensity === 'heavy' ? 1.03 : 1.01);
      setTimeout(() => setScalePulse(1), 150);
    }
  };

  const handleConnect = () => {
    setIsConnecting(true);
    triggerHaptic('light');
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      setBatteryLevel(85);
      setActiveMode('mindfulness');
      triggerHaptic('heavy');
    }, 1000);
  };

  useEffect(() => {
    const handleInteraction = () => {
      setShowUI(true);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      uiTimeoutRef.current = setTimeout(() => {
        setShowUI(false);
      }, 4000);
    };

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('click', handleInteraction);
    
    handleInteraction();

    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    };
  }, []);

  return (
    <motion.div 
      animate={{ scale: scalePulse }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="relative w-full h-[100dvh] flex flex-col font-sans overflow-hidden bg-[#030305] text-white selection:bg-white/20"
    >
      {/* Subtle Ambient Aura */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none"
        animate={{
          background: activeMode === 'mindfulness' 
            ? 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.05) 0%, rgba(3, 3, 5, 1) 70%)'
            : activeMode === 'resonance'
            ? 'radial-gradient(circle at 50% 50%, rgba(45, 212, 191, 0.05) 0%, rgba(3, 3, 5, 1) 70%)'
            : activeMode === '478'
            ? 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, rgba(3, 3, 5, 1) 70%)'
            : 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.01) 0%, rgba(3, 3, 5, 1) 70%)'
        }}
        transition={{ duration: 2 }}
      />

      <ChladniBackground mode={activeMode} isConnected={isConnected} />
      
      {/* Dark overlay for better readability in Alarms and Jetlag views */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-1000 pointer-events-none z-0 ${activeTab !== 'therapy' ? 'opacity-100' : 'opacity-0'}`} 
      />

      <div className={`absolute inset-0 flex flex-col z-10 transition-opacity duration-1000 ${showUI || activeTab !== 'therapy' ? 'opacity-100' : 'opacity-0'}`}>
        {/* Top Status Bar - Minimal Ethereal */}
        <header className="relative w-full px-8 py-8 flex justify-between items-center pointer-events-none">
          <div className="flex items-center space-x-3">
            <motion.div 
              className={`w-1 h-1 rounded-full ${isConnected ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/20'}`}
              animate={{ opacity: isConnected ? [0.3, 1, 0.3] : 1 }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[12px] tracking-[0.4em] uppercase font-light text-white/90 drop-shadow-md">
              {isConnected ? 'Dreamlight 已连接' : 'Dreamlight 待命'}
            </span>
          </div>
          {isConnected && (
            <div className="flex items-center space-x-3 text-white/90 drop-shadow-md">
              <span className="text-[12px] tracking-[0.3em] font-light">{batteryLevel}%</span>
              {batteryLevel > 70 ? (
                <Battery className="w-3.5 h-3.5 opacity-80" strokeWidth={1} />
              ) : batteryLevel > 30 ? (
                <BatteryMedium className="w-3.5 h-3.5 opacity-80" strokeWidth={1} />
              ) : (
                <BatteryLow className="w-3.5 h-3.5 text-rose-400 opacity-80" strokeWidth={1} />
              )}
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main className="relative flex-1 flex flex-col justify-center px-8 pb-24 pointer-events-none">
          <div className="pointer-events-auto h-full flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {!isConnected ? (
                <motion.div 
                  key="connect"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="absolute inset-0 flex flex-col items-center justify-center space-y-32"
                >
                  <div className="text-center space-y-6">
                    <img 
                      src="logo.png" 
                      alt="Dreamlight" 
                      className="h-12 md:h-16 w-auto mx-auto drop-shadow-sm opacity-90"
                    />
                    <p className="text-[12px] tracking-[0.6em] uppercase text-white/60 font-light drop-shadow-md">
                      沉浸式声光共振
                    </p>
                  </div>

                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="group relative flex items-center justify-center w-32 h-32 outline-none cursor-pointer"
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{
                        boxShadow: isConnecting 
                          ? ['0 0 20px rgba(255,255,255,0.05)', '0 0 50px rgba(255,255,255,0.1)', '0 0 20px rgba(255,255,255,0.05)'] 
                          : '0 0 10px rgba(255,255,255,0.02)'
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />

                    <motion.div
                      className="absolute inset-4 rounded-full bg-transparent border-[0.5px] border-white/20 overflow-hidden flex items-center justify-center backdrop-blur-sm"
                      animate={{ 
                        scale: isConnecting ? [0.98, 1.02, 0.98] : 1,
                        borderColor: isConnecting ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.2)'] : 'rgba(255,255,255,0.2)'
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Moon className={`w-6 h-6 transition-all duration-1000 ${isConnecting ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'text-white/70 group-hover:text-white'}`} strokeWidth={0.5} />
                    </motion.div>

                    <div className="absolute -bottom-12 flex flex-col items-center justify-center">
                      <span className={`text-[12px] tracking-[0.5em] uppercase font-light transition-colors duration-1000 ${isConnecting ? 'text-white drop-shadow-sm' : 'text-white/70 group-hover:text-white'}`}>
                        {isConnecting ? '唤醒中' : '触碰以连接'}
                      </span>
                    </div>
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="app"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0 }}
                  className="h-full flex flex-col justify-center max-w-sm mx-auto w-full"
                >
                  {activeTab === 'therapy' && (
                    <TherapyView 
                      activeMode={activeMode} 
                      setActiveMode={setActiveMode}
                      timerDuration={timerDuration}
                      setTimerDuration={setTimerDuration}
                      triggerHaptic={triggerHaptic}
                    />
                  )}
                  {activeTab === 'alarms' && <AlarmsView alarms={alarms} setAlarms={setAlarms} />}
                  {activeTab === 'jetlag' && <JetLagView alarms={alarms} setAlarms={setAlarms} setActiveTab={setActiveTab} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Elegant Bottom Navigation */}
        <AnimatePresence>
          {isConnected && (
            <motion.nav
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.8 }}
              className="absolute bottom-0 w-full pb-safe pt-24 z-20 bg-gradient-to-t from-[#030305]/80 via-[#030305]/40 to-transparent pointer-events-none"
            >
              <div className="flex justify-center space-x-12 pb-8 pointer-events-auto">
                <NavButton label="光疗" isActive={activeTab === 'therapy'} onClick={() => setActiveTab('therapy')} />
                <NavButton label="唤醒" isActive={activeTab === 'alarms'} onClick={() => setActiveTab('alarms')} />
                <NavButton label="时差" isActive={activeTab === 'jetlag'} onClick={() => setActiveTab('jetlag')} />
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function NavButton({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 transition-all duration-1000 ${
        isActive ? 'text-white' : 'text-white/50 hover:text-white/80'
      }`}
    >
      <span className="text-[12px] font-extralight tracking-[0.4em] uppercase">{label}</span>
      {isActive && (
        <motion.div 
          layoutId="navIndicator"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </button>
  );
}

type BreathProfile = { duration: number, start: number, end: number }[];
const breathProfiles: Record<Mode, BreathProfile> = {
  off: [
    { duration: 10, start: 0, end: 1 },
    { duration: 10, start: 1, end: 0 }
  ],
  mindfulness: [
    { duration: 3, start: 0, end: 1 },
    { duration: 0.5, start: 1, end: 1 },
    { duration: 3, start: 1, end: 0 },
    { duration: 2, start: 0, end: 0 }
  ],
  resonance: [
    { duration: 6, start: 0, end: 1 },
    { duration: 6, start: 1, end: 0 }
  ],
  '478': [
    { duration: 4, start: 0, end: 1 },
    { duration: 7, start: 1, end: 1 },
    { duration: 8, start: 1, end: 0 }
  ]
};

const ChladniBackground = React.memo(function ChladniBackground({ mode, isConnected }: { mode: Mode, isConnected: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  const isConnectedRef = useRef(isConnected);
  useEffect(() => {
    modeRef.current = mode;
    isConnectedRef.current = isConnected;
  }, [mode, isConnected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = window.devicePixelRatio || 1;
    
    const setCanvasSize = () => {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    setCanvasSize();

    const numParticles = 40000;
    const particles = new Float32Array(numParticles * 2);
    for (let i = 0; i < numParticles * 2; i++) {
       particles[i] = Math.random();
    }

    const modeConfigs: Record<Mode, { n: number, m: number, color: {r:number, g:number, b:number} }> = {
      off: { n: 2, m: 3, color: { r: 30, g: 58, b: 138 } },
      mindfulness: { n: 4, m: 5, color: { r: 168, g: 85, b: 247 } },
      resonance: { n: 7, m: 2, color: { r: 45, g: 212, b: 191 } },
      '478': { n: 5, m: 5, color: { r: 99, g: 102, b: 241 } },
    };

    let currentN = modeConfigs['off'].n;
    let currentM = modeConfigs['off'].m;
    let currentColor = { ...modeConfigs['off'].color };
    let lastTime = performance.now();

    let phaseIndex = 0;
    let phaseTimeMs = 0;
    let currentBreathValue = 0;

    let resizeTimer: any;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = window.devicePixelRatio || 1;
        setCanvasSize();
      }, 200);
    };
    window.addEventListener('resize', handleResize);

    const render = (time: number) => {
      const dt = Math.min(time - lastTime, 50); // cap delta time
      lastTime = time;
      const fpsRatio = dt / (1000 / 60);

      const targetMode = isConnectedRef.current ? modeRef.current : 'off';
      const target = modeConfigs[targetMode];
      
      // Breath phase machine
      const profile = breathProfiles[targetMode];
      if (phaseIndex >= profile.length) {
        phaseIndex = 0;
        phaseTimeMs = 0;
      }
      
      phaseTimeMs += dt;
      let currentPhase = profile[phaseIndex];
      if (phaseTimeMs >= currentPhase.duration * 1000) {
        phaseTimeMs -= currentPhase.duration * 1000;
        phaseIndex = (phaseIndex + 1) % profile.length;
        currentPhase = profile[phaseIndex];
      }
      
      const progress = currentPhase.duration > 0 ? phaseTimeMs / (currentPhase.duration * 1000) : 0;
      const smoothProgress = 0.5 - Math.cos(progress * Math.PI) / 2;
      const targetBreathValue = currentPhase.start + (currentPhase.end - currentPhase.start) * smoothProgress;
      
      // Smooth interpolation of breathless values
      const oldBreathValue = currentBreathValue;
      currentBreathValue += (targetBreathValue - currentBreathValue) * 0.1 * fpsRatio;
      const breathDerivative = currentBreathValue - oldBreathValue;
      
      currentN += (target.n - currentN) * 0.01 * fpsRatio;
      currentM += (target.m - currentM) * 0.01 * fpsRatio;

      currentColor.r += (target.color.r - currentColor.r) * 0.02 * fpsRatio;
      currentColor.g += (target.color.g - currentColor.g) * 0.02 * fpsRatio;
      currentColor.b += (target.color.b - currentColor.b) * 0.02 * fpsRatio;

      // Draw background with opacity for particle trail effect
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(3, 3, 5, ${0.15 + (1 - currentBreathValue) * 0.15})`; 
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'screen';
      const intensity = 0.6 + currentBreathValue * 0.4;
      ctx.fillStyle = `rgba(${Math.round(currentColor.r)}, ${Math.round(currentColor.g)}, ${Math.round(currentColor.b)}, ${intensity})`;

      // Breathing resonance parameters mapping a circle in phase space
      const targetT = currentBreathValue * (Math.PI / 2);
      const a = Math.cos(targetT);
      const b = Math.sin(targetT);
      
      // Expand/contract slightly based on breath
      const scaleFactor = 1.0 + currentBreathValue * 0.2;
      const size = Math.max(width, height) * scaleFactor;
      const offsetX = (width - size) / 2;
      const offsetY = (height - size) / 2;

      const vibration = targetMode === 'off' ? 0.002 : 0.003 + currentBreathValue * 0.008;
      const stepSize = 0.001 * fpsRatio;

      ctx.beginPath();
      for (let i = 0; i < numParticles; i++) {
        let x = particles[i*2];
        let y = particles[i*2 + 1];

        // Browninan noise to keep particles alive and prevent stacking
        x += (Math.random() - 0.5) * vibration * fpsRatio;
        y += (Math.random() - 0.5) * vibration * fpsRatio;

        // Torus wrapping
        if (x < 0) x += 1;
        if (x > 1) x -= 1;
        if (y < 0) y += 1;
        if (y > 1) y -= 1;

        // Breath gravity field
        const dx = 0.5 - x;
        const dy = 0.5 - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.01) {
          const force = breathDerivative * -0.5; // push out on inhale, pull in on exhale
          x += (dx / dist) * force * fpsRatio;
          y += (dy / dist) * force * fpsRatio;
        }

        const piX = Math.PI * x;
        const piY = Math.PI * y;
        const sinNX = Math.sin(currentN * piX);
        const cosNX = Math.cos(currentN * piX);
        const sinMY = Math.sin(currentM * piY);
        const cosMY = Math.cos(currentM * piY);
        
        const sinMX = Math.sin(currentM * piX);
        const cosMX = Math.cos(currentM * piX);
        const sinNY = Math.sin(currentN * piY);
        const cosNY = Math.cos(currentN * piY);

        const f = a * sinNX * sinMY + b * sinMX * sinNY;
        const dfdx = a * currentN * Math.PI * cosNX * sinMY + b * currentM * Math.PI * cosMX * sinNY;
        const dfdy = a * currentM * Math.PI * sinNX * cosMY + b * currentN * Math.PI * sinMX * cosNY;

        // Gradient descent towards f=0 (nodal lines), plus random respawn to prevent pure stacking
        if (Math.random() < 0.001 * fpsRatio) {
           x = Math.random();
           y = Math.random();
        } else {
           x -= f * dfdx * stepSize;
           y -= f * dfdy * stepSize;
        }

        particles[i*2] = x;
        particles[i*2+1] = y;

        const screenX = offsetX + x * size;
        const screenY = offsetY + y * size;
        
        ctx.rect(screenX, screenY, 1.0, 1.0);
      }
      ctx.fill();

      // Add a subtle vignette/glow overlay
      const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, size/1.5);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(3,3,5,0.8)');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };
    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 w-full h-full object-cover" />;
});

function TherapyView({ activeMode, setActiveMode, timerDuration, setTimerDuration, triggerHaptic }: any) {
  const modes = [
    { id: 'mindfulness', label: '正念', desc: '声光流转' },
    { id: 'resonance', label: '共振', desc: '克拉尼律动' },
    { id: '478', label: '深眠', desc: '4-7-8 频率' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="flex flex-col h-full justify-center relative w-full"
    >
      {/* Horizontal sleek timer slider */}
      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-center space-y-4 z-20 pointer-events-auto opacity-40 hover:opacity-100 transition-opacity duration-1000">
        <div className="flex flex-col items-center space-y-1">
          <span className="text-[12px] tracking-widest font-extralight text-white/80">定时关闭</span>
          <span className="text-[12px] tracking-[0.4em] font-extralight text-white uppercase">
            {timerDuration} MIN
          </span>
        </div>
        <input 
          type="range"
          min="5" max="60" step="5"
          value={timerDuration}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setTimerDuration(val);
          }}
          className="w-64 max-w-[80%] h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent appearance-none outline-none cursor-pointer 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(255,255,255,1)]
            [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing hover:[&::-webkit-slider-thumb]:scale-150 transition-all"
        />
      </div>

      <div className="flex flex-col space-y-10 pl-4">
        {modes.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => {
                triggerHaptic('medium');
                setActiveMode(isActive ? 'off' : mode.id);
              }}
              className={`text-left group transition-all duration-1000 relative pl-8 py-2 w-max outline-none ${isActive ? 'opacity-100' : 'opacity-50 hover:opacity-90'}`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeModeBar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-[40%] w-[1px] bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                />
              )}
              <h2 className={`font-display tracking-[0.3em] transition-transform duration-1000 origin-left text-2xl ${isActive ? 'font-normal text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] scale-110' : 'font-light text-white/90 drop-shadow-sm scale-100'}`}>
                {mode.label}
              </h2>
              <div className={`overflow-hidden transition-all duration-1000 ease-out ${isActive ? 'max-h-8 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
                <p className="text-[12px] tracking-[0.4em] text-white/90 font-light uppercase drop-shadow-sm">
                  {mode.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function AlarmsView({ alarms, setAlarms }: { alarms: Alarm[]; setAlarms: React.Dispatch<React.SetStateAction<Alarm[]>> }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTime, setEditTime] = useState('07:00');
  const [editRepeat, setEditRepeat] = useState<number[]>([1,1,1,1,1,1,1]);

  const dayNames = ['一', '二', '三', '四', '五', '六', '日'];

  const startEdit = (alarm: typeof alarms[0]) => {
    setEditingId(alarm.id);
    setEditTime(alarm.time);
    setEditRepeat([...alarm.repeat]);
  };

  const saveEdit = () => {
    if (editingId === null) return;
    setAlarms(alarms.map(a => a.id === editingId ? { ...a, time: editTime, repeat: editRepeat } : a));
    setEditingId(null);
  };

  const deleteAlarm = (id: number) => {
    setAlarms(alarms.filter(a => a.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const addAlarm = () => {
    if (alarms.length >= 10) return;
    const newAlarm = {
      id: Date.now(),
      time: '08:00',
      label: '',
      active: true,
      repeat: [1, 1, 1, 1, 1, 1, 1]
    };
    setAlarms([...alarms, newAlarm]);
  };

  const formatRepeat = (r: number[]) => {
    const allOn = r.every(v => v === 1);
    const allOff = r.every(v => v === 0);
    if (allOn) return '每天';
    if (allOff) return '单次';
    const days = r.map((v, i) => v ? dayNames[i] : '').filter(Boolean).join('·');
    return days;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="flex flex-col h-[60vh] justify-start px-4 overflow-y-auto no-scrollbar pb-8"
    >
      <div className="flex flex-col space-y-4">
        {alarms.map(alarm => (
          <div key={alarm.id}>
            {editingId === alarm.id ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="py-4 border-b border-white/10 space-y-5"
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="bg-transparent border border-white/20 rounded px-3 py-1 text-white text-lg font-light tracking-wider outline-none [color-scheme:dark]"
                  />
                </div>

                <div className="flex space-x-1 justify-center">
                  {dayNames.map((day, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const next = [...editRepeat];
                        next[i] = next[i] ? 0 : 1;
                        setEditRepeat(next);
                      }}
                      className={`w-8 h-8 rounded-full text-[10px] font-light tracking-wider transition-all ${
                        editRepeat[i] ? 'bg-white/15 text-white' : 'bg-transparent text-white/30'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <div className="flex space-x-4 justify-end">
                  <button onClick={() => deleteAlarm(alarm.id)} className="text-[10px] text-rose-400/70 hover:text-rose-400 tracking-widest uppercase">删除</button>
                  <button onClick={() => setEditingId(null)} className="text-[10px] text-white/40 hover:text-white/70 tracking-widest uppercase">取消</button>
                  <button onClick={saveEdit} className="text-[10px] text-white/80 hover:text-white tracking-widest uppercase">保存</button>
                </div>
              </motion.div>
            ) : (
              <button 
                onClick={() => startEdit(alarm)}
                className={`w-full relative text-left transition-all duration-700 py-6 border-b outline-none ${alarm.active ? 'border-white/20' : 'border-white/10 hover:border-white/30'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className={`font-display transition-all duration-700 tracking-widest ${alarm.active ? 'text-3xl text-white font-light drop-shadow-md' : 'text-3xl text-white/40 font-extralight'}`}>
                      {alarm.time}
                    </h2>
                    <div className="flex space-x-3 items-center pt-1">
                      <p className={`text-[9px] tracking-[0.2em] font-extralight ${alarm.active ? 'text-white/40' : 'text-white/20'}`}>
                        {formatRepeat(alarm.repeat)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${alarm.active ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] scale-100' : 'bg-white/20 scale-75'}`} />
                  </div>
                </div>
              </button>
            )}
          </div>
        ))}
      </div>

      {alarms.length < 10 ? (
        <button 
          onClick={addAlarm}
          className="mt-6 self-start flex items-center space-x-3 text-white/40 hover:text-white/80 transition-all duration-700 outline-none"
        >
          <span className="text-base font-thin">+</span>
          <span className="text-[11px] tracking-[0.4em] uppercase font-light">添加唤醒</span>
        </button>
      ) : (
        <p className="mt-6 text-[10px] text-white/20 tracking-wider font-extralight">最多 10 个闹钟</p>
      )}
    </motion.div>
  );
}

function JetLagView({ alarms, setAlarms, setActiveTab }: { alarms: Alarm[]; setAlarms: React.Dispatch<React.SetStateAction<Alarm[]>>; setActiveTab: (tab: Tab) => void }) {
  const [addedDays, setAddedDays] = useState<Set<number>>(new Set());
  const regions: { name: string; cities: { name: string; tz: string; offset: number }[] }[] = [
    {
      name: '中国',
      cities: [
        { name: '北京', tz: 'CST', offset: 8 },
        { name: '上海', tz: 'CST', offset: 8 },
        { name: '广州', tz: 'CST', offset: 8 },
        { name: '深圳', tz: 'CST', offset: 8 },
        { name: '香港', tz: 'HKT', offset: 8 },
        { name: '澳门', tz: 'CST', offset: 8 },
        { name: '成都', tz: 'CST', offset: 8 },
        { name: '重庆', tz: 'CST', offset: 8 },
        { name: '杭州', tz: 'CST', offset: 8 },
        { name: '南京', tz: 'CST', offset: 8 },
        { name: '西安', tz: 'CST', offset: 8 },
        { name: '昆明', tz: 'CST', offset: 8 },
        { name: '三亚', tz: 'CST', offset: 8 },
        { name: '拉萨', tz: 'CST', offset: 8 },
        { name: '乌鲁木齐', tz: 'CST', offset: 6 },
      ],
    },
    {
      name: '东亚',
      cities: [
        { name: '东京', tz: 'JST', offset: 9 },
        { name: '大阪', tz: 'JST', offset: 9 },
        { name: '首尔', tz: 'KST', offset: 9 },
        { name: '釜山', tz: 'KST', offset: 9 },
        { name: '台北', tz: 'CST', offset: 8 },
        { name: '新加坡', tz: 'SGT', offset: 8 },
        { name: '吉隆坡', tz: 'MYT', offset: 8 },
        { name: '马尼拉', tz: 'PHT', offset: 8 },
        { name: '雅加达', tz: 'WIB', offset: 7 },
      ],
    },
    {
      name: '东南亚·南亚',
      cities: [
        { name: '曼谷', tz: 'ICT', offset: 7 },
        { name: '清迈', tz: 'ICT', offset: 7 },
        { name: '普吉岛', tz: 'ICT', offset: 7 },
        { name: '河内', tz: 'ICT', offset: 7 },
        { name: '胡志明市', tz: 'ICT', offset: 7 },
        { name: '巴厘岛', tz: 'WITA', offset: 8 },
        { name: '马尔代夫', tz: 'MVT', offset: 5 },
        { name: '新德里', tz: 'IST', offset: 5.5 },
        { name: '孟买', tz: 'IST', offset: 5.5 },
        { name: '科伦坡', tz: 'IST', offset: 5.5 },
      ],
    },
    {
      name: '中东·非洲',
      cities: [
        { name: '迪拜', tz: 'GST', offset: 4 },
        { name: '阿布扎比', tz: 'GST', offset: 4 },
        { name: '多哈', tz: 'AST', offset: 3 },
        { name: '伊斯坦布尔', tz: 'TRT', offset: 3 },
        { name: '开罗', tz: 'EET', offset: 2 },
        { name: '开普敦', tz: 'SAST', offset: 2 },
        { name: '约翰内斯堡', tz: 'SAST', offset: 2 },
        { name: '内罗毕', tz: 'EAT', offset: 3 },
        { name: '卡萨布兰卡', tz: 'WET', offset: 0 },
        { name: '毛里求斯', tz: 'MUT', offset: 4 },
      ],
    },
    {
      name: '欧洲',
      cities: [
        { name: '伦敦', tz: 'GMT', offset: 0 },
        { name: '巴黎', tz: 'CET', offset: 1 },
        { name: '柏林', tz: 'CET', offset: 1 },
        { name: '罗马', tz: 'CET', offset: 1 },
        { name: '马德里', tz: 'CET', offset: 1 },
        { name: '巴塞罗那', tz: 'CET', offset: 1 },
        { name: '阿姆斯特丹', tz: 'CET', offset: 1 },
        { name: '苏黎世', tz: 'CET', offset: 1 },
        { name: '维也纳', tz: 'CET', offset: 1 },
        { name: '布拉格', tz: 'CET', offset: 1 },
        { name: '莫斯科', tz: 'MSK', offset: 3 },
        { name: '圣彼得堡', tz: 'MSK', offset: 3 },
        { name: '雅典', tz: 'EET', offset: 2 },
        { name: '雷克雅未克', tz: 'GMT', offset: 0 },
        { name: '里斯本', tz: 'WET', offset: 0 },
      ],
    },
    {
      name: '北美',
      cities: [
        { name: '纽约', tz: 'EST', offset: -5 },
        { name: '洛杉矶', tz: 'PST', offset: -8 },
        { name: '旧金山', tz: 'PST', offset: -8 },
        { name: '芝加哥', tz: 'CST', offset: -6 },
        { name: '波士顿', tz: 'EST', offset: -5 },
        { name: '华盛顿', tz: 'EST', offset: -5 },
        { name: '迈阿密', tz: 'EST', offset: -5 },
        { name: '拉斯维加斯', tz: 'PST', offset: -8 },
        { name: '西雅图', tz: 'PST', offset: -8 },
        { name: '多伦多', tz: 'EST', offset: -5 },
        { name: '温哥华', tz: 'PST', offset: -8 },
        { name: '蒙特利尔', tz: 'EST', offset: -5 },
        { name: '墨西哥城', tz: 'CST', offset: -6 },
        { name: '坎昆', tz: 'EST', offset: -5 },
      ],
    },
    {
      name: '大洋洲',
      cities: [
        { name: '悉尼', tz: 'AEDT', offset: 11 },
        { name: '墨尔本', tz: 'AEDT', offset: 11 },
        { name: '布里斯班', tz: 'AEST', offset: 10 },
        { name: '珀斯', tz: 'AWST', offset: 8 },
        { name: '奥克兰', tz: 'NZDT', offset: 13 },
        { name: '斐济', tz: 'FJT', offset: 12 },
        { name: '黄金海岸', tz: 'AEST', offset: 10 },
      ],
    },
    {
      name: '南美',
      cities: [
        { name: '圣保罗', tz: 'BRT', offset: -3 },
        { name: '里约', tz: 'BRT', offset: -3 },
        { name: '布宜诺斯', tz: 'ART', offset: -3 },
        { name: '圣地亚哥', tz: 'CLT', offset: -4 },
        { name: '利马', tz: 'PET', offset: -5 },
        { name: '波哥大', tz: 'COT', offset: -5 },
      ],
    },
  ];

  const allCities = regions.flatMap(r => r.cities);

  const [originIdx, setOriginIdx] = useState(0);
  const [destIdx, setDestIdx] = useState(allCities.findIndex(c => c.name === '伦敦'));
  const [originRegion, setOriginRegion] = useState(0);
  const [destRegion, setDestRegion] = useState(regions.findIndex(r => r.cities.some(c => c.name === '伦敦')));

  const [days, setDays] = useState(3);
  const [bedHour, setBedHour] = useState(23);
  const [bedMin, setBedMin] = useState(0);
  const [wakeHour, setWakeHour] = useState(7);
  const [wakeMin, setWakeMin] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);

  const origin = allCities[originIdx];
  const dest = allCities[destIdx];
  const diff = dest.offset - origin.offset;

  const padTime = (h: number, m: number) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  const handleGenerate = () => {
    setGenerating(true);
    setPlanGenerated(false);
    setAddedDays(new Set());
    setTimeout(() => {
      setGenerating(false);
      setPlanGenerated(true);
    }, 1500);
  };

  const addWakeAlarm = (day: number, time: string) => {
    const label = diff === 0 ? dest.name : `${dest.name} D${day}`;
    const newAlarm: Alarm = {
      id: Date.now() + day,
      time,
      label,
      active: true,
      repeat: [1,1,1,1,1,1,1],
    };
    setAlarms([...alarms.filter(a => a.label !== label), newAlarm]);
    setAddedDays(prev => new Set(prev).add(day));
  };

  const planDays = diff !== 0
    ? Array.from({ length: days }, (_, i) => {
        const progress = (i + 1) / days;
        const shiftH = Math.round(diff * progress);
        let wakeOriginH = wakeHour - shiftH;
        let bedOriginH = bedHour - shiftH;
        let wakeDestH = wakeHour - Math.round(diff * (1 - progress));
        if (wakeOriginH < 0) wakeOriginH += 24;
        if (wakeOriginH >= 24) wakeOriginH -= 24;
        if (bedOriginH < 0) bedOriginH += 24;
        if (bedOriginH >= 24) bedOriginH -= 24;
        if (wakeDestH < 0) wakeDestH += 24;
        if (wakeDestH >= 24) wakeDestH -= 24;
        const remainShift = Math.round(diff * (1 - (i + 0.5) / days));
        return {
          day: i + 1,
          wakeDest: padTime(wakeDestH, wakeMin),
          sleepOrigin: padTime(bedOriginH, bedMin),
          wakeOrigin: padTime(wakeOriginH, wakeMin),
          shiftH: Math.abs(remainShift),
          dir: diff > 0 ? '延后' : '提前',
          intensity: 40 + i * 15,
        };
      })
    : [{ day: 1, wakeDest: padTime(wakeHour, wakeMin), sleepOrigin: padTime(bedHour, bedMin), wakeOrigin: padTime(wakeHour, wakeMin), shiftH: 0, dir: '无需', intensity: 60 }];

  const [pickerOpen, setPickerOpen] = useState<'origin' | 'dest' | null>(null);
  const [search, setSearch] = useState('');

  const filteredRegions = search
    ? regions.map(r => ({
        ...r,
        cities: r.cities.filter(c => c.name.includes(search) || r.name.includes(search)),
      })).filter(r => r.cities.length > 0)
    : regions;

  const selectAndClose = (cityIdx: number, which: 'origin' | 'dest') => {
    if (which === 'origin') { setOriginIdx(cityIdx); setOriginRegion(regions.findIndex(r => r.cities.some(c => allCities.indexOf(c) === cityIdx))); }
    else { setDestIdx(cityIdx); setDestRegion(regions.findIndex(r => r.cities.some(c => allCities.indexOf(c) === cityIdx))); }
    setPickerOpen(null);
    setSearch('');
    setPlanGenerated(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex flex-col overflow-y-auto no-scrollbar space-y-6 px-4 py-4 h-[60vh] pb-8"
    >
      {/* City selectors */}
      <div className="flex flex-col space-y-3">
        {([
          { which: 'origin' as const, label: '出发地', city: origin },
          { which: 'dest' as const, label: '目的地', city: dest },
        ]).map((s, si) => (
          <div key={si}>
            {si === 1 && (
              <div className="flex justify-center pb-2">
                <div className="w-px h-5 bg-gradient-to-b from-white/10 via-white/30 to-white/10" />
              </div>
            )}
            <p className="text-[10px] tracking-[0.4em] text-white/50 font-light uppercase mb-1.5">{s.label}</p>
            <button
              onClick={() => { setPickerOpen(s.which); setSearch(''); }}
              className="w-full flex items-center justify-between px-3 py-3 border border-white/10 bg-transparent hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-white text-sm font-light tracking-wider">{s.city.name}</span>
              <span className="text-white/30 text-xs tracking-wider">{s.city.tz}</span>
            </button>
          </div>
        ))}
      </div>

      {/* City picker modal */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          >
            <div className="px-4 pt-12 pb-4 flex items-center space-x-3">
              <button onClick={() => { setPickerOpen(null); setSearch(''); }} className="text-white/60 hover:text-white text-sm tracking-wider font-light">取消</button>
              <div className="flex-1 relative">
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索城市…"
                  className="w-full bg-white/[0.06] border border-white/10 rounded px-3 py-2 text-white text-sm font-light tracking-wider outline-none placeholder:text-white/20"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              {filteredRegions.map((r, ri) => (
                <div key={ri} className="mb-5">
                  <p className="text-[10px] tracking-[0.3em] text-white/30 font-light uppercase mb-2">{r.name}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {r.cities.map((c) => {
                      const idx = allCities.indexOf(c);
                      const localRegIdx = regions.findIndex(rr => rr.cities.some(cc => allCities.indexOf(cc) === idx));
                      const isSelected = pickerOpen === 'origin' ? idx === originIdx : idx === destIdx;
                      return (
                        <button
                          key={c.name}
                          onClick={() => selectAndClose(idx, pickerOpen!)}
                          className={`text-left px-3 py-2.5 border transition-all ${
                            isSelected ? 'border-white/30 bg-white/10' : 'border-white/[0.06] hover:border-white/20'
                          }`}
                        >
                          <span className="text-white text-xs font-light tracking-wider">{c.name}</span>
                          <span className="text-white/30 text-[10px] tracking-wider ml-2">{c.tz}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sleep schedule */}
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="space-y-2">
          <p className="text-[9px] tracking-[0.3em] text-white/30 font-light uppercase">{origin.tz} 入睡</p>
          <div className="flex items-baseline space-x-1">
            <select value={bedHour} onChange={e => { setBedHour(+e.target.value); setPlanGenerated(false); }}
              className="bg-transparent text-white text-xl font-light tracking-wider outline-none appearance-none cursor-pointer [color-scheme:dark]">
              {Array.from({length:24}, (_,i) => <option key={i} value={i} className="bg-[#0a0a12]">{i.toString().padStart(2,'0')}</option>)}
            </select>
            <span className="text-white/30 text-lg">:</span>
            <select value={bedMin} onChange={e => { setBedMin(+e.target.value); setPlanGenerated(false); }}
              className="bg-transparent text-white text-xl font-light tracking-wider outline-none appearance-none cursor-pointer [color-scheme:dark]">
              {[0,30].map(m => <option key={m} value={m} className="bg-[#0a0a12]">{m.toString().padStart(2,'0')}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[9px] tracking-[0.3em] text-white/30 font-light uppercase">{origin.tz} 起床</p>
          <div className="flex items-baseline space-x-1">
            <select value={wakeHour} onChange={e => { setWakeHour(+e.target.value); setPlanGenerated(false); }}
              className="bg-transparent text-white text-xl font-light tracking-wider outline-none appearance-none cursor-pointer [color-scheme:dark]">
              {Array.from({length:24}, (_,i) => <option key={i} value={i} className="bg-[#0a0a12]">{i.toString().padStart(2,'0')}</option>)}
            </select>
            <span className="text-white/30 text-lg">:</span>
            <select value={wakeMin} onChange={e => { setWakeMin(+e.target.value); setPlanGenerated(false); }}
              className="bg-transparent text-white text-xl font-light tracking-wider outline-none appearance-none cursor-pointer [color-scheme:dark]">
              {[0,30].map(m => <option key={m} value={m} className="bg-[#0a0a12]">{m.toString().padStart(2,'0')}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Time diff indicator */}
      <div className="flex items-center justify-between px-2 py-3 border-y border-white/10">
        <div className="text-[12px] tracking-wider text-white/60 font-light">
          时差 <span className="text-white">{diff >= 0 ? '+' : ''}{diff}h</span>
        </div>
        <div className="text-[11px] tracking-wider text-white/30 font-extralight">
          {origin.tz} → {dest.tz}
        </div>
      </div>

      {/* Days slider */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[11px] tracking-[0.3em] text-white/50 font-light uppercase">适应周期</p>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="1" max="7"
            value={days}
            onChange={(e) => { setDays(parseInt(e.target.value)); setPlanGenerated(false); }}
            className="w-24 h-[1px] bg-white/20 appearance-none outline-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.6)]"
          />
          <span className="text-sm text-white/80 font-light w-8 text-right">{days}<span className="text-[10px] text-white/30 ml-0.5">天</span></span>
        </div>
      </div>

      {/* Generate button */}
      <button 
        onClick={handleGenerate}
        disabled={generating}
        className={`w-full py-3 text-center text-[12px] tracking-[0.4em] font-light uppercase transition-all border outline-none ${
          planGenerated ? 'border-white/20 text-white/60' : generating ? 'border-white/10 text-white/40' : 'border-white/20 text-white hover:bg-white/5'
        }`}
      >
        {generating ? '生成中…' : planGenerated ? '重新生成' : '生成适配计划'}
      </button>

      {/* Plan result */}
      <AnimatePresence>
        {planGenerated && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 border border-white/10 bg-white/[0.03] p-4"
          >
            <h4 className="text-[11px] tracking-[0.3em] text-white/70 font-light uppercase mb-3">
              光照 + 睡眠计划
            </h4>
            <div className="flex items-center justify-between py-2 px-3 bg-white/[0.04] border border-white/5">
              <span className="text-[10px] text-white/40 tracking-wider font-extralight">目标 · {dest.tz}</span>
              <span className="text-sm text-white/80 font-light tracking-widest">睡 {padTime(bedHour, bedMin)} → 起 {padTime(wakeHour, wakeMin)}</span>
            </div>
            <div className="space-y-3">
              {planDays.map((d, i) => {
                const isAdded = addedDays.has(d.day);
                return (
                <div key={i} className="flex items-start space-x-3">
                  <div className={`mt-0.5 w-1 h-1 rounded-full shrink-0 transition-colors ${isAdded ? 'bg-white' : 'bg-white/50'}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <p className="text-[11px] text-white/80 font-light tracking-wider">第 {d.day} 天</p>
                      <button
                        onClick={() => addWakeAlarm(d.day, d.wakeDest)}
                        className={`text-[11px] font-light tracking-wider transition-all ${isAdded ? 'text-white/40 cursor-default' : 'text-white/60 hover:text-white cursor-pointer'}`}
                        disabled={isAdded}
                      >
                        闹钟 {d.wakeDest} {dest.tz} {isAdded ? '✓' : '+'}
                      </button>
                    </div>
                    <p className="text-[9px] text-white/30 tracking-widest font-extralight mt-1">
                      睡 {d.sleepOrigin} {origin.tz} · {d.dir}{d.shiftH}h · 光照 {d.intensity}%
                    </p>
                  </div>
                </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

