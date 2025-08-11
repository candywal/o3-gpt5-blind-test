"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [outputs, setOutputs] = useState<{ key: string; text: string }[] | null>(null);
  const [trialId, setTrialId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reveal, setReveal] = useState<null | { order: { 1: "o3" | "gpt5"; 2: "o3" | "gpt5" } }>(null);
  const [chat, setChat] = useState<{ key: "1" | "2" | null; text: string; sending: boolean }>({ key: null, text: "", sending: false });
  const [stats, setStats] = useState<null | { totalTrials: number; totalChoices: number; modelWins: { o3: number; gpt5: number } }>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState<Array<{ prompt: string; timestamp: number; chosen?: string; revealed?: { order: { 1: "o3" | "gpt5"; 2: "o3" | "gpt5" } } }>>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setDarkMode(shouldUseDark);
    document.documentElement.setAttribute('data-theme', shouldUseDark ? 'dark' : 'light');
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', newDarkMode ? 'dark' : 'light');
  };

  async function runCompare() {
    setLoading(true);
    setError(null);
    setOutputs(null);
    setChosen(null);
    setReveal(null);
    setChat({ key: null, text: "", sending: false });
    
    const historyEntry = { prompt, timestamp: Date.now() };
    setHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
    
    try {
      const res = await fetch("/api/blind-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setOutputs(data.outputs);
      setTrialId(data.trialId);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unexpected error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function choose(key: "1" | "2") {
    if (!trialId) return;
    setChosen(key);
    try {
      await fetch("/api/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trialId, choiceKey: key, participantId: "anon" }),
      });
      const s = await fetch("/api/stats").then((r) => r.json());
      setStats(s);
      setShowModal(true);
    } catch {}
  }

  async function doReveal() {
    if (!trialId) return;
    const r = await fetch("/api/reveal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trialId }) });
    const data = await r.json();
    if (r.ok) setReveal({ order: { 1: data.order["1"], 2: data.order["2"] } });
  }

  async function sendChat() {
    if (!trialId || !chat.key || !chat.text.trim()) return;
    setChat((c) => ({ ...c, sending: true }));
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trialId, key: chat.key, message: chat.text }) });
      const j = await r.json();
      if (r.ok) {
        alert(`Reply from Output ${chat.key}:\n\n${j.text}`);
      }
    } finally {
      setChat({ key: null, text: "", sending: false });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221.5%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      
      <div className="relative min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">AI Model Arena</h1>
                <p className="text-sm text-slate-600">o3 vs GPT-5 Blind Comparison</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link 
                href="/stats" 
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white/80 hover:bg-white border border-slate-200 rounded-lg transition-all duration-200 hover:shadow-md"
              >
                📊 Stats
              </Link>
              <button
                onClick={toggleDarkMode}
                className="p-2 text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white border border-slate-200 rounded-lg transition-all duration-200"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </header>

          {/* Main Input Section */}
          <div className="glass-effect rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Enter Your Prompt</h2>
              <p className="text-sm text-slate-600">
                We&apos;ll generate responses from both o3 and GPT-5, paraphrase them with Claude Opus 4.1 to normalize style, and present them blind for comparison.
              </p>
            </div>
            
            <div className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask anything... Try questions about coding, creative writing, analysis, or problem-solving"
                className="w-full border border-slate-200 rounded-xl p-4 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 resize-none bg-white text-slate-900 placeholder-slate-500"
                maxLength={2000}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {prompt.length}/2000 characters
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setPrompt("");
                      setOutputs(null);
                      setError(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all duration-200"
                  >
                    Clear
                  </button>
                  <button
                    onClick={runCompare}
                    disabled={loading || !prompt.trim()}
                    className="px-6 py-2 font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-400 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Run Comparison
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="glass-effect rounded-xl p-4 mb-6 border-red-200 bg-red-50/80">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-red-600 mt-0.5">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-red-900 mb-1">Error occurred</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Outputs Display */}
          {outputs && (
            <div className="space-y-6">
              {!chosen && (
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Choose Your Preferred Response</h3>
                  <p className="text-sm text-slate-600 mb-6">Click on the response you think is better. Models are randomly assigned to outputs.</p>
                </div>
              )}
              
              <div className={`grid gap-6 ${chosen ? "lg:grid-cols-1" : "lg:grid-cols-2"} transition-all duration-500`}>
                {[...outputs].sort((a, b) => (chosen === a.key ? -1 : chosen === b.key ? 1 : 0)).map((o) => (
                  <div 
                    key={o.key} 
                    className={`group relative glass-effect rounded-2xl p-6 shadow-xl transition-all duration-300 ${!chosen ? "card-hover cursor-pointer" : ""} ${chosen === o.key ? "ring-2 ring-blue-500 bg-blue-50/80" : ""}`}
                    onClick={() => !chosen && choose(o.key as "1" | "2")}
                  >
                    {/* Output Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${chosen === o.key ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                          {o.key}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-700">
                            Output {o.key} {chosen === o.key && "✓ Selected"}
                          </div>
                          {reveal && (
                            <div className="text-xs text-slate-500">
                              Generated by {reveal.order[o.key as "1" | "2"] === "o3" ? "OpenAI o3" : "OpenAI GPT-5"}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {!chosen && (
                        <div className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors duration-200">
                          Click to choose
                        </div>
                      )}
                    </div>

                    {/* Output Content */}
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                        {o.text}
                      </div>
                    </div>

                    {/* Chat Interface for Chosen Output */}
                    {chosen === o.key && (
                      <div className="mt-6 pt-6 border-t border-slate-200">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="text-sm font-medium text-slate-700">Continue the conversation</span>
                        </div>
                        <div className="flex gap-3">
                          <select 
                            value={chat.key ?? o.key} 
                            onChange={(e) => setChat((c) => ({ ...c, key: (e.target.value as "1" | "2") || null }))} 
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            <option value="1">Chat with Output 1</option>
                            <option value="2">Chat with Output 2</option>
                          </select>
                          <input 
                            value={chat.text} 
                            onChange={(e) => setChat((c) => ({ ...c, text: e.target.value }))} 
                            placeholder="Ask a follow-up question..."
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                          <button 
                            onClick={sendChat} 
                            disabled={chat.sending || !chat.text.trim()} 
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 rounded-lg transition-colors duration-200"
                          >
                            {chat.sending ? "..." : "Send"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {chosen && (
            <div className="glass-effect rounded-xl p-4 mb-6 border-green-200 bg-green-50/80">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-green-600 mt-0.5">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-green-900 mb-1">Choice recorded!</h3>
                  <p className="text-sm text-green-700">You selected Output {chosen}. Your vote has been added to the stats.</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats Display */}
          {stats && (
            <div className="glass-effect rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Session Stats</h3>
                  <p className="text-sm text-slate-600">Current comparison data</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{stats.totalTrials}</div>
                  <div className="text-xs text-slate-600">Total Trials</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{stats.totalChoices}</div>
                  <div className="text-xs text-slate-600">Choices Made</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.modelWins.o3}</div>
                  <div className="text-xs text-slate-600">o3 Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.modelWins.gpt5}</div>
                  <div className="text-xs text-slate-600">GPT-5 Wins</div>
                </div>
              </div>

              {stats.totalChoices > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                    <span>Win Rate</span>
                    <span>{Math.round((Math.max(stats.modelWins.o3, stats.modelWins.gpt5) / stats.totalChoices) * 100)}% leading</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.modelWins.o3 / (stats.modelWins.o3 + stats.modelWins.gpt5)) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>o3: {stats.totalChoices > 0 ? Math.round((stats.modelWins.o3 / stats.totalChoices) * 100) : 0}%</span>
                    <span>GPT-5: {stats.totalChoices > 0 ? Math.round((stats.modelWins.gpt5 / stats.totalChoices) * 100) : 0}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Section */}
          {history.length > 0 && (
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Recent Prompts</h3>
                  <p className="text-sm text-slate-600">Your comparison history</p>
                </div>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {history.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors duration-200">
                    <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium text-slate-600 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 line-clamp-2 leading-relaxed">{item.prompt}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                        {item.chosen && <span>• Chose Output {item.chosen}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => setPrompt(item.prompt)}
                      className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors duration-200"
                    >
                      Reuse
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50 animate-in fade-in duration-200">
              <div className="w-full sm:max-w-2xl glass-effect rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">Great choice!</h3>
                      <p className="text-sm text-slate-600">What would you like to do next?</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="space-y-4">
                  {/* Reveal Models Section */}
                  <div className="p-4 border border-slate-200 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center gap-3 mb-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="font-medium text-slate-900">Reveal the models</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      Curious which AI generated each response? Click to see which was o3 and which was GPT-5.
                    </p>
                    <button 
                      onClick={doReveal} 
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {reveal ? "Models Revealed!" : "Reveal Models"}
                    </button>
                    
                    {reveal && (
                      <div className="mt-4 p-3 bg-white/80 rounded-lg border">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-medium text-slate-900">Output 1</div>
                            <div className="text-xs text-slate-600 mb-2">was generated by</div>
                            <div className={`px-3 py-2 rounded-lg font-bold ${reveal.order[1] === "o3" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                              {reveal.order[1] === "o3" ? "OpenAI o3" : "OpenAI GPT-5"}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-slate-900">Output 2</div>
                            <div className="text-xs text-slate-600 mb-2">was generated by</div>
                            <div className={`px-3 py-2 rounded-lg font-bold ${reveal.order[2] === "o3" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                              {reveal.order[2] === "o3" ? "OpenAI o3" : "OpenAI GPT-5"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Continue Chat Section */}
                  <div className="p-4 border border-slate-200 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50">
                    <div className="flex items-center gap-3 mb-3">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="font-medium text-slate-900">Continue the conversation</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      Ask follow-up questions to either model to dive deeper into their responses.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select 
                        value={chat.key ?? ""} 
                        onChange={(e) => setChat((c) => ({ ...c, key: (e.target.value as "1" | "2") || null }))} 
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        <option value="">Choose output...</option>
                        <option value="1">Chat with Output 1</option>
                        <option value="2">Chat with Output 2</option>
                      </select>
                      <div className="flex gap-3 flex-1">
                        <input 
                          value={chat.text} 
                          onChange={(e) => setChat((c) => ({ ...c, text: e.target.value }))} 
                          placeholder="Ask a follow-up question..."
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                        <button 
                          onClick={sendChat} 
                          disabled={chat.sending || !chat.text.trim() || !chat.key} 
                          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 rounded-lg transition-colors duration-200"
                        >
                          {chat.sending ? "..." : "Send"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="mt-6 pt-4 border-t border-slate-200 text-center">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors duration-200"
                  >
                    Continue exploring comparisons
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
