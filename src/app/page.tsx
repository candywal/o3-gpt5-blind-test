"use client";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [outputs, setOutputs] = useState<{ key: string; text: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    } catch (e: any) {
      setError(e.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
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
              <div key={o.key} className="border rounded-lg p-4 whitespace-pre-wrap bg-white">
                <div className="text-xs text-gray-500 mb-2">Output {o.key}</div>
                {o.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
