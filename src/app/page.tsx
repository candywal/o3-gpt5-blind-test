"use client";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [outputs, setOutputs] = useState<{ key: string; text: string }[] | null>(null);
  const [trialId, setTrialId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
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
    } catch (e) {}
  }

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-3xl">
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
            {outputs.map((o) => (
              <button
                key={o.key}
                onClick={() => choose(o.key as "1" | "2")}
                className={`text-left border rounded-lg p-4 whitespace-pre-wrap bg-white hover:border-black/40 transition ${
                  chosen === o.key ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-500">Output {o.key}</div>
                  <div className="text-xs text-gray-400">Click to choose</div>
                </div>
                {o.text}
              </button>
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
      </div>
    </div>
  );
}
