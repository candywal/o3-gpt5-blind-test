"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  totalTrials: number;
  totalChoices: number;
  modelWins: { o3: number; gpt5: number };
};

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setDarkMode(shouldUseDark);
    document.documentElement.setAttribute('data-theme', shouldUseDark ? 'dark' : 'light');

    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', newDarkMode ? 'dark' : 'light');
  };

  const winRate = stats && stats.totalChoices > 0 
    ? {
        o3: Math.round((stats.modelWins.o3 / stats.totalChoices) * 100),
        gpt5: Math.round((stats.modelWins.gpt5 / stats.totalChoices) * 100)
      }
    : { o3: 0, gpt5: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221.5%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      
      <div className="relative min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center hover:shadow-lg transition-shadow duration-200"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold gradient-text">Statistics Dashboard</h1>
                <p className="text-sm text-slate-600">o3 vs GPT-5 Performance Analytics</p>
              </div>
            </div>
            
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white border border-slate-200 rounded-lg transition-all duration-200"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading statistics...</p>
              </div>
            </div>
          ) : stats ? (
            <div className="space-y-8">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-effect rounded-xl p-6 text-center card-hover">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mb-2">{stats.totalTrials}</div>
                  <div className="text-sm text-slate-600">Total Trials</div>
                </div>

                <div className="glass-effect rounded-xl p-6 text-center card-hover">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mb-2">{stats.totalChoices}</div>
                  <div className="text-sm text-slate-600">Choices Made</div>
                </div>

                <div className="glass-effect rounded-xl p-6 text-center card-hover">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">{stats.modelWins.o3}</div>
                  <div className="text-sm text-slate-600">o3 Wins</div>
                </div>

                <div className="glass-effect rounded-xl p-6 text-center card-hover">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">{stats.modelWins.gpt5}</div>
                  <div className="text-sm text-slate-600">GPT-5 Wins</div>
                </div>
              </div>

              {/* Win Rate Comparison */}
              {stats.totalChoices > 0 && (
                <div className="glass-effect rounded-xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Model Performance</h2>
                      <p className="text-sm text-slate-600">Win rate comparison between models</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-blue-600">o3: {winRate.o3}%</span>
                      <span className="text-sm font-medium text-purple-600">GPT-5: {winRate.gpt5}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-1000 ease-out"
                        style={{ width: `${winRate.o3}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Model Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">o3</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900">OpenAI o3</h3>
                          <p className="text-xs text-blue-700">Reasoning Model</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-800">Wins</span>
                          <span className="font-bold text-blue-900">{stats.modelWins.o3}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-800">Win Rate</span>
                          <span className="font-bold text-blue-900">{winRate.o3}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">GPT</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-purple-900">OpenAI GPT-5</h3>
                          <p className="text-xs text-purple-700">Language Model</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-purple-800">Wins</span>
                          <span className="font-bold text-purple-900">{stats.modelWins.gpt5}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-purple-800">Win Rate</span>
                          <span className="font-bold text-purple-900">{winRate.gpt5}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Winner Declaration */}
                  {stats.modelWins.o3 !== stats.modelWins.gpt5 && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l4 9h4l4-9m-8 9l-2 7m2-7h4m0 0l2 7" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-yellow-900">Current Leader</h4>
                          <p className="text-sm text-yellow-800">
                            {stats.modelWins.o3 > stats.modelWins.gpt5 ? 'OpenAI o3' : 'OpenAI GPT-5'} is leading with {Math.max(stats.modelWins.o3, stats.modelWins.gpt5)} wins 
                            ({Math.max(winRate.o3, winRate.gpt5)}% win rate)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Raw Data */}
              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Raw Statistics</h3>
                    <p className="text-sm text-slate-600">JSON data for reference</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm font-mono text-slate-700">{JSON.stringify(stats, null, 2)}</pre>
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center pt-8">
                <Link 
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start New Comparison
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No statistics available</h3>
              <p className="text-slate-600 mb-6">Start making comparisons to see statistics here.</p>
              <Link 
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200"
              >
                Make Your First Comparison
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


