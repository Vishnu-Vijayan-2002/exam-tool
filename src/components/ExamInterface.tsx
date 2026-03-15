'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logWarning, submitExam } from '@/lib/actions';
import { Maximize, ShieldAlert, Clock, Code, Play, Eye, EyeOff } from 'lucide-react';

interface ExamInterfaceProps {
  initialRemainingTime: number;
  initialWarnings: number;
}

export default function ExamInterface({ initialRemainingTime, initialWarnings }: ExamInterfaceProps) {
  const [warnings, setWarnings] = useState(initialWarnings);
  const [time, setTime] = useState(initialRemainingTime);
  const [code, setCode] = useState('<!-- Write your HTML/CSS here -->\n<div class="box"></div>\n<style>\n.box {\n  width: 100px;\n  height: 100px;\n  background: red;\n}\n</style>');
  const [isExamActive, setIsExamActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewsLeft, setPreviewsLeft] = useState(3);
  const [showPreview, setShowPreview] = useState(false);

  const togglePreview = () => {
    if (!showPreview) {
      if (previewsLeft <= 0) {
        alert("You have exhausted all 3 preview sessions!");
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
      <div className="h-screen w-full flex items-center justify-center flex-col p-6">
        <div className="card max-w-lg text-center mx-auto glass-panel animate-fade-in shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-[var(--warning)] mx-auto mb-6 animate-float drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          <h1 className="text-3xl mb-4 font-bold text-[var(--text-primary)]">Ready to Begin?</h1>
          <p className="text-[var(--text-secondary)] mb-6 text-lg">
            This exam requires fullscreen. Switching tabs, exiting fullscreen, or minimizing the window will result in a warning.
          </p>
          <div className="bg-[rgba(239,68,68,0.1)] border border-[var(--danger)] text-[var(--danger)] px-4 py-3 rounded-xl mb-8">
            <strong>Current Warnings: {warnings} / 2</strong>
            {warnings >= 1 && <div className="text-sm mt-1">One more warning and your exam will be automatically submitted!</div>}
          </div>
          <button 
            onClick={enterFullscreenAndStart}
            className="btn btn-primary text-xl px-10 py-4 shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] hover:-translate-y-1 transition-all w-full"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : <><Maximize className="w-6 h-6 mr-2" /> Enter Fullscreen</>}
          </button>
        </div>
      </div>
    );
  }

  // Active Exam Interface
  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-white overflow-hidden">
      {/* Premium Header */}
      <header className="exam-header border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-[var(--accent)] p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <Code className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight leading-none">FRONTEND ASSESSMENT</h2>
            <span className="text-[10px] text-zinc-500 uppercase font-medium tracking-widest mt-1 block">Module: Layout & Styling</span>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
             <div className={`p-1 px-3 rounded bg-zinc-800 border border-white/5 text-[10px] font-bold uppercase tracking-wider ${previewsLeft === 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                Previews Left: {previewsLeft}
             </div>
             <button 
                onClick={togglePreview}
                className={`btn flex items-center gap-2 text-xs px-4 py-2 border h-auto min-h-0 ${showPreview ? 'bg-zinc-800 border-white/10 text-zinc-300' : 'bg-[var(--success)]/10 border-[var(--success)]/20 text-[var(--success)] hover:bg-[var(--success)]/20'}`}
             >
                {showPreview ? <><EyeOff className="w-4 h-4" /> Close Preview</> : <><Eye className="w-4 h-4" /> Run Preview</>}
             </button>
          </div>

          <div className="flex items-center bg-zinc-900/50 rounded-full px-4 py-1.5 border border-white/5 shadow-inner">
            <div className={`flex items-center gap-3 font-bold tabular-nums
              ${time < 300 ? 'text-[var(--danger)] animate-pulse' : 'text-[var(--accent)]'}`}>
              <Clock className="w-4 h-4 opacity-70" />
              <span className="text-sm">{Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}</span>
            </div>
            
            <div className="w-px h-3 bg-white/10 mx-4"></div>
            
            <div className={`flex items-center gap-2 text-xs font-semibold 
              ${warnings > 0 ? 'text-[var(--warning)]' : 'text-zinc-500'}`}>
              <ShieldAlert className="w-4 h-4 opacity-70" /> 
              <span>Warnings: {warnings}/2</span>
            </div>
          </div>
          
          <button 
            onClick={() => handleComplete(false)}
            className="btn btn-primary text-xs px-6 py-2.5 font-bold uppercase tracking-wider h-auto min-h-0"
            disabled={submitting}
          >
            {submitting ? 'Processing...' : 'Finish & Submit'}
          </button>
        </div>
      </header>
      
      {/* IDE Body */}
      <main className="flex-1 flex overflow-hidden relative">
         {/* Left Sidebar: Instructions & Target */}
         <aside className={`${showPreview ? 'w-0 opacity-0 pointer-events-none' : 'w-80'} flex flex-col border-r border-white/5 bg-zinc-900/20 backdrop-blur-md shrink-0 transition-all duration-500 overflow-hidden`}>
             <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
                 <Play className="w-3 h-3 text-[var(--success)]" />
                 <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Assignment</span>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar">
                 <div className="p-6">
                     <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></div>
                         Objective
                     </h3>
                     <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                         Replicate the target design below using clean, semantic HTML and CSS. Focus on accuracy, responsiveness, and spacing.
                     </p>
                     
                     <div className="space-y-6">
                         <div className="group relative">
                             <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl opacity-20 blur group-hover:opacity-40 transition duration-1000"></div>
                             <div className="relative bg-zinc-950 rounded-xl overflow-hidden border border-white/10">
                                 <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex justify-between items-center">
                                     <span className="text-[10px] font-bold text-zinc-500">TARGET DESIGN</span>
                                 </div>
                                 <div className="h-48 flex items-center justify-center bg-zinc-900 shadow-inner">
                                     {/* Target Preview */}
                                     <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 shadow-xl shadow-blue-500/20 animate-pulse">
                                         <div className="absolute inset-2 rounded-full bg-zinc-900 flex items-center justify-center border-2 border-white/5">
                                             <div className="w-8 h-1 bg-white/10 rounded-full rotate-45"></div>
                                             <div className="w-8 h-1 bg-white/10 rounded-full -rotate-45 absolute"></div>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>

                         <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                             <h4 className="text-[10px] font-bold text-zinc-500 mb-3 uppercase tracking-widest">Requirements</h4>
                             <ul className="space-y-2">
                                 {['Perfect Circle', 'Linear Gradient', 'Centered Layout', 'Box Shadow'].map((req, i) => (
                                     <li key={i} className="flex items-center gap-2 text-[11px] text-zinc-400">
                                         <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                         {req}
                                     </li>
                                 ))}
                             </ul>
                         </div>
                     </div>
                 </div>
             </div>
             
             <div className="p-4 bg-zinc-950 flex items-center justify-center border-t border-white/5">
                 <span className="text-[9px] text-zinc-600 font-mono tracking-tighter">ENVIRONMENT: NODE.JS v20.x • READY</span>
             </div>
         </aside>
         
         {/* Coding Workspace Shell */}
         <div className="flex-1 flex flex-row bg-[#0d0d0f] overflow-hidden">
              {/* Center: Editor Section */}
              <div className={`${showPreview ? 'w-0 opacity-0 pointer-events-none' : 'flex-1'} flex flex-col transition-all duration-500 overflow-hidden border-r border-white/5`}>
                  {/* Tabs */}
                  <div className="flex bg-black/40 border-b border-white/5 overflow-hidden">
                      <div className="px-6 py-3 bg-[var(--bg-dark)] border-r border-white/5 flex items-center gap-3 relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--accent)]"></div>
                          <Code className="w-3.5 h-3.5 text-[var(--accent)]" />
                          <span className="text-xs font-mono font-medium text-zinc-200">index.html</span>
                      </div>
                      <div className="px-6 py-3 border-r border-white/5 flex items-center gap-3 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
                          <span className="text-xs font-mono">styles.css</span>
                      </div>
                  </div>

                  {/* Editor Shell */}
                  <div className="flex-1 flex overflow-hidden relative group">
                      {/* Gutter (Fake Line Numbers) */}
                      {!showPreview && (
                        <div className="w-12 bg-[#09090b] border-r border-white/5 flex flex-col items-center pt-6 font-mono text-[11px] text-zinc-700 select-none shrink-0">
                            {Array.from({length: 40}).map((_, i) => (
                                <div key={i} className="h-[21px]">{i + 1}</div>
                            ))}
                        </div>
                      )}
                      
                      <textarea
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="flex-1 bg-transparent text-zinc-200 font-mono text-[14px] leading-[21px] p-6 outline-none resize-none custom-scrollbar selection:bg-blue-500/30"
                          spellCheck={false}
                          placeholder="Type your code here..."
                      />

                      {/* Editor Tooling overlay (floating) */}
                      {!showPreview && (
                        <div className="absolute bottom-6 right-6 flex gap-2">
                            <div className="bg-zinc-900/80 backdrop-blur border border-white/10 rounded-lg p-1 shadow-xl flex items-center">
                                <button onClick={() => setCode('')} className="p-2 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                      )}
                  </div>
              </div>

              {/* Right: Live Preview (Show if showPreview is true) */}
              <div className={`${showPreview ? 'flex-1' : 'w-0 opacity-0 pointer-events-none'} flex flex-col transition-all duration-500 bg-white overflow-hidden`}>
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

