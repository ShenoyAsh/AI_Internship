import { useState, useEffect } from 'react';
import { BENCHMARK_TEST_CASES } from './data/benchmarkData';
import { compileSimulated, compileLiveWithGemini } from './services/compilerEngine';
import type { AppSchema, CompilationResult } from './types/compiler';
import { AppRuntime } from './runtime/appRuntime';
import { EvaluationPanel } from './eval/evaluationPanel';
import * as Icons from 'lucide-react';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(BENCHMARK_TEST_CASES[0].prompt);
  const [selectedPresetId, setSelectedPresetId] = useState(BENCHMARK_TEST_CASES[0].id);

  // Compiler state
  const [compilingState, setCompilingState] = useState<'idle' | 'compiling' | 'finished' | 'failed'>('idle');
  const [progress, setProgress] = useState<{ stage: string; message: string; percent: number }>({ stage: '', message: '', percent: 0 });
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);
  
  // App views
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'preview' | 'schema' | 'stages' | 'diagnostics'>('preview');
  const [globalTab, setGlobalTab] = useState<'workspace' | 'evaluation'>('workspace');

  // Toast notifications
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Sync API Key to LocalStorage
  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  // Handle Preset selection change
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const selectedPreset = BENCHMARK_TEST_CASES.find(c => c.id === presetId);
    if (selectedPreset) {
      setCustomPrompt(selectedPreset.prompt);
    }
  };

  // Run the compilation pipeline
  const runCompilation = async () => {
    if (isLiveMode && !apiKey) {
      alert('Please enter a Gemini API Key to run live compiler pipeline.');
      return;
    }

    setCompilingState('compiling');
    setProgress({ stage: 'starting', message: 'Initializing software compiler pipeline...', percent: 5 });

    try {
      let result: CompilationResult;
      
      if (isLiveMode) {
        result = await compileLiveWithGemini(
          customPrompt,
          apiKey,
          (stage, message, percent) => {
            setProgress({ stage, message, percent });
          }
        );
      } else {
        // Find matching preset precompiled schema template or run dynamic generator
        result = await compileSimulated(
          selectedPresetId,
          customPrompt,
          (stage, message, percent) => {
            setProgress({ stage, message, percent });
          }
        );
      }

      setCompilationResult(result);
      if (result.success && result.schema) {
        setCompilingState('finished');
        setActiveWorkspaceTab('preview');
      } else {
        setCompilingState('failed');
      }
    } catch (error) {
      console.error(error);
      setCompilingState('failed');
    }
  };

  const getStageBadge = (stage: string) => {
    const s = compilationResult?.stages.find(st => st.stage === stage);
    if (!s) return <span className="text-[10px] text-slate-500 font-semibold uppercase">Pending</span>;
    if (s.success) {
      return (
        <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-800 flex items-center gap-1">
          <Icons.Check className="w-3 h-3" /> OK ({s.duration.toFixed(1)}s)
        </span>
      );
    }
    return (
      <span className="text-[10px] bg-rose-950 text-rose-400 px-2 py-0.5 rounded font-bold border border-rose-800 flex items-center gap-1">
        <Icons.X className="w-3 h-3" /> Failed
      </span>
    );
  };

  // Helper: Format JSON with highlight colors
  const renderSchemaJSON = (schema: AppSchema) => {
    return JSON.stringify(schema, null, 2);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* GLOW DECORATIONS */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Toast Notification HUD */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2 pointer-events-auto ${
              t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                : 'bg-rose-950/90 border-rose-500 text-rose-300'
            }`}
          >
            {t.type === 'success' ? <Icons.CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Icons.AlertCircle className="w-4 h-4 text-rose-400" />}
            {t.message}
          </div>
        ))}
      </div>

      {/* HEADER SECTION */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Icons.Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent leading-none">
              AI Code Compiler & Runtime Engine
            </h1>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
              Intent Extraction ⇄ Architecture Design ⇄ Schema Generation ⇄ Refinement & Verification
            </p>
          </div>
        </div>

        {/* Global tab selectors */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 p-0.5 rounded-lg flex">
            <button
              onClick={() => setGlobalTab('workspace')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                globalTab === 'workspace'
                  ? 'bg-slate-800 text-indigo-400 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icons.Layout className="w-3.5 h-3.5" />
              Build Workspace
            </button>
            <button
              onClick={() => setGlobalTab('evaluation')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                globalTab === 'evaluation'
                  ? 'bg-slate-800 text-indigo-400 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icons.ShieldAlert className="w-3.5 h-3.5" />
              Evaluation Benchmark
            </button>
          </div>

          <a
            href="https://github.com"
            target="_blank"
            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Icons.Globe className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* CORE WORKSPACE FRAME */}
      {globalTab === 'workspace' ? (
        <div className="flex-1 p-8 space-y-6 max-w-7-xl mx-auto w-full z-10">
          
          {/* COMPILER CONFIG & PROMPT SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* SETTINGS CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Icons.Settings className="w-4 h-4 text-indigo-400" />
                  Compiler settings
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Configure models and execution gates.</p>
              </div>

              {/* Mode Selection Toggle */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Compilation Pipeline Mode</label>
                <div className="grid grid-cols-2 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setIsLiveMode(false)}
                    className={`text-[10px] font-bold py-1.5 rounded-md transition-all cursor-pointer ${
                      !isLiveMode ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                    }`}
                  >
                    Simulated (Free)
                  </button>
                  <button
                    onClick={() => setIsLiveMode(true)}
                    className={`text-[10px] font-bold py-1.5 rounded-md transition-all cursor-pointer ${
                      isLiveMode ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                    }`}
                  >
                    Live Gemini API
                  </button>
                </div>
              </div>

              {/* API Key configuration */}
              {isLiveMode && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold flex justify-between">
                    <span>Gemini API Key</span>
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      className="text-[9px] text-indigo-400 underline hover:text-indigo-300"
                    >
                      Get Key
                    </a>
                  </label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-850 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[9px] text-slate-500 leading-tight">Key remains saved locally in your browser storage.</p>
                </div>
              )}

              {/* Preset Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Benchmark Presets</label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-850 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <optgroup label="10 Real Product Prompts">
                    {BENCHMARK_TEST_CASES.filter(c => c.type === 'benchmark').map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </optgroup>
                  <optgroup label="10 Edge Cases (Vague/Conflicts)">
                    {BENCHMARK_TEST_CASES.filter(c => c.type === 'edge_case').map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* INPUT PANEL CONSOLE */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Icons.MessageSquare className="w-4 h-4 text-indigo-400" />
                  Natural Language Intent compiler Console
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Specify custom pages, auth rules, or database fields. The compiler parses this into structured blueprints.</p>
              </div>

              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter custom application specifications..."
                className="w-full h-24 bg-slate-950 text-slate-200 text-xs px-3 py-2.5 rounded-lg border border-slate-850 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
              />

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 italic">
                  {isLiveMode ? '🚀 Calling live model: gemini-2.5-flash' : '💡 Pre-populated template loads instantly'}
                </span>

                <button
                  onClick={runCompilation}
                  disabled={compilingState === 'compiling'}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-semibold text-xs px-6 py-2.5 rounded-lg transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {compilingState === 'compiling' ? (
                    <>
                      <Icons.Loader2 className="w-4 h-4 animate-spin" />
                      Compiling...
                    </>
                  ) : (
                    <>
                      <Icons.PlayCircle className="w-4 h-4" />
                      Compile App
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* ACTIVE PIPELINE COMPILER LOADER HUD */}
          {compilingState === 'compiling' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Icons.Hammer className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>Pipeline Execution: <strong>Stage: {progress.stage.toUpperCase()}</strong></span>
                </div>
                <span className="text-xs font-mono text-indigo-400">{progress.percent}%</span>
              </div>
              
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                <div
                  style={{ width: `${progress.percent}%` }}
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                ></div>
              </div>

              <div className="font-mono text-[10px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-850">
                <span className="text-slate-500">$ compiler-daemon --execute --stage={progress.stage}</span>
                <p className="text-slate-300 mt-1">LOG: {progress.message}</p>
              </div>
            </div>
          )}

          {/* WORKSPACE MAIN PANELS split (Left: Schema & Logs, Right: App Runtime Preview) */}
          {compilingState !== 'compiling' && compilationResult && compilationResult.schema ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: COMPILER BLUEPRINTS (5 cols) */}
              <div className="xl:col-span-5 bg-slate-900 border border-slate-800 rounded-xl shadow-xl flex flex-col overflow-hidden">
                
                {/* Compiler tab headers */}
                <div className="border-b border-slate-800 bg-slate-900/50 p-2 flex gap-1">
                  <button
                    onClick={() => setActiveWorkspaceTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeWorkspaceTab === 'preview'
                        ? 'bg-slate-800 text-indigo-400 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icons.Tv className="w-3.5 h-3.5" />
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveWorkspaceTab('schema')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeWorkspaceTab === 'schema'
                        ? 'bg-slate-800 text-indigo-400 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icons.Code className="w-3.5 h-3.5" />
                    Schema JSON
                  </button>
                  <button
                    onClick={() => setActiveWorkspaceTab('stages')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeWorkspaceTab === 'stages'
                        ? 'bg-slate-800 text-indigo-400 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icons.Cpu className="w-3.5 h-3.5" />
                    Stage Logs
                  </button>
                  <button
                    onClick={() => setActiveWorkspaceTab('diagnostics')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeWorkspaceTab === 'diagnostics'
                        ? 'bg-slate-800 text-indigo-400 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icons.ShieldAlert className="w-3.5 h-3.5" />
                    Diagnostics ({compilationResult.diagnostics.length})
                  </button>
                </div>

                {/* Tab content view container */}
                <div className="p-4 min-h-[450px] flex flex-col justify-between">
                  
                  {/* OVERVIEW PANEL */}
                  {activeWorkspaceTab === 'preview' && (
                    <div className="space-y-5">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Compiled Application</span>
                        <h2 className="text-base font-bold text-slate-200 mt-0.5">{compilationResult.schema.appName}</h2>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{compilationResult.schema.appDescription}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">DB Tables</span>
                          <span className="text-sm font-bold text-slate-300">{compilationResult.schema.dbSchema.tables.length}</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">API Routes</span>
                          <span className="text-sm font-bold text-slate-300">{compilationResult.schema.apiSchema.endpoints.length}</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">UI Screens</span>
                          <span className="text-sm font-bold text-slate-300">{compilationResult.schema.uiSchema.pages.length}</span>
                        </div>
                      </div>

                      {/* Assumptions & Clarifications */}
                      <div className="space-y-3 pt-3 border-t border-slate-850">
                        {compilationResult.assumptions.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Reasonable Assumptions Made:</span>
                            <ul className="list-disc pl-4 text-[10px] text-slate-400 space-y-1">
                              {compilationResult.assumptions.map((ass, idx) => (
                                <li key={idx}>{ass}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {compilationResult.clarificationsNeeded.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold block">Missing / Underspecified inputs:</span>
                            <ul className="list-disc pl-4 text-[10px] text-rose-400/90 space-y-1">
                              {compilationResult.clarificationsNeeded.map((cl, idx) => (
                                <li key={idx}>{cl}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SCHEMA CODE TAB */}
                  {activeWorkspaceTab === 'schema' && (
                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 font-mono text-[9px] text-slate-300 h-96 overflow-auto scrollbar-thin">
                        <pre className="whitespace-pre-wrap">{renderSchemaJSON(compilationResult.schema)}</pre>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(renderSchemaJSON(compilationResult.schema!));
                            alert('JSON schema copied to clipboard!');
                          }}
                          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
                        >
                          <Icons.Copy className="w-3.5 h-3.5" />
                          Copy Schema
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STAGES PROCESS TAB */}
                  {activeWorkspaceTab === 'stages' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-850 text-[10px] font-mono">
                        <span className="text-slate-500">Pipeline Execution Statistics:</span>
                        <span className="text-indigo-400 font-bold">
                          Latency: {compilationResult.metrics.totalDuration.toFixed(2)}s | Cost: ${compilationResult.metrics.totalCost.toFixed(5)}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-lg border border-slate-850/50">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span className="text-xs text-slate-300">Stage 1: Intent Parsing</span>
                          </div>
                          {getStageBadge('intent')}
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-lg border border-slate-850/50">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span className="text-xs text-slate-300">Stage 2: Architecture Design</span>
                          </div>
                          {getStageBadge('design')}
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-lg border border-slate-850/50">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span className="text-xs text-slate-300">Stage 3: UI/Auth Schema Gen</span>
                          </div>
                          {getStageBadge('schema')}
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-lg border border-slate-850/50">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span className="text-xs text-slate-300">Stage 4: Refinement & Validation</span>
                          </div>
                          {getStageBadge('refinement')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DIAGNOSTICS & REPAIR TAB */}
                  {activeWorkspaceTab === 'diagnostics' && (
                    <div className="space-y-4">
                      {compilationResult.diagnostics.length === 0 ? (
                        <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                          <Icons.CheckSquare className="w-4 h-4 flex-shrink-0" />
                          Programmatic consistency diagnostics verified. Ready to run.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                          {compilationResult.diagnostics.map((d, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                                d.severity === 'error'
                                  ? 'bg-rose-950/30 border-rose-900/50 text-rose-350'
                                  : 'bg-amber-950/30 border-amber-900/50 text-amber-350'
                              }`}
                            >
                              <Icons.AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="font-mono text-[9px] bg-slate-950 px-1 py-0.5 rounded mr-1">
                                  {d.category.toUpperCase()}
                                </span>
                                <p className="leading-normal">{d.message}</p>
                                <span className="block text-[9px] text-slate-500 font-mono select-all truncate max-w-sm">{d.path}</span>
                                {d.fixApplied && (
                                  <span className="inline-block mt-1.5 text-[9px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-800/50">
                                    ✓ Autorepaired by Engine
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* RIGHT COLUMN: RUNTIME ENVIRONMENT PREVIEW CONTAINER (7 cols) */}
              <div className="xl:col-span-7 space-y-4">
                <AppRuntime schema={compilationResult.schema} />
              </div>

            </div>
          ) : (
            /* ONBOARDING STATE */
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center shadow-xl max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-full bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
                <Icons.Hammer className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-200">No Compiled Application Found</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-normal">
                  Write or select a natural language prompt in the console above and press <strong>Compile App</strong> to generate, validate, and execute an application preview.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-left pt-4 border-t border-slate-850">
                <div className="space-y-1">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">1. Extraction</span>
                  <p className="text-[9px] text-slate-500 leading-normal">Parser isolates entities, attributes, constraints, and roles.</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">2. Validation</span>
                  <p className="text-[9px] text-slate-500 leading-normal">Diagnostics verify UI components map directly to DB Tables & API schemas.</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">3. Execution</span>
                  <p className="text-[9px] text-slate-500 leading-normal">Executable preview renders inside interactive mock database runtime.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* EVALUATION DASHBOARD PANEL */
        <div className="flex-1 p-8 max-w-7-xl mx-auto w-full z-10">
          <EvaluationPanel
            apiKey={apiKey}
            isLiveMode={isLiveMode}
            showToast={showToast}
            onSelectCompiledSchema={(schema) => {
              setCompilationResult({
                success: true,
                schema,
                stages: [{ stage: 'refinement', success: true, duration: 0.1, output: 'Diagnostic check succeeded' }],
                diagnostics: [],
                metrics: { totalDuration: 1.0, totalCost: 0.0001, retries: 0 },
                assumptions: ['Restored from Evaluation gold master template.'],
                clarificationsNeeded: []
              });
              setGlobalTab('workspace');
              setActiveWorkspaceTab('preview');
            }}
          />
        </div>
      )}

      {/* FOOTER METRICS INFO */}
      <footer className="border-t border-slate-900 py-6 px-8 bg-slate-950 text-slate-500 text-[10px] flex items-center justify-between mt-auto">
        <span>🤖 ANTIGRAVITY ENGINE v1.4.1 | COMPILER CODEBASE</span>
        <span>GOOGLE DEEPMIND ADVANCED AGENTIC DEVELOPMENT CHALLENGE</span>
      </footer>

    </div>
  );
}

export default App;
