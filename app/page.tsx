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
  const [connState, setConnState] = useState<'idle' | 'connecting' | 'failed' | 'connected'>('idle');
  const [connProgress, setConnProgress] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [activeMode, setActiveMode] = useState<Mode>('off');
  const [timerDuration, setTimerDuration] = useState(30);
    const [activeTab, setActiveTab] = useState<Tab>('therapy');
    const [panelTab, setPanelTab] = useState<Tab | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scalePulse, setScalePulse] = useState(1);

    // Track which section is visible (after connected)
    useEffect(() => {
      if (connState !== 'connected') return;
      const el = scrollRef.current;
      if (!el) return;
      const sections = el.querySelectorAll('.snap-section');
      const tabs: Tab[] = ['therapy', 'alarms', 'jetlag'];
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible.length > 0) {
            const idx = Array.from(sections).indexOf(visible[0].target as Element);
            if (idx >= 0 && idx < tabs.length) setActiveTab(tabs[idx]);
          }
        },
        { threshold: 0.5 }
      );
      sections.forEach(s => observer.observe(s));
      return () => observer.disconnect();
    }, [connState]);

    const scrollToTab = (tab: Tab) => {
      const el = scrollRef.current;
      if (!el) return;
      const tabs: Tab[] = ['therapy', 'alarms', 'jetlag'];
      const idx = tabs.indexOf(tab);
      setActiveTab(tab);
      el.scrollTo({ top: idx * el.clientHeight, behavior: 'smooth' });
    };
  const connTimer = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const startConnect = () => {
    setConnState('connecting');
    setConnProgress(0);
    connTimer.current = setInterval(() => {
      setConnProgress(p => {
        const next = p + 3;
        if (next >= 100) {
          clearInterval(connTimer.current!);
          return 100;
        }
        return next;
      });
    }, 100);
    setTimeout(() => {
      if (connTimer.current) clearInterval(connTimer.current);
      setConnProgress(100);
      setConnState('failed');
    }, 3500);
  };

  const retryConnect = () => {
    setConnState('connecting');
    setConnProgress(0);
    connTimer.current = setInterval(() => {
      setConnProgress(p => {
        const next = p + 3;
        if (next >= 100) {
          clearInterval(connTimer.current!);
          return 100;
        }
        return next;
      });
    }, 100);
    setTimeout(() => {
      if (connTimer.current) clearInterval(connTimer.current);
      setConnProgress(100);
      setConnState('connected');
    }, 3500);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (connTimer.current) clearInterval(connTimer.current); };
  }, []);

  return (
    <motion.div 
      animate={{ scale: scalePulse }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="relative w-full h-[100dvh] flex flex-col font-sans overflow-hidden bg-[#030305] text-white selection:bg-white/20"
    >
      <ChladniBackground mode={activeMode} isConnected={connState === 'connected'} />
      
      {/* Background blur when not in therapy */}
      {activeTab !== 'therapy' && (
        <div className="absolute inset-0 z-[5] backdrop-blur-sm bg-black/10 pointer-events-none transition-opacity duration-500" />
      )}
      
      <div className="absolute inset-0 flex flex-col z-10">
        {/* Top Status Bar */}
        <header className="relative w-full px-8 py-8 flex justify-between items-center pointer-events-none">
          <div className="flex items-center space-x-3">
            <motion.div 
              className={`w-1 h-1 rounded-full ${connState === 'connected' ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : connState === 'connecting' ? 'bg-white/60' : 'bg-white/20'}`}
              animate={{ opacity: connState === 'connected' ? [0.3, 1, 0.3] : connState === 'connecting' ? [0.5, 1, 0.5] : 1 }}
              transition={{ duration: connState === 'connecting' ? 1 : 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[12px] tracking-[0.4em] uppercase font-light text-white/90 drop-shadow-md">
              {connState === 'connected' ? 'Dreamlight 已连接' : connState === 'connecting' ? 'Dreamlight 连接中…' : 'Dreamlight 待命'}
            </span>
          </div>
          {connState === 'connected' && (
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

        {/* Main Content */}
        <main className="relative flex-1 flex flex-col justify-center px-8 pb-24">
          {connState !== 'connected' ? (
            <div className="flex flex-col items-center justify-center space-y-10">
              {/* Logo */}
              <div className="text-center space-y-6">
                <img src="logo.png" alt="Dreamlight" className="h-12 md:h-16 w-auto mx-auto drop-shadow-sm opacity-90" />
                <p className="text-[12px] tracking-[0.6em] uppercase text-white/60 font-light drop-shadow-md">沉浸式声光共振</p>
              </div>

              {/* Idle: connect button */}
              {connState === 'idle' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center space-y-10">
                  <button onClick={startConnect} className="group relative flex items-center justify-center w-48 h-48 outline-none cursor-pointer">
                    <motion.div className="absolute inset-2 rounded-full border border-white/10" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
                    <motion.div className="absolute inset-6 rounded-full border border-white/[0.06]" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
                    <div className="absolute inset-8 rounded-full bg-white/[0.03] border border-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/[0.06] transition-all duration-700">
                      <Moon className="w-6 h-6 text-white/60 group-hover:text-white/90 transition-all duration-500" strokeWidth={0.5} />
                    </div>
                  </button>
                  <span className="text-lg tracking-[0.3em] uppercase font-medium text-white/70">连接设备</span>
                </motion.div>
              )}

              {/* Connecting: animated ring progress */}
              {connState === 'connecting' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center space-y-8">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                      <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                      <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 * (1 - connProgress / 100)} />
                    </svg>
                    <Moon className="absolute w-6 h-6 text-white/50" strokeWidth={0.5} />
                  </div>
                  <p className="text-base text-white/50 font-light tracking-wider">正在搜索设备</p>
                </motion.div>
              )}

              {/* Failed: modal overlay */}
              {connState === 'failed' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="w-full max-w-xs flex flex-col items-center space-y-8 text-center"
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 rounded-full border border-white/15 flex items-center justify-center">
                        <Moon className="w-6 h-6 text-white/40" strokeWidth={0.5} />
                      </div>
                      <p className="text-lg text-white/60 font-light tracking-wider">连接失败</p>
                      <p className="text-xs text-white/30 font-extralight tracking-wider">请按以下步骤操作后重试</p>
                    </div>

                    <div className="w-full space-y-4">
                      {[
                        { step: '1', text: '长按眼罩侧边按钮 3 秒开机' },
                        { step: '2', text: '确认指示灯为蓝色慢闪' },
                        { step: '3', text: '将眼罩靠近手机 10cm 以内' },
                      ].map((s) => (
                        <div key={s.step} className="flex items-center space-x-4">
                          <span className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center text-[11px] text-white/40 font-light shrink-0">{s.step}</span>
                          <span className="text-sm text-white/50 font-extralight tracking-wider">{s.text}</span>
                        </div>
                      ))}
                    </div>

                    <motion.button
                      onClick={retryConnect}
                      className="w-full py-4 border border-white/20 text-white/70 hover:text-white hover:border-white/30 transition-all cursor-pointer"
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="text-sm tracking-wider font-light">我已打开设备蓝牙 点我连接</span>
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 top-[72px] flex">
              {/* Left indicator dots */}
              <nav className="w-14 shrink-0 flex flex-col items-center justify-center space-y-8 border-r border-white/[0.04]">
                {[
                  { id: 'therapy' as Tab, label: '光疗' },
                  { id: 'alarms' as Tab, label: '唤醒' },
                  { id: 'jetlag' as Tab, label: '时差' },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => scrollToTab(tab.id)}
                      className="flex flex-col items-center space-y-1"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]' : 'bg-white/30'}`} />
                      <span className={`text-[10px] tracking-[0.3em] uppercase font-light transition-colors ${isActive ? 'text-white' : 'text-white/50 hover:text-white/80'}`}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Scrollable vertical pages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
              >
                <div className="snap-section snap-start h-full flex flex-col justify-center px-4">
                  <TherapyView activeMode={activeMode} setActiveMode={setActiveMode} timerDuration={timerDuration} setTimerDuration={setTimerDuration} triggerHaptic={triggerHaptic} />
                </div>
                <div className="snap-section snap-start h-full overflow-y-auto no-scrollbar">
                  <div className="min-h-full px-5 py-8">
                    <AlarmsView alarms={alarms} setAlarms={setAlarms} />
                  </div>
                </div>
                <div className="snap-section snap-start h-full overflow-y-auto no-scrollbar">
                  <div className="min-h-full px-5 py-8">
                    <JetLagView alarms={alarms} setAlarms={setAlarms} setActiveTab={setActiveTab} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </motion.div>
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
    { duration: 5, start: 0, end: 1 },
    { duration: 5, start: 1, end: 0 }
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

  const nightColors = [
    { r: 15, g: 20, b: 80 },   // deep sapphire
    { r: 40, g: 10, b: 70 },   // royal purple
    { r: 10, g: 50, b: 70 },   // deep ocean
    { r: 50, g: 15, b: 50 },   // plum night
    { r: 10, g: 35, b: 60 },   // midnight teal
    { r: 30, g: 10, b: 60 },   // indigo
    { r: 20, g: 40, b: 80 },   // twilight blue
    { r: 50, g: 20, b: 60 },   // dark orchid
    { r: 10, g: 45, b: 55 },   // deep cyan-night
    { r: 35, g: 15, b: 55 },   // dark violet
    { r: 15, g: 55, b: 60 },   // teal dusk
    { r: 45, g: 25, b: 65 },   // amethyst
    { r: 60, g: 25, b: 15 },   // deep mahogany
    { r: 50, g: 35, b: 10 },   // dark amber
    { r: 15, g: 40, b: 30 },   // forest night
    { r: 55, g: 15, b: 35 },   // dark crimson
    { r: 20, g: 30, b: 50 },   // slate blue
    { r: 40, g: 40, b: 15 },   // dark olive
    { r: 60, g: 10, b: 30 },   // deep rose
    { r: 10, g: 25, b: 45 },   // navy dusk
  ];

  const particleColors = [
    { r: 80, g: 120, b: 255 },  // blue
    { r: 160, g: 80, b: 255 },  // purple
    { r: 40, g: 200, b: 180 },  // teal
    { r: 255, g: 80, b: 180 },  // pink
    { r: 100, g: 100, b: 255 }, // periwinkle
    { r: 80, g: 180, b: 255 },  // sky
    { r: 220, g: 100, b: 255 }, // orchid
    { r: 60, g: 200, b: 220 },  // cyan
    { r: 255, g: 120, b: 80 },  // coral
    { r: 180, g: 80, b: 255 },  // violet
  ];

  const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
  const colorRef = useRef({ bg1: pick(nightColors), bg2: pick(nightColors), pCol: pick(particleColors) });

  useEffect(() => {
    modeRef.current = mode;
    isConnectedRef.current = isConnected;
  }, [mode, isConnected]);

  // Randomize colors on mode change
  useEffect(() => {
    colorRef.current = {
      bg1: pick(nightColors),
      bg2: pick(nightColors),
      pCol: pick(particleColors),
    };
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    const setCanvasSize = () => {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setCanvasSize();

    const numParticles = 40000;
    const particles = new Float32Array(numParticles * 2);
    for (let i = 0; i < numParticles * 2; i++) {
       particles[i] = Math.random();
    }

    const modeConfigs: Record<Mode, { n: number, m: number }> = {
      off: { n: 2, m: 3 },
      mindfulness: { n: 4, m: 5 },
      resonance: { n: 7, m: 2 },
      '478': { n: 5, m: 5 },
    };

    let currentN = modeConfigs['off'].n;
    let currentM = modeConfigs['off'].m;
    let lastTime = performance.now();

    let phaseIndex = 0;
    let phaseTimeMs = 0;
    let currentBreathValue = 0;
    let bgPhase = 0;

    let resizeTimer: any;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        width = window.innerWidth;
        height = window.innerHeight;
        setCanvasSize();
      }, 200);
    };
    window.addEventListener('resize', handleResize);

    const render = (time: number) => {
      const dt = Math.min(time - lastTime, 50);
      lastTime = time;
      const fpsRatio = dt / (1000 / 60);

      const targetMode = isConnectedRef.current ? modeRef.current : 'off';
      const target = modeConfigs[targetMode];
      
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
      
      currentBreathValue += (targetBreathValue - currentBreathValue) * 0.1 * fpsRatio;
      bgPhase += dt * 0.0005;

      currentN += (target.n - currentN) * 0.01 * fpsRatio;
      currentM += (target.m - currentM) * 0.01 * fpsRatio;

      // Flowing gradient background
      const gx1 = width * (0.3 + Math.sin(bgPhase) * 0.3);
      const gy1 = height * (0.3 + Math.cos(bgPhase * 0.7) * 0.3);
      const gx2 = width * (0.7 + Math.cos(bgPhase * 0.8) * 0.3);
      const gy2 = height * (0.7 + Math.sin(bgPhase * 0.6) * 0.3);
      
      ctx.globalCompositeOperation = 'source-over';
      const bgGrad = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
      const c = colorRef.current;
      const breathShift = 0.5 + (currentBreathValue - 0.5) * 0.3;
      const midR = Math.floor(c.bg1.r + (c.bg2.r - c.bg1.r) * breathShift);
      const midG = Math.floor(c.bg1.g + (c.bg2.g - c.bg1.g) * breathShift);
      const midB = Math.floor(c.bg1.b + (c.bg2.b - c.bg1.b) * breathShift);
      const alpha = 0.85 + currentBreathValue * 0.15;
      bgGrad.addColorStop(0, `rgba(${c.bg1.r}, ${c.bg1.g}, ${c.bg1.b}, ${alpha})`);
      bgGrad.addColorStop(breathShift, `rgba(${midR}, ${midG}, ${midB}, ${alpha})`);
      bgGrad.addColorStop(1, `rgba(${c.bg2.r}, ${c.bg2.g}, ${c.bg2.b}, ${alpha})`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Dark fade for particle trail
      ctx.fillStyle = `rgba(4, 4, 15, ${0.10 + (1 - currentBreathValue) * 0.10})`;
      ctx.fillRect(0, 0, width, height);

      // Particles with random color
      ctx.globalCompositeOperation = 'screen';
      const intensity = 0.5 + currentBreathValue * 0.3;
      ctx.fillStyle = `rgba(${c.pCol.r}, ${c.pCol.g}, ${c.pCol.b}, ${intensity})`;

      const targetT = currentBreathValue * (Math.PI / 2);
      const a = Math.cos(targetT);
      const b = Math.sin(targetT);
      
      const scaleFactor = 1.0 + currentBreathValue * 0.15;
      const size = Math.max(width, height) * scaleFactor;
      const offsetX = (width - size) / 2;
      const offsetY = (height - size) / 2;

      const vibration = targetMode === 'off' ? 0.001 : 0.001 + currentBreathValue * 0.006;
      const stepSize = 0.001 * fpsRatio;

      ctx.beginPath();
      for (let i = 0; i < numParticles; i++) {
        let x = particles[i*2];
        let y = particles[i*2 + 1];

        x += (Math.random() - 0.5) * vibration * fpsRatio;
        y += (Math.random() - 0.5) * vibration * fpsRatio;

        if (x < 0) x += 1;
        if (x > 1) x -= 1;
        if (y < 0) y += 1;
        if (y > 1) y -= 1;

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

      animationFrameId = requestAnimationFrame(render);
    };
    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 w-full h-full" />;
});

function TherapyView({ activeMode, setActiveMode, timerDuration, setTimerDuration, triggerHaptic }: any) {
  const modes = [
    { id: 'mindfulness', label: '觉察', desc: '入门 · 正念呼吸' },
    { id: 'resonance', label: '放松', desc: '进阶 · 共振呼吸' },
    { id: '478', label: '深眠', desc: '强化 · 4-7-8 呼吸' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="flex flex-col h-full justify-center relative w-full"
    >
      <div className="flex flex-col space-y-5 pl-4">
        {modes.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => {
                triggerHaptic('medium');
                setActiveMode(isActive ? 'off' : mode.id);
              }}
              className={`text-left group transition-all duration-700 relative pl-8 py-1 w-max outline-none ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeModeBar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-[40%] w-[1px] bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                />
              )}
              <h2 className={`font-display tracking-[0.3em] transition-transform duration-700 origin-left text-2xl ${isActive ? 'font-normal text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] scale-110' : 'font-light text-white/90 drop-shadow-sm scale-100'}`}>
                {mode.label}
              </h2>
              <AnimatePresence>
                {isActive && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[11px] tracking-[0.4em] text-white/80 font-light uppercase mt-1.5 overflow-hidden"
                  >
                    {mode.desc}
                  </motion.p>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {/* Timer bar */}
      <div className="absolute bottom-6 left-4 right-4 z-20">
        <div className="flex items-center space-x-3">
          <span className="text-xs text-white/70 font-light tracking-wider shrink-0">定时</span>
          <input type="range" min="5" max="60" step="5" value={timerDuration}
            onChange={(e) => setTimerDuration(parseInt(e.target.value))}
            className="flex-1 h-[1px] bg-white/15 appearance-none outline-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/70"
          />
          <span className="text-xs text-white/70 font-light tracking-wider shrink-0">{timerDuration}m</span>
        </div>
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
      className="flex flex-col min-h-0 justify-start overflow-y-auto no-scrollbar pb-8"
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
                      className={`w-9 h-9 rounded-full text-[12px] font-light tracking-wider transition-all ${
                        editRepeat[i] ? 'bg-white/15 text-white' : 'bg-transparent text-white/40'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                  <div className="flex space-x-6 justify-end pt-2">
                    <button onClick={() => deleteAlarm(alarm.id)} className="text-[13px] text-rose-400/70 hover:text-rose-400 tracking-widest uppercase py-1">删除</button>
                    <button onClick={() => setEditingId(null)} className="text-[13px] text-white/50 hover:text-white/80 tracking-widest uppercase py-1">取消</button>
                    <button onClick={saveEdit} className="text-[13px] text-white/80 hover:text-white tracking-widest uppercase py-1">保存</button>
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
                    <p className={`text-[11px] tracking-[0.2em] font-light ${alarm.active ? 'text-white/50' : 'text-white/30'}`}>
                      {formatRepeat(alarm.repeat)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${alarm.active ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] scale-100' : 'bg-white/20 scale-75'}`} />
                    <span className="text-white/20 text-sm font-thin">›</span>
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
      className="flex flex-col overflow-y-auto no-scrollbar space-y-5 py-4 pb-8"
    >
      {!planGenerated ? (
        <>
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
                <p className="text-[11px] tracking-[0.3em] text-white/60 font-light uppercase mb-1.5">{s.label}</p>
                <button
                  onClick={() => { setPickerOpen(s.which); setSearch(''); }}
                  className="w-full flex items-center justify-between px-3 py-3 border border-white/10 hover:bg-white/[0.04] transition-colors"
                >
                  <span className="text-white text-sm font-light tracking-wider">{s.city.name}</span>
                  <span className="text-white/40 text-xs tracking-wider">{s.city.tz}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Date picker */}
          <div className="space-y-1.5">
            <p className="text-[11px] tracking-[0.3em] text-white/60 font-light uppercase">出发日期</p>
            <input
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full bg-transparent border border-white/10 px-3 py-3 text-white text-sm font-light tracking-wider outline-none [color-scheme:dark]"
            />
          </div>

          {/* Sleep schedule */}
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <p className="text-[11px] tracking-[0.2em] text-white/50 font-light">{origin.name} 入睡</p>
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
            <div className="space-y-1.5">
              <p className="text-[11px] tracking-[0.2em] text-white/50 font-light">{origin.name} 起床</p>
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

          {/* Time diff + days */}
          <div className="flex items-center justify-between py-3 border-y border-white/[0.08]">
            <span className="text-sm text-white/70 font-light tracking-wider">时差 {diff >= 0 ? '+' : ''}{diff}h</span>
            <div className="flex items-center space-x-3">
              <span className="text-[12px] text-white/50 font-light">适应</span>
              <input type="range" min="1" max="7" value={days}
                onChange={(e) => { setDays(parseInt(e.target.value)); setPlanGenerated(false); }}
                className="w-24 h-1 bg-white/15 rounded-full appearance-none outline-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/70"
              />
              <span className="text-sm text-white/70 font-light w-7">{days}天</span>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={generating}
            className="w-full py-3 border border-white/15 text-white/70 hover:bg-white/5 transition-colors">
            <span className="text-sm tracking-[0.2em] font-light">{generating ? '生成中…' : '生成适配计划'}</span>
          </button>
        </>
      ) : (
        <>
          {/* Plan header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-white font-light tracking-wider">{origin.name} → {dest.name}</p>
              <p className="text-[11px] text-white/50 font-extralight tracking-wider mt-0.5">时差 {diff >= 0 ? '+' : ''}{diff}h · {days}天适应</p>
            </div>
            <button onClick={() => setPlanGenerated(false)}
              className="text-[12px] text-white/40 hover:text-white/70 tracking-wider py-1">← 调整</button>
          </div>

          {/* Target schedule */}
          <div className="border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-white/50 font-light tracking-wider">目标作息 · {dest.name}</span>
              <span className="text-base text-white/70 font-light tracking-wider">睡 {padTime(bedHour, bedMin)} → 起 {padTime(wakeHour, wakeMin)}</span>
            </div>
            
            {planDays.map((d, i) => {
              const isAdded = addedDays.has(d.day);
              return (
                <div key={i} className="flex items-center justify-between py-2 border-t border-white/[0.04]">
                  <div>
                    <p className="text-[13px] text-white/80 font-light tracking-wider">第 {d.day} 天</p>
                    <p className="text-[11px] text-white/50 font-extralight tracking-wider mt-0.5">
                      睡 {d.sleepOrigin} · {d.dir}{d.shiftH}h · 光照 {d.intensity}%
                    </p>
                  </div>
                  <button
                    onClick={() => addWakeAlarm(d.day, d.wakeDest)}
                    disabled={isAdded}
                    className={`text-[11px] tracking-wider font-light transition-all ${isAdded ? 'text-white/20' : 'text-white/50 hover:text-white'}`}
                  >
                    {isAdded ? '已同步' : `起 ${d.wakeDest} 同步`}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* City picker modal */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col">
            <div className="px-4 pt-12 pb-4 flex items-center space-x-3">
              <button onClick={() => { setPickerOpen(null); setSearch(''); }} className="text-white/60 hover:text-white text-sm tracking-wider font-light">取消</button>
              <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索城市…"
                className="flex-1 bg-white/[0.06] border border-white/10 rounded px-3 py-2 text-white text-sm font-light tracking-wider outline-none placeholder:text-white/20"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              {filteredRegions.map((r, ri) => (
                <div key={ri} className="mb-5">
                  <p className="text-[10px] tracking-[0.3em] text-white/30 font-light uppercase mb-2">{r.name}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {r.cities.map((c) => {
                      const idx = allCities.indexOf(c);
                      const isSelected = pickerOpen === 'origin' ? idx === originIdx : idx === destIdx;
                      return (
                        <button key={c.name} onClick={() => selectAndClose(idx, pickerOpen!)}
                          className={`text-left px-3 py-2.5 border transition-all ${isSelected ? 'border-white/30 bg-white/10' : 'border-white/[0.06] hover:border-white/20'}`}>
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
    </motion.div>
  );
}


