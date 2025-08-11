"use client";
import { useState } from "react";

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

  async function runCompare() {
    setLoading(true);
    setError(null);
    setOutputs(null);
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
      setChosen(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unexpected error";
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
    } catch (e) {}
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
    <div className="min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold mb-4">o3 vs GPT‑5 (blind) with Claude Opus 4.1 paraphrase</h1>
        <p className="text-sm text-gray-600 mb-4">
          Enter a prompt. We call OpenAI o3 and GPT‑5, then paraphrase both with Claude Opus 4.1 to normalize style. Outputs are shuffled.
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask anything…"
          className="w-full border rounded-md p-3 h-36 focus:outline-none focus:ring-2 focus:ring-black/20"
        />
        <div className="mt-3 flex gap-2">
          <button
            onClick={runCompare}
            disabled={loading || !prompt.trim()}
            className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
          >
            {loading ? "Running…" : "Run blind compare"}
          </button>
          <button
            onClick={() => setOutputs(null)}
            className="px-4 py-2 rounded-md border"
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="mt-4 text-red-600 text-sm">{error}</div>
        )}

        {outputs && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[...outputs].sort((a, b) => (chosen === a.key ? -1 : chosen === b.key ? 1 : 0)).map((o) => (
              <div key={o.key} className={`text-left border rounded-xl p-5 bg-white/80 backdrop-blur shadow-sm ${chosen === o.key ? "sm:col-span-2" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-500">Output {o.key}</div>
                  {!chosen && (
                    <button onClick={() => choose(o.key as "1" | "2")} className="text-xs text-gray-600 hover:underline">Click to choose</button>
                  )}
                </div>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">{o.text}</div>
                {chosen === o.key && (
                  <div className="mt-4 flex gap-2">
                    <select value={chat.key ?? o.key} onChange={(e) => setChat((c) => ({ ...c, key: (e.target.value as "1" | "2") || null }))} className="border rounded-md px-2 py-2">
                      <option value="1">Chat with Output 1</option>
                      <option value="2">Chat with Output 2</option>
                    </select>
                    <input value={chat.text} onChange={(e) => setChat((c) => ({ ...c, text: e.target.value }))} placeholder="Ask a follow-up…" className="flex-1 border rounded-md px-3" />
                    <button onClick={sendChat} disabled={chat.sending} className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50">Send</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {chosen && (
          <div className="mt-6 p-3 rounded-md bg-green-50 border text-green-900 text-sm">
            You selected Output {chosen}. Thanks! Stats below update as you vote.
          </div>
        )}

        {stats && (
          <div className="mt-6 border rounded-lg p-4 bg-white">
            <div className="font-medium mb-2">Aggregate stats (this server session)</div>
            <div className="text-sm text-gray-700">Trials: {stats.totalTrials}</div>
            <div className="text-sm text-gray-700">Choices: {stats.totalChoices}</div>
            <div className="text-sm text-gray-700 mt-2">Wins</div>
            <div className="text-sm">o3: {stats.modelWins.o3}</div>
            <div className="text-sm">gpt-5: {stats.modelWins.gpt5}</div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
            <div className="w-full sm:max-w-lg bg-white rounded-2xl shadow-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-base font-semibold">Thanks for your pick</div>
                  <div className="text-sm text-gray-600">Would you like to reveal which model wrote each output or continue chatting with your choice?</div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-500 hover:text-black">✕</button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button onClick={doReveal} className="px-4 py-2 rounded-md border hover:border-black/40">Reveal models</button>
                <div className="flex gap-2">
                  <select value={chat.key ?? ""} onChange={(e) => setChat((c) => ({ ...c, key: (e.target.value as "1" | "2") || null }))} className="border rounded-md px-2 py-2">
                    <option value="">Choose output…</option>
                    <option value="1">Chat with Output 1</option>
                    <option value="2">Chat with Output 2</option>
                  </select>
                  <input value={chat.text} onChange={(e) => setChat((c) => ({ ...c, text: e.target.value }))} placeholder="Ask a follow-up…" className="flex-1 border rounded-md px-3" />
                  <button onClick={sendChat} disabled={chat.sending} className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50">Send</button>
                </div>
              </div>
              {reveal && (
                <div className="mt-4 text-sm text-gray-700">
                  Output 1 was <span className="font-medium">{reveal.order[1] === "o3" ? "o3" : "gpt-5"}</span>; Output 2 was <span className="font-medium">{reveal.order[2] === "o3" ? "o3" : "gpt-5"}</span>.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
