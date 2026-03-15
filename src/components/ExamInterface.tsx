'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logWarning, submitExam } from '@/lib/actions';
import { Maximize, ShieldAlert, Clock, Code, Play, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';

interface ExamInterfaceProps {
  initialRemainingTime: number;
  initialWarnings: number;
  targetPic?: string | null;
  targetHtml?: string | null;
}

export default function ExamInterface({ initialRemainingTime, initialWarnings, targetPic, targetHtml }: ExamInterfaceProps) {
  const [warnings, setWarnings] = useState(initialWarnings);
  const [time, setTime] = useState(initialRemainingTime);
  const [code, setCode] = useState(targetHtml || '<!-- Write your HTML/CSS here -->');
  const [isExamActive, setIsExamActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewsLeft, setPreviewsLeft] = useState(3);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'html'>('design');

  const togglePreview = () => {
    if (!showPreview) {
      if (previewsLeft <= 0) {
        alert("Attention: You have exhausted all 3 available preview sessions.");
        return;
      }
      setPreviewsLeft(prev => prev - 1);
    }
    setShowPreview(!showPreview);
  };

  const codeRef = useRef(code);

  // Update ref whenever code changes
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  const handleComplete = useCallback(async (isAuto = false) => {
    setSubmitting(true);
    await submitExam(codeRef.current, isAuto);
  }, []);

  const handleWarning = useCallback(async (reason: string) => {
    if (submitting) return;
    
    const newCount = warnings + 1;
    setWarnings(newCount);
    await logWarning();
    
    alert(`WARNING: ${reason}. You have ${newCount}/2 warnings.`);
    
    if (newCount >= 2) {
      await handleComplete(true);
    }
  }, [warnings, submitting, handleComplete]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExamActive && time > 0) {
      interval = setInterval(() => {
        setTime((prev) => {
          if (prev <= 1) {
            handleComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExamActive, handleComplete]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && isExamActive && !submitting) {
        await handleWarning('Switched tab or window');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isExamActive, submitting, handleWarning]);

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = async () => {
      const inFullscreen = !!document.fullscreenElement;
      
      if (!inFullscreen && isExamActive && !submitting) {
        await handleWarning('Exited fullscreen mode');
        setIsExamActive(false); // require rejoin
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isExamActive, submitting, handleWarning]);



  const enterFullscreenAndStart = () => {
    document.documentElement.requestFullscreen().then(() => {
      setIsExamActive(true);
    }).catch(err => {
      console.error(err);
      alert("Please allow fullscreen to start the exam.");
    });
  };

  // If not active, show the overlay to enter
  if (!isExamActive) {
    return (
      <div className="h-screen w-full flex items-center justify-center flex-col p-6 bg-[#020617]">
        <div className="card max-w-lg text-center mx-auto glass-panel animate-fade-in shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-1000"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
            
          <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto mb-6 animate-pulse drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          <h1 className="text-3xl mb-4 font-bold text-white tracking-tight">Standardized Assessment</h1>
          <p className="text-zinc-400 mb-6 text-lg leading-relaxed">
            This module requires strict monitoring. Any attempt to leave the browser or exit fullscreen will be logged as a violation.
          </p>
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl mb-8 flex items-center justify-between">
            <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest block opacity-50">Current Violations</span>
                <span className="text-2xl font-black">{warnings} <span className="text-xs opacity-50 font-normal">/ 2</span></span>
            </div>
            {warnings >= 1 && <div className="text-xs font-semibold animate-bounce bg-red-500 text-white px-2 py-1 rounded">FINAL ATTEMPT</div>}
          </div>
          <button 
            onClick={enterFullscreenAndStart}
            className="btn btn-primary text-xl px-10 py-5 shadow-[0_4px_14px_0_rgba(59,130,246,0.5)] hover:shadow-[0_6px_25px_rgba(59,130,246,0.3)] hover:-translate-y-1 transition-all w-full font-black uppercase tracking-widest rounded-2xl"
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : <><Maximize className="w-6 h-6 mr-3" /> Initialize Lab</>}
          </button>
        </div>
      </div>
    );
  }

  // Active Exam Interface
  return (
    <div className="flex flex-col h-screen bg-[#050507] text-white overflow-hidden font-sans">
      {/* Premium Header */}
      <header className="exam-header border-b border-white/5 bg-black/60 backdrop-blur-3xl px-6 h-18 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                <Code className="w-5 h-5 text-white" />
            </div>
            <div>
                <h2 className="font-extrabold text-sm tracking-tight leading-none text-white">CORE ASSESSMENT</h2>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Environment: Secure Sandbox</span>
                </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center bg-zinc-950/80 rounded-2xl p-1 border border-white/5 shadow-inner">
             <button 
                onClick={togglePreview}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-xl transition-all duration-300 ${showPreview ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'}`}
             >
                {showPreview ? <><EyeOff className="w-4 h-4" /> Exit Preview</> : <><Eye className="w-4 h-4" /> Request Preview</>}
             </button>
             <div className="px-3 border-l border-white/5 ml-1">
                <span className="text-[9px] text-zinc-600 uppercase font-bold block mb-0.5">Tokens</span>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-3 h-1 rounded-full transition-colors duration-500 ${i <= previewsLeft ? 'bg-blue-500' : 'bg-zinc-800'}`}></div>
                    ))}
                </div>
             </div>
          </div>

          <div className="flex items-center bg-zinc-900/30 rounded-2xl px-5 py-2.5 border border-white/5">
            <div className={`flex items-center gap-3 font-black tabular-nums
              ${time < 300 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
              <Clock className="w-4 h-4 opacity-70" />
              <span className="text-sm tracking-widest">{Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}</span>
            </div>
            
            <div className="w-px h-5 bg-white/10 mx-5"></div>
            
            <div className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-tighter
              ${warnings > 0 ? 'text-amber-500' : 'text-zinc-500'}`}>
              <ShieldAlert className="w-4 h-4 opacity-70" /> 
              <span>Violations: {warnings}/2</span>
            </div>
          </div>
          
          <button 
            onClick={() => handleComplete(false)}
            className="group relative px-6 py-2.5 font-black uppercase text-[11px] tracking-widest overflow-hidden rounded-xl transition-all hover:scale-105 active:scale-95"
            disabled={submitting}
          >
            <div className="absolute inset-0 bg-blue-600 group-hover:bg-blue-500 transition-colors"></div>
            <span className="relative z-10 flex items-center gap-2">
                {submitting ? 'Transmitting...' : <><Play className="w-4 h-4 fill-current" /> Final Submit</>}
            </span>
          </button>
        </div>
      </header>
      
      {/* IDE Body */}
      <main className="flex-1 flex overflow-hidden relative">
         {/* Left Sidebar: Instructions & Reference */}
         <aside className={`${showPreview ? 'w-0 opacity-0 pointer-events-none' : 'w-96'} flex flex-col border-r border-white/5 bg-[#0a0a0c] shrink-0 transition-all duration-700 overflow-hidden relative z-40 shadow-2xl`}>
             <div className="flex bg-black/40 border-b border-white/5">
                <button 
                    onClick={() => setActiveTab('design')}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'design' ? 'text-blue-400 border-b-2 border-blue-500 bg-white/5' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                    Target Design
                </button>
                <button 
                    onClick={() => setActiveTab('html')}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'html' ? 'text-blue-400 border-b-2 border-blue-500 bg-white/5' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                    Task Code
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {activeTab === 'design' ? (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="mb-8">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
                                <div className="w-4 h-[2px] bg-blue-500"></div>
                                Learning Path
                            </h3>
                            <p className="text-sm text-zinc-300 font-medium leading-relaxed">
                                Transform the conceptual design into a functional, pixel-perfect interface using modern styling paradigms.
                            </p>
                        </div>
                        
                        <div className="group relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl opacity-20 blur-xl group-hover:opacity-40 transition duration-1000"></div>
                            <div className="relative bg-[#0d0d10] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                <div className="px-5 py-3 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">Visual Blueprint</span>
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-red-500/30"></div>
                                        <div className="w-2 h-2 rounded-full bg-amber-500/30"></div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500/30"></div>
                                    </div>
                                </div>
                                <div className="min-h-56 p-4 flex items-center justify-center bg-[#08080a]">
                                    {targetPic ? (
                                        <img 
                                            src={targetPic} 
                                            alt="Target Design" 
                                            className="max-w-full max-h-72 object-contain rounded-xl shadow-2xl hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 py-8">
                                            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 animate-bounce-slow">
                                                <ImageIcon className="w-10 h-10 text-white" />
                                            </div>
                                            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">No target image loaded</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-3">
                            {['Accuracy', 'Responsive', 'Semantic', 'Stability'].map((feat) => (
                                <div key={feat} className="bg-white/[0.03] border border-white/5 p-3 rounded-xl flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{feat}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-3">
                                <div className="w-4 h-[2px] bg-emerald-500"></div>
                                Task Code
                            </h3>
                            <p className="text-xs text-zinc-500 leading-relaxed italic">
                                Use the blueprint below as a structural guide. Note: This panel is restricted for reading only.
                            </p>
                        </div>
                        
                        <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-5 font-mono text-[13px] text-emerald-400 selection:bg-emerald-500/20 overflow-auto custom-scrollbar-emerald shadow-inner relative leading-relaxed overflow-x-hidden">
                            <div className="absolute top-0 right-0 p-3">
                                <ShieldAlert className="w-4 h-4 text-emerald-500/20" />
                            </div>
                            {targetHtml ? (
                                <pre className="whitespace-pre-wrap break-all select-all">{targetHtml}</pre>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-700 font-black uppercase tracking-widest gap-2">
                                    <Code className="w-8 h-8 opacity-20" />
                                    <span className="text-[9px]">Structural data encrypted</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
             </div>
             
             <div className="p-5 bg-black/40 border-t border-white/5 flex items-center justify-between">
                 <span className="text-[9px] text-zinc-600 font-black tracking-widest uppercase">ID: ASM-92301-B</span>
                 <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                 </div>
             </div>
         </aside>
         
         {/* Coding Workspace Shell */}
         <div className="flex-1 flex flex-row bg-[#08080a] overflow-hidden relative">
              {/* Center: Editor Section */}
              <div className={`${showPreview ? 'w-0 opacity-0 pointer-events-none' : 'flex-1'} flex flex-col transition-all duration-700 overflow-hidden`}>
                  {/* Tab bar */}
                  <div className="bg-[#050507] flex items-center px-4 border-b border-white/5 h-12">
                    <div className="flex items-center gap-3 bg-[#0d0d12] px-5 py-3 rounded-t-xl border-t border-x border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500"></div>
                        <Code className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-200">Main.sandbox</span>
                    </div>
                  </div>

                  {/* Editor Shell */}
                  <div className="flex-1 flex overflow-hidden relative group bg-[#0d0d12]/50">
                      {/* Gutter */}
                      <div className="w-14 bg-black/20 border-r border-white/5 flex flex-col items-center pt-8 font-mono text-[12px] text-zinc-800 select-none shrink-0 tabular-nums">
                          {Array.from({length: 100}).map((_, i) => (
                              <div key={i} className="h-[24px]">{i + 1}</div>
                          ))}
                      </div>
                      
                      <textarea
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="flex-1 bg-transparent text-zinc-100 font-mono text-[15px] leading-[24px] p-8 outline-none resize-none custom-scrollbar selection:bg-blue-500/20 caret-blue-500"
                          spellCheck={false}
                          placeholder="Initialize project structure..."
                      />

                      {/* Tooling floating menu */}
                      <div className="absolute bottom-8 right-8 flex flex-col gap-3 group/tools opacity-10 group-hover:opacity-100 transition-opacity">
                          <button 
                              onClick={() => setCode('')} 
                              className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center hover:bg-zinc-800 hover:border-red-500/50 hover:text-red-500 transition-all shadow-2xl"
                              title="Clear Workspace"
                          >
                              <Trash2 className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
              </div>

              {/* Right: Live Preview */}
              <div className={`${showPreview ? 'flex-1' : 'w-0 opacity-0 pointer-events-none'} flex flex-col transition-all duration-700 bg-white overflow-hidden relative z-50`}>
                  {/* Preview Toolbar */}
                  <div className="h-10 bg-zinc-100 border-b border-zinc-200 flex items-center px-4 justify-between select-none">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
                        <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
                        <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
                    </div>
                    <div className="bg-white border border-zinc-200 rounded px-3 py-1 text-[10px] font-bold text-zinc-400 flex items-center gap-2">
                        <Play className="w-2.5 h-2.5 fill-current" /> Local Deployment: Port 3000
                    </div>
                  </div>
                  
                  <div className="flex-1 relative">
                          <iframe 
                            key={showPreview ? 'visible' : 'hidden'}
                            title="preview"
                            className="w-full h-full border-none"
                            srcDoc={`
                                <html>
                                  <head>
                                     <style>
                                        body { 
                                          margin: 0; 
                                          padding: 0; 
                                          display: flex; 
                                          align-items: center; 
                                          justify-content: center; 
                                          min-height: 100vh; 
                                          background: #ffffff; 
                                          box-sizing: border-box; 
                                          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                                        }
                                        * { box-sizing: border-box; }
                                     </style>
                                  </head>
                                  <body>${code}</body>
                                </html>
                            `}
                            sandbox="allow-scripts"
                          />
                  </div>
              </div>
         </div>
      </main>
    </div>
  );
}

// Icon for trash in the code area
function Trash2(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" x2="10" y1="11" y2="17"/>
            <line x1="14" x2="14" y1="11" y2="17"/>
        </svg>
    )
}

