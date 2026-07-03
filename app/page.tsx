'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Battery, BatteryMedium, BatteryLow, Moon } from 'lucide-react';

type Mode = 'off' | 'mindfulness' | 'resonance' | '478';
type Tab = 'therapy' | 'alarms' | 'jetlag';

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [activeMode, setActiveMode] = useState<Mode>('off');
  const [timerDuration, setTimerDuration] = useState(30);
  const [activeTab, setActiveTab] = useState<Tab>('therapy');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [scalePulse, setScalePulse] = useState(1);
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
    }, 3000);
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
                      className="h-16 md:h-20 w-auto mx-auto opacity-100"
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
                      className="absolute inset-4 rounded-full bg-transparent border-[0.5px] border-white/10 overflow-hidden flex items-center justify-center backdrop-blur-sm"
                      animate={{ 
                        scale: isConnecting ? [0.98, 1.02, 0.98] : 1,
                        borderColor: isConnecting ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.2)'] : 'rgba(255,255,255,0.15)'
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Moon className={`w-7 h-7 transition-all duration-1000 ${isConnecting ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-white/60 group-hover:text-white'}`} strokeWidth={0.5} />
                    </motion.div>

                    <div className="absolute -bottom-12 flex flex-col items-center justify-center">
                      <span className={`text-sm tracking-[0.3em] uppercase font-normal transition-colors duration-1000 ${isConnecting ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]' : 'text-white/70 group-hover:text-white'}`}>
                        {isConnecting ? '唤醒中' : '触碰以连接'}
                      </span>
                    </div>
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="app"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.5, delay: 0.2 }}
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
                  {activeTab === 'alarms' && <AlarmsView />}
                  {activeTab === 'jetlag' && <JetLagView />}
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
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    ctx.scale(dpr, dpr);
    let width = cssWidth;
    let height = cssHeight;

    const numParticles = 80000;
    const particles = new Float32Array(numParticles * 2);
    const noise = new Float32Array(numParticles * 2);
    for (let i = 0; i < numParticles * 2; i++) {
       particles[i] = Math.random();
    }
    let noiseIdx = 0;

    const fillNoise = () => {
      for (let i = 0; i < numParticles * 2; i++) {
        noise[i] = (Math.random() - 0.5) * 2;
      }
      noiseIdx = 0;
    };
    fillNoise();

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
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }, 200);
    };
    window.addEventListener('resize', handleResize);

    const render = (time: number) => {
      const dt = Math.min(time - lastTime, 50);
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
      ctx.fillStyle = `rgba(3, 3, 5, ${0.08 + (1 - currentBreathValue) * 0.12})`; 
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';
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

      const vibration = targetMode === 'off' ? 0.001 : 0.001 + currentBreathValue * 0.008;
      const stepSize = 0.001 * fpsRatio;

      ctx.beginPath();
      for (let i = 0; i < numParticles; i++) {
        let x = particles[i*2];
        let y = particles[i*2 + 1];

        // Brownian noise from precomputed buffer
        x += noise[noiseIdx] * vibration * fpsRatio;
        y += noise[noiseIdx + 1] * vibration * fpsRatio;
        noiseIdx += 2;
        if (noiseIdx >= numParticles * 2) {
          fillNoise();
        }

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
          const force = breathDerivative * -0.5;
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

        x -= f * dfdx * stepSize;
        y -= f * dfdy * stepSize;

        particles[i*2] = x;
        particles[i*2+1] = y;

        const screenX = offsetX + x * size;
        const screenY = offsetY + y * size;
        
        ctx.moveTo(screenX + 1.4, screenY);
        ctx.arc(screenX, screenY, 1.4, 0, Math.PI * 2);
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
            if (val !== timerDuration) triggerHaptic('light');
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

function AlarmsView() {
  const [alarms, setAlarms] = useState([
    { id: 1, time: '07:00', label: '晨间唤醒', active: true, repeat: '工作日' },
    { id: 2, time: '08:30', label: '周末赖床', active: false, repeat: '周末' },
  ]);

  const addAlarm = () => {
    const newAlarm = {
      id: Date.now(),
      time: '06:00',
      label: '新唤醒',
      active: true,
      repeat: '单次'
    };
    setAlarms([...alarms, newAlarm]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="flex flex-col space-y-6 h-full justify-center px-4"
    >
      <div className="flex flex-col space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pb-10">
        {alarms.map(alarm => (
          <button 
            key={alarm.id}
            onClick={() => setAlarms(alarms.map(a => a.id === alarm.id ? { ...a, active: !a.active } : a))}
            className={`relative text-left transition-all duration-1000 py-6 border-b outline-none ${alarm.active ? 'border-white/20' : 'border-white/10 hover:border-white/30'}`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className={`font-display transition-all duration-1000 tracking-widest ${alarm.active ? 'text-3xl text-white font-light drop-shadow-md' : 'text-3xl text-white/60 font-extralight'}`}>
                  {alarm.time}
                </h2>
                <div className="flex space-x-3 items-center">
                  <p className={`text-[11px] tracking-[0.4em] font-extralight ${alarm.active ? 'text-white/80' : 'text-white/40'}`}>
                    {alarm.label}
                  </p>
                  <p className={`text-[10px] tracking-[0.2em] font-extralight ${alarm.active ? 'text-white/60' : 'text-white/30'}`}>
                    {alarm.repeat}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <motion.div 
                  layout
                  className={`w-1 h-1 rounded-full ${alarm.active ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/20'}`}
                  animate={{ scale: alarm.active ? [1, 1.5, 1] : 1 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      <button 
        onClick={addAlarm}
        className="mt-4 self-start flex items-center space-x-3 text-white/50 hover:text-white transition-all duration-700 outline-none"
      >
        <span className="text-sm font-extralight pb-0.5">+</span>
        <span className="text-[11px] tracking-[0.4em] uppercase font-light">添加唤醒</span>
      </button>
    </motion.div>
  );
}

function JetLagView() {
  const [generating, setGenerating] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setPlanGenerated(true);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex flex-col h-full overflow-y-auto no-scrollbar space-y-12 px-4 py-8 max-h-[70vh]"
    >
      <div className="flex flex-col space-y-10">
        <div className="flex items-end justify-between border-b border-white/10 pb-4">
          <div className="space-y-2">
            <p className="text-[12px] tracking-[0.5em] text-white/80 font-light uppercase">当前所在</p>
            <h3 className="text-2xl font-display font-light text-white/90 tracking-widest drop-shadow-sm">北京</h3>
          </div>
          <span className="text-[12px] tracking-widest text-white/60 font-light">CST</span>
        </div>
        
        <div className="relative py-2 flex items-center justify-center">
          <div className="absolute w-[1px] h-12 bg-gradient-to-b from-white/0 via-white/20 to-white/0" />
          <motion.div 
            className="bg-[#030305] px-3 py-1 text-[12px] tracking-[0.4em] text-white/90 font-light z-10"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            调整中
          </motion.div>
        </div>

        <div className="flex items-end justify-between border-b border-white/20 pb-4">
          <div className="space-y-2">
            <p className="text-[12px] tracking-[0.5em] text-white/80 font-light uppercase">目的地</p>
            <h3 className="text-2xl font-display font-light text-white tracking-widest drop-shadow-md">伦敦</h3>
          </div>
          <span className="text-[12px] tracking-widest text-white/80 font-light">GMT</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-8">
        <div className="space-y-1">
          <p className="text-[12px] tracking-[0.4em] uppercase text-white/80 font-light">周期</p>
          <p className="text-lg font-light text-white">3 <span className="text-[12px] text-white/80">DAY</span></p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={generating || planGenerated}
          className={`text-[12px] tracking-[0.5em] font-light transition-colors uppercase outline-none border-b pb-1 ${planGenerated ? 'text-white border-white/50' : 'text-white/80 hover:text-white border-white/20'}`}
        >
          {generating ? '生成中...' : planGenerated ? '计划已生成' : '生成计划'}
        </button>
      </div>

      <AnimatePresence>
        {planGenerated && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 border border-white/10 bg-white/5 rounded-sm"
          >
            <h4 className="text-[12px] tracking-[0.2em] font-light text-white/90 mb-2">已为你配置:</h4>
            <ul className="space-y-2 text-[10px] text-white/70 tracking-widest font-extralight">
              <li>• 第 1 天：延后睡眠 1 小时，配合深眠 4-7-8 频率。</li>
              <li>• 第 2 天：晨间加强蓝光共振 15 分钟。</li>
              <li>• 第 3 天：完全同步伦敦作息。</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

