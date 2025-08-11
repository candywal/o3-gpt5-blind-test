"use client";
import { useEffect, useState } from "react";

type Stats = {
  totalTrials: number;
  totalChoices: number;
  modelWins: { o3: number; gpt5: number };
};

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [show, setShow] = useState(true);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-3xl flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Stats</h1>
        <button onClick={() => setShow((s) => !s)} className="px-3 py-1.5 rounded-md border">
          {show ? "Hide" : "Show"} stats
        </button>
      </div>
      {show && (
        <div className="mx-auto max-w-3xl mt-4 border rounded-lg p-4 bg-white">
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(stats, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}


