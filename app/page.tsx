'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Battery, BatteryMedium, BatteryLow, Moon } from 'lucide-react';

type Mode = 'off' | 'mindfulness' | 'resonance' | '478';
type Tab = 'therapy' | 'alarms' | 'jetlag' | 'music' | 'settings';

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
    const [scalePulse, setScalePulse] = useState(1);
    const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);

    const musicTracks = [
    { id: 63, typename: "ASMR", title: "ASMR-绘画", bgcolor: "#b18e8c", duration: 402, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/05/06/%E7%BB%98%E7%94%BB.jpg" },
    { id: 62, typename: "ASMR", title: "ASMR-薯片", bgcolor: "#0b2024", duration: 166, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/30/shutiao_he_shupian-013.jpg" },
    { id: 60, typename: "ASMR", title: "ASMR-海底", bgcolor: "#043a53", duration: 538, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/30/fernando-jorge--Jbg7G6RDSc-unsplash.jpg" },
    { id: 58, typename: "噪音", title: "白噪音-助眠", bgcolor: "#969292", duration: 180, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/30/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20200430154645.png" },
    { id: 57, typename: "噪音", title: "褐色噪音-放松", bgcolor: "#241b18", duration: 248, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/30/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20200430154603.png" },
    { id: 56, typename: "噪音", title: "粉红噪音-改善睡眠", bgcolor: "#ce5882", duration: 339, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/30/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20200430154648.png" },
    { id: 52, typename: "助眠引导", title: "正念呼吸-入门", bgcolor: "#11636b", duration: 1798, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/23/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20190329101702.jpg" },
    { id: 53, typename: "助眠引导", title: "4-7-8呼吸-进阶", bgcolor: "#5678be", duration: 1798, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/29/IMG_0780.JPG" },
    { id: 51, typename: "自然音乐", title: "山间溪水", bgcolor: "#195364", duration: 305, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/15/IMG_0527.JPG" },
    { id: 28, typename: "自然音乐", title: "森林雨声", bgcolor: "#414443", duration: 181, corverimg: "http://cdn.dreamlandlife.com/audio/img/2019/04/03/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20190401152519.jpg" },
    { id: 27, typename: "自然音乐", title: "沙滩浪花", bgcolor: "#2d6a80", duration: 188, corverimg: "http://cdn.dreamlandlife.com/audio/img/2019/04/03/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20190325101517.jpg" },
    { id: 25, typename: "自然音乐", title: "草原日落", bgcolor: "#7c5669", duration: 239, corverimg: "http://cdn.dreamlandlife.com/audio/img/2019/04/03/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20190401152540.jpg" },
  ];
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
      <ChladniBackground mode={activeMode} isConnected={connState === 'connected'} paused={!!panelTab} />
      
      {panelTab && (
        <div className="absolute inset-0 z-[5] backdrop-blur-sm bg-black/10 pointer-events-none" />
      )}
      
      <div className="absolute inset-0 flex flex-col z-10">
        {/* Top Status Bar */}
        <header className="relative w-full px-6 py-3 flex justify-between items-center pointer-events-none">
          <div className="flex items-center space-x-3">
            <motion.div 
              className={`w-1 h-1 rounded-full ${connState === 'connected' ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : connState === 'connecting' ? 'bg-white/60' : 'bg-white/20'}`}
              animate={{ opacity: connState === 'connected' ? [0.3, 1, 0.3] : connState === 'connecting' ? [0.5, 1, 0.5] : 1 }}
              transition={{ duration: connState === 'connecting' ? 1 : 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[10px] tracking-[0.3em] uppercase font-light text-white/80">
              {connState === 'connected' ? 'Dreamlight 已连接' : connState === 'connecting' ? 'Dreamlight 连接中…' : 'Dreamlight 待命'}
            </span>
          </div>
          {connState === 'connected' && (
            <div className="flex items-center space-x-3 text-white/90 drop-shadow-md">
              <span className="text-[10px] tracking-[0.2em] font-light">{batteryLevel}%</span>
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
            <div className="absolute inset-0 top-[2px] flex">
              <AnimatePresence>
                {!panelTab && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center px-8"
                  >
                    <div className="w-full max-w-sm space-y-10 mb-14">
                      {[
                        { id: 'mindfulness' as Mode, title: '平静入眠', sub: '正念呼吸' },
                        { id: 'resonance' as Mode, title: '压力释放', sub: '共振式呼吸' },
                        { id: '478' as Mode, title: '睡眠修复', sub: '4-7-8 呼吸' },
                      ].map((mode) => {
                        const isActive = activeMode === mode.id;
                        return (
                        <button key={mode.id} onClick={() => { triggerHaptic('medium'); setActiveMode(isActive ? 'off' : mode.id); }}
                          className="block text-left w-full outline-none group"
                        >
                          <div className="flex items-start">
                            <div className={`w-[2px] mr-4 mt-1 transition-all duration-500 rounded-full ${isActive ? 'h-10 bg-white/80' : 'h-0 bg-white/0'}`} />
                            <div>
                              <h2 className={`text-2xl font-light tracking-[0.15em] transition-all duration-500 ${isActive ? 'text-white' : 'text-white/80'}`}>{mode.title}</h2>
                              <p className={`text-[15px] font-light tracking-[0.2em] mt-1.5 transition-colors ${isActive ? 'text-white/60' : 'text-white/35'}`}>{mode.sub}</p>
                            </div>
                          </div>
                        </button>
                        );
                      })}
                    </div>
                    <div className="w-full max-w-sm grid grid-cols-2 gap-x-6 gap-y-7 pl-[18px] opacity-80">
                      {[
                        { id: 'alarms' as Tab, label: '自然醒来', sub: '灯光唤醒' },
                        { id: 'jetlag' as Tab, label: '时差调整', sub: '调整节律' },
                        { id: 'music' as Tab, label: '沉浸声音', sub: '声音疗愈' },
                        { id: 'settings' as Tab, label: '睡眠设置', sub: '设备管理' },
                      ].map((item) => (
                        <button key={item.id} onClick={() => setPanelTab(item.id as Tab)} className="text-left group py-2">
                          <p className="text-base text-white/50 font-light tracking-wider whitespace-nowrap">{item.label}</p>
                          <p className="text-[13px] text-white/30 font-extralight tracking-wider mt-1 whitespace-nowrap">{item.sub}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex-1 relative overflow-hidden">
                {panelTab && (
                  <div className="absolute inset-0 z-20 overflow-y-auto no-scrollbar">
                    <div className="px-5 pt-3 pb-8">
                      <button onClick={() => setPanelTab(null)} className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.15] flex items-center justify-center transition-colors mb-4">
                        <span className="text-white/50 text-xs">✕</span>
                      </button>
                      {panelTab === 'alarms' && <><h3 className="text-lg text-white/70 font-light tracking-wider mb-4">唤醒闹钟</h3><AlarmsView alarms={alarms} setAlarms={setAlarms} /></>}
                      {panelTab === 'jetlag' && <><h3 className="text-lg text-white/70 font-light tracking-wider mb-4">时差调节</h3><JetLagView alarms={alarms} setAlarms={setAlarms} setActiveTab={setActiveTab} /></>}
                      {panelTab === 'music' && <MusicView onPlayTrack={(id) => setPlayingTrackId(id)} />}
                      {panelTab === 'settings' && <SettingsView />}
                    </div>
                  </div>
                )}
              </div>
            </div>
           )}
        </main>
      </div>

      {/* Full-screen music player - rendered outside panel */}
      {playingTrackId !== null && (() => {
        const track = musicTracks.find(t => t.id === playingTrackId);
        return track ? <NatureMusicPlayer track={track} onClose={() => setPlayingTrackId(null)} /> : null;
      })()}
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

const ChladniBackground = React.memo(function ChladniBackground({ mode, isConnected, paused }: { mode: Mode, isConnected: boolean, paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  const isConnectedRef = useRef(isConnected);
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

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
      if (pausedRef.current) { animationFrameId = requestAnimationFrame(render); return; }
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

          {/* Sleep schedule - iPhone style */}
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <p className="text-[11px] tracking-[0.2em] text-white/60 font-light">{origin.name} 入睡</p>
              <input
                type="time"
                value={`${bedHour.toString().padStart(2,'0')}:${bedMin.toString().padStart(2,'0')}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':');
                  setBedHour(parseInt(h));
                  setBedMin(parseInt(m));
                  setPlanGenerated(false);
                }}
                className="bg-transparent text-white text-xl font-light tracking-wider outline-none [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] tracking-[0.2em] text-white/60 font-light">{origin.name} 起床</p>
              <input
                type="time"
                value={`${wakeHour.toString().padStart(2,'0')}:${wakeMin.toString().padStart(2,'0')}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':');
                  setWakeHour(parseInt(h));
                  setWakeMin(parseInt(m));
                  setPlanGenerated(false);
                }}
                className="bg-transparent text-white text-xl font-light tracking-wider outline-none [color-scheme:dark]"
              />
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
              <p className="text-xs text-white/60 font-light tracking-wider mt-0.5">时差 {diff >= 0 ? '+' : ''}{diff}h · {days}天适应</p>
            </div>
            <button onClick={() => setPlanGenerated(false)}
              className="text-xs text-white/60 hover:text-white tracking-wider py-1.5 px-3 border border-white/15 hover:border-white/30 transition-colors">← 调整</button>
          </div>

          {/* Target schedule */}
          <div className="border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-white/60 font-light tracking-wider">目标作息 · {dest.name}</span>
              <span className="text-base text-white/80 font-light tracking-wider">睡 {padTime(bedHour, bedMin)} → 起 {padTime(wakeHour, wakeMin)}</span>
            </div>
            
            {planDays.map((d, i) => {
              const isAdded = addedDays.has(d.day);
              return (
                <div key={i} className="flex items-center justify-between py-2 border-t border-white/[0.04]">
                  <div>
                    <p className="text-[13px] text-white/80 font-light tracking-wider">第 {d.day} 天</p>
                    <p className="text-[11px] text-white/60 font-light tracking-wider mt-0.5">
                      睡 {d.sleepOrigin} · {d.dir}{d.shiftH}h · 光照 {d.intensity}%
                    </p>
                  </div>
                  <button
                    onClick={() => addWakeAlarm(d.day, d.wakeDest)}
                    disabled={isAdded}
                    className={`shrink-0 text-xs tracking-wider font-light py-1.5 px-3 border transition-all ${
                      isAdded ? 'text-white/30 border-white/10' : 'text-white/60 border-white/20 hover:bg-white/5 hover:text-white'
                    }`}
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



function MusicView({ onPlayTrack }: { onPlayTrack?: (id: number) => void }) {
  const [category, setCategory] = useState<string | null>(null);
  const tracks = [
    { id: 63, typename: "ASMR", title: "ASMR-绘画", bgcolor: "#b18e8c", duration: 402, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/05/06/%E7%BB%98%E7%94%BB.jpg" },
    { id: 62, typename: "ASMR", title: "ASMR-薯片", bgcolor: "#0b2024", duration: 166, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/30/shutiao_he_shupian-013.jpg" },
    { id: 60, typename: "ASMR", title: "ASMR-海底", bgcolor: "#043a53", duration: 538, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/30/fernando-jorge--Jbg7G6RDSc-unsplash.jpg" },
    { id: 58, typename: "噪音", title: "白噪音-助眠", bgcolor: "#969292", duration: 180, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/30/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20200430154645.png" },
    { id: 57, typename: "噪音", title: "褐色噪音-放松", bgcolor: "#241b18", duration: 248, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/30/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20200430154603.png" },
    { id: 56, typename: "噪音", title: "粉红噪音-改善睡眠", bgcolor: "#ce5882", duration: 339, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/30/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20200430154648.png" },
    { id: 52, typename: "助眠引导", title: "正念呼吸-入门", bgcolor: "#11636b", duration: 1798, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/23/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20190329101702.jpg" },
    { id: 53, typename: "助眠引导", title: "4-7-8呼吸-进阶", bgcolor: "#5678be", duration: 1798, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/29/IMG_0780.JPG" },
    { id: 51, typename: "自然音乐", title: "山间溪水", bgcolor: "#195364", duration: 305, corverimg: "http://cdn.dreamlandlife.com/audio/img/2020/04/15/IMG_0527.JPG" },
    { id: 28, typename: "自然音乐", title: "森林雨声", bgcolor: "#414443", duration: 181, corverimg: "http://cdn.dreamlandlife.com/audio/img/2019/04/03/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20190401152519.jpg" },
    { id: 27, typename: "自然音乐", title: "沙滩浪花", bgcolor: "#2d6a80", duration: 188, corverimg: "http://cdn.dreamlandlife.com/audio/img/2019/04/03/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20190325101517.jpg" },
    { id: 25, typename: "自然音乐", title: "草原日落", bgcolor: "#7c5669", duration: 239, corverimg: "http://cdn.dreamlandlife.com/audio/img/2019/04/03/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20190401152540.jpg" },
  ];
  const categories = [...new Set(tracks.map(t => t.typename))];
  const filtered = category ? tracks.filter(t => t.typename === category) : tracks;

  return (
    <div className="flex flex-col h-full">
      {/* Grid view */}
      <>
          <h3 className="text-lg text-white/80 font-light tracking-wider">助眠音乐</h3>
          <div className="flex space-x-2 overflow-x-auto no-scrollbar mt-3">
            <button onClick={() => setCategory(null)} className={`shrink-0 px-3 py-1.5 text-[11px] tracking-wider font-light rounded-full border ${!category?'border-white/30 bg-white/10 text-white':'border-white/[0.06] text-white/40'}`}>全部</button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} className={`shrink-0 px-3 py-1.5 text-[11px] tracking-wider font-light rounded-full border ${category===cat?'border-white/30 bg-white/10 text-white':'border-white/[0.06] text-white/40'}`}>{cat}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {filtered.map((t) => (
              <button key={t.id} onClick={() => onPlayTrack?.(t.id)}
                className="relative rounded-2xl text-left h-40 overflow-hidden active:scale-[0.97] transition-transform"
                style={{background:`linear-gradient(180deg,${t.bgcolor}40 0%,${t.bgcolor}10 100%)`}}
              >
                <div className="absolute inset-0 opacity-25">{t.corverimg&&<img src={t.corverimg} alt="" className="w-full h-full object-cover"/>}</div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-xs text-white/70 font-light tracking-wider truncate">{t.title}</p>
                  <p className="text-[9px] text-white/30 font-extralight mt-0.5">{t.typename}</p>
                </div>
              </button>
            ))}
          </div>
        </>
    </div>
  );
}

function MusicCardCanvas({ bgcolor, active, seed, title }: { bgcolor:string; active:boolean; seed:number; title:string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if(!active)return;
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext('2d')!; let animId:number;
    const rect=canvas.getBoundingClientRect();
    canvas.width=rect.width*2; canvas.height=rect.height*2; ctx.scale(2,2);
    const hex=(s:string)=>({r:parseInt(s.slice(1,3),16),g:parseInt(s.slice(3,5),16),b:parseInt(s.slice(5,7),16)});
    const c=hex(bgcolor); const num=400;
    const particles=new Float32Array(num*2); for(let i=0;i<num*2;i++)particles[i]=Math.random();
    const seedN=3+(seed%7), seedM=2+((seed*3)%6); let n=seedN,m=seedM,frame=0;
    const render=()=>{frame++;
      n=seedN+Math.sin(frame*0.03)*2; m=seedM+Math.cos(frame*0.025)*2;
      ctx.fillStyle=`rgba(${c.r},${c.g},${c.b},0.12)`; ctx.fillRect(0,0,rect.width,rect.height);
      ctx.fillStyle=`rgba(255,255,255,0.45)`; ctx.beginPath();
      for(let i=0;i<num;i++){let x=particles[i*2],y=particles[i*2+1];
        x+=(Math.random()-0.5)*0.005; y+=(Math.random()-0.5)*0.005;
        if(x<0)x+=1; if(x>1)x-=1; if(y<0)y+=1; if(y>1)y-=1;
        const f=Math.sin(n*Math.PI*x)*Math.sin(m*Math.PI*y)+Math.sin(m*Math.PI*x)*Math.sin(n*Math.PI*y);
        const dfdx=n*Math.PI*Math.cos(n*Math.PI*x)*Math.sin(m*Math.PI*y)+m*Math.PI*Math.cos(m*Math.PI*x)*Math.sin(n*Math.PI*y);
        const dfdy=m*Math.PI*Math.sin(n*Math.PI*x)*Math.cos(m*Math.PI*y)+n*Math.PI*Math.sin(m*Math.PI*x)*Math.cos(n*Math.PI*y);
        x-=f*dfdx*0.001; y-=f*dfdy*0.001; particles[i*2]=x; particles[i*2+1]=y;
        ctx.rect(x*rect.width,y*rect.height,1.5,1.5);}
      ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font=`${rect.width*0.09}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(title,rect.width/2,rect.height/2);
      animId=requestAnimationFrame(render);};
    animId=requestAnimationFrame(render);
    return()=>cancelAnimationFrame(animId);
  },[active,bgcolor,seed,title]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"/>;
}

function SettingsView() {
  return (
    <div className="flex flex-col space-y-6">
      <h3 className="text-lg text-white/80 font-light tracking-wider">设置</h3>
      <div className="space-y-3">
        {[{label:'设备信息',desc:'Dreamlight A1 · 固件 v2.1'},{label:'蓝牙连接',desc:'已连接 · 信号强'},{label:'亮度调节',desc:'自适应'},{label:'关于应用',desc:'版本 1.0.0'}].map(s=>(
          <div key={s.label} className="flex justify-between items-center py-3 border-b border-white/[0.06]">
            <span className="text-sm text-white/60 font-light tracking-wider">{s.label}</span>
            <span className="text-xs text-white/30 font-extralight tracking-wider">{s.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NowPlayingParticles({ bgcolor }: { bgcolor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Debug: fill visible rect first
    ctx.fillStyle = bgcolor;
    ctx.fillRect(0, 0, w, h);

    const hex = (s: string) => ({ r: parseInt(s.slice(1,3),16), g: parseInt(s.slice(3,5),16), b: parseInt(s.slice(5,7),16) });
    const c = hex(bgcolor);
    const c2 = { r: Math.min(255,c.r+50), g: Math.min(255,c.g+30), b: Math.min(255,c.b+20) };

    const num = 15000;
    const particles = new Float32Array(num * 2);
    for (let i = 0; i < num * 2; i++) particles[i] = Math.random();
    let n = 5, m = 4, frame = 0;

    // Frequency patterns that change over time
    const patterns = [[5,4],[7,3],[6,6],[8,5],[4,7],[9,4],[5,8],[7,7]];

    const render = () => {
      frame++;
      const pidx = Math.floor(frame / 120) % patterns.length;
      const [tn, tm] = patterns[pidx];
      n += (tn - n) * 0.02;
      m += (tm - m) * 0.02;

      // Flowing gradient
      const grad = ctx.createLinearGradient(
        w*(0.3+Math.sin(frame*0.003)*0.3), h*(0.3+Math.cos(frame*0.004)*0.3),
        w*(0.7+Math.cos(frame*0.0035)*0.3), h*(0.7+Math.sin(frame*0.0045)*0.3)
      );
      grad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0.5)`);
      grad.addColorStop(1, `rgba(${c2.r},${c2.g},${c2.b},0.5)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},0.08)`;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      for (let i = 0; i < num; i++) {
        let x = particles[i*2], y = particles[i*2+1];
        x += (Math.random()-0.5)*0.003; y += (Math.random()-0.5)*0.003;
        if (x<0)x+=1; if(x>1)x-=1; if(y<0)y+=1; if(y>1)y-=1;
        const f = Math.sin(n*Math.PI*x)*Math.sin(m*Math.PI*y) + Math.sin(m*Math.PI*x)*Math.sin(n*Math.PI*y);
        const dfdx = n*Math.PI*Math.cos(n*Math.PI*x)*Math.sin(m*Math.PI*y) + m*Math.PI*Math.cos(m*Math.PI*x)*Math.sin(n*Math.PI*y);
        const dfdy = m*Math.PI*Math.sin(n*Math.PI*x)*Math.cos(m*Math.PI*y) + n*Math.PI*Math.sin(m*Math.PI*x)*Math.cos(n*Math.PI*y);
        x -= f*dfdx*0.001; y -= f*dfdy*0.001;
        particles[i*2]=x; particles[i*2+1]=y;
        ctx.fillRect(x*Math.max(w,h)*1.1, y*Math.max(w,h)*1.1, 1.5, 1.5);
      }
      ctx.fill();
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [bgcolor]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-[5] w-full h-full" />;
}

function NatureMusicPlayer({ track, onClose }: { track: any; onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const imageUrl = track.corverimg;
  const frameRef = useRef(0);
  const chunksRef = useRef<{sx:number;sy:number;sw:number;sh:number;tx:number;ty:number;vx:number;vy:number;angle:number;r:number;g:number;b:number}[]>([]);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const chunksReadyRef = useRef(false);

  // Load image once
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const imgSize = Math.max(w, h);
      const imgX = (w - imgSize) / 2;
      const imgY = (h - imgSize) / 2;
      const chunkSize = 10;
      const cols = Math.ceil(imgSize / chunkSize);
      const rows = Math.ceil(imgSize / chunkSize);
      const hex = (s: string) => ({ r: parseInt(s.slice(1,3),16), g: parseInt(s.slice(3,5),16), b: parseInt(s.slice(5,7),16) });
      const bc = hex(track.bgcolor);

      const chunks: typeof chunksRef.current = [];
      for (let r = 0; r < rows; r++) {
        for (let cl = 0; cl < cols; cl++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.3 + Math.random() * 1.2;
          // Use bgcolor with random variation
          chunks.push({
            sx: (cl / cols) * img.naturalWidth,
            sy: (r / rows) * img.naturalHeight,
            sw: img.naturalWidth / cols,
            sh: img.naturalHeight / rows,
            tx: imgX + cl * chunkSize,
            ty: imgY + r * chunkSize,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            angle,
            r: Math.min(255, Math.max(0, bc.r + (Math.random()-0.5) * 40)),
            g: Math.min(255, Math.max(0, bc.g + (Math.random()-0.5) * 40)),
            b: Math.min(255, Math.max(0, bc.b + (Math.random()-0.5) * 40))
          });
        }
      }
      chunksRef.current = chunks;
      chunksReadyRef.current = true;
    };
  }, [imageUrl]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    const hex = (s: string) => ({ r: parseInt(s.slice(1,3),16), g: parseInt(s.slice(3,5),16), b: parseInt(s.slice(5,7),16) });
    const c = hex(track.bgcolor);

    let n = 5, m = 4;
    const patterns = [[5,4],[7,3],[6,6],[8,5],[4,7],[9,4],[5,8],[7,7]];

    const imgSize = Math.max(w, h);
    const imgX = (w - imgSize) / 2;
    const imgY = (h - imgSize) / 2;
    const chunkSize = 6;
    const dissolveStart = 30;
    const dissolveSpeed = 0.008;
    const chladniStart = 160; // frame when Chladni mode begins

    // Per-chunk Chladni state
    let chladniInit = false;
    const cx = 0.5, cy = 0.5;

    const render = () => {
      frameRef.current++;
      const frame = frameRef.current;
      const pidx = Math.floor(frame / 120) % patterns.length;
      const [tn, tm] = patterns[pidx];
      n += (tn - n) * 0.02;
      m += (tm - m) * 0.02;

      // Background
      ctx.globalCompositeOperation = 'source-over';
      const pulse = 0.7 + Math.sin(frame * 0.012) * 0.1;
      const grad = ctx.createRadialGradient(w*0.5, h*0.5, 0, w*0.5, h*0.5, Math.max(w,h)*0.7);
      grad.addColorStop(0, `rgba(${c.r+20},${c.g+15},${c.b+10},${pulse})`);
      grad.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},1)`);
      grad.addColorStop(1, `rgba(${Math.max(0,c.r-40)},${Math.max(0,c.g-40)},${Math.max(0,c.b-40)},1)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const img = imgRef.current;
      const chunks = chunksRef.current;
      const ready = chunksReadyRef.current && img && img.complete;

      if (ready) {
        // Init Chladni positions on first frame of phase 3
        if (frame >= chladniStart && !chladniInit) {
          chladniInit = true;
          for (const ch of chunks) {
            // Store current scattered position as Chladni starting point
            (ch as any).px = ch.tx + ch.vx * 80;
            (ch as any).py = ch.ty + ch.vy * 80;
            (ch as any).vx2 = (Math.random() - 0.5) * 0.5;
            (ch as any).vy2 = (Math.random() - 0.5) * 0.5;
          }
        }

        const dissolveProgress = Math.min(1, Math.max(0, (frame - dissolveStart) * dissolveSpeed));

        // Phase 1 & 2: Solid image + dissolve
        if (frame < chladniStart) {
          // Solid image fading out
          if (dissolveProgress < 1) {
            ctx.globalAlpha = 1 - dissolveProgress;
            ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
            ctx.globalAlpha = 1;
          }

          // Scattered chunks
          for (const ch of chunks) {
            const ccx = (ch.tx - imgX) / imgSize - 0.5;
            const ccy = (ch.ty - imgY) / imgSize - 0.5;
            const dist = Math.sqrt(ccx*ccx + ccy*ccy);
            const cp = Math.max(0, Math.min(1, (dissolveProgress - dist * 0.5) / 0.6));
            if (cp <= 0) continue;

            const dx = ch.vx * cp * 80;
            const dy = ch.vy * cp * 80;

            const nx = (ch.tx + dx) / w;
            const ny = (ch.ty + dy) / h;
            const f = Math.sin(n*Math.PI*nx)*Math.sin(m*Math.PI*ny) + Math.sin(m*Math.PI*nx)*Math.sin(n*Math.PI*ny);
            const wx = f * Math.cos(ch.angle) * 15 * cp;
            const wy = f * Math.sin(ch.angle) * 15 * cp;

            ctx.globalAlpha = Math.max(0.15, 0.9 - cp * 0.4);
            ctx.drawImage(img, ch.sx, ch.sy, ch.sw, ch.sh, ch.tx + dx + wx, ch.ty + dy + wy, chunkSize + 1, chunkSize + 1);
          }
        } else {
          // Phase 3: Chladni particles
          const chStrength = Math.min(1, (frame - chladniStart) / 60); // ramp up over 1s

          for (const ch of chunks) {
            let px = (ch as any).px;
            let py = (ch as any).py;
            let vx = (ch as any).vx2;
            let vy = (ch as any).vy2;

            // Chladni force
            const f = Math.sin(n*Math.PI*(px/w))*Math.sin(m*Math.PI*(py/h)) + Math.sin(m*Math.PI*(px/w))*Math.sin(n*Math.PI*(py/h));
            const dfdx = n*Math.PI*Math.cos(n*Math.PI*(px/w))*Math.sin(m*Math.PI*(py/h)) + m*Math.PI*Math.cos(m*Math.PI*(px/w))*Math.sin(n*Math.PI*(py/h));
            const dfdy = m*Math.PI*Math.sin(n*Math.PI*(px/w))*Math.cos(m*Math.PI*(py/h)) + n*Math.PI*Math.sin(m*Math.PI*(px/w))*Math.cos(n*Math.PI*(py/h));

            // Elastic return to original position
            const dx = ch.tx - px;
            const dy = ch.ty - py;

            vx += dx * 0.0005 - f * dfdx * 0.0008 * chStrength + (Math.random()-0.5)*0.002;
            vy += dy * 0.0005 - f * dfdy * 0.0008 * chStrength + (Math.random()-0.5)*0.002;
            vx *= 0.97;
            vy *= 0.97;
            px += vx;
            py += vy;

            (ch as any).px = px;
            (ch as any).py = py;
            (ch as any).vx2 = vx;
            (ch as any).vy2 = vy;

            // Distance from center for alpha and size
            const dist = Math.sqrt((px/w - cx)**2 + (py/h - cy)**2);
            const alpha = Math.max(0.1, 0.85 - dist * 0.8);
            // Shrink from chunkSize to 1.5px over the Chladni phase
            const shrinkProgress = Math.min(1, (frame - chladniStart) / 90);
            const size = Math.max(1.5, (chunkSize + 1) * (1 - shrinkProgress * 0.75) * (1 - dist * 0.3));

            ctx.globalAlpha = alpha * chStrength;
            ctx.drawImage(img, ch.sx, ch.sy, ch.sw, ch.sh, px, py, size, size);
          }
        }

        ctx.globalAlpha = 1;
      }

      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(animId); frameRef.current = 0; };
  }, [track.bgcolor]);

  return (
    <div className="fixed inset-0 z-50" style={{ backgroundColor: track.bgcolor }}>
      {/* Chladni particles (image pixelated) */}
      <canvas ref={canvasRef} className="absolute inset-0 z-[1]" />

      <main className="relative z-10 w-full max-w-[420px] h-full flex flex-col p-8">
        {/* Header */}
        <header className="flex items-center justify-between text-white/80 mb-4 shrink-0">
          <button onClick={onClose} className="p-2 rounded-full active:bg-white/10"><span className="text-xl">✕</span></button>
          <div className="text-xs font-semibold tracking-widest uppercase text-white/90">{track.typename}</div>
          <div className="w-10" />
        </header>

        {/* Spacer - particles fill this area */}
        <div className="flex-1" />

        {/* Track Info */}
        <div className="flex-1" />
        <div className="text-center shrink-0 mb-4">
          <h1 className="text-xl font-light text-white/90 tracking-wider drop-shadow-lg">{track.title}</h1>
          <p className="text-xs text-white/50 font-extralight tracking-wider mt-1 drop-shadow-lg">{track.typename}</p>
        </div>

        {/* Play/Pause */}
        <div className="flex justify-center pb-6 shrink-0">
          <button className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform border border-white/20"
            onClick={() => setIsPlaying(!isPlaying)}>
            <span className="text-white text-xl">{isPlaying ? '⏸' : '▶'}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
