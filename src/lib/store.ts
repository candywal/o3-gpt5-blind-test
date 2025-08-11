import { randomUUID } from "crypto";

export type ModelId = "o3" | "gpt5";

export type TrialRecord = {
  trialId: string;
  prompt: string;
  // order: key "1" and "2" mapped to model ids
  order: { [key in "1" | "2"]: ModelId };
  // raw (pre-paraphrase) model outputs
  raw: { o3: string; gpt5: string };
  // paraphrased outputs in the presented order
  paraphrased: { [key in "1" | "2"]: string };
  createdAt: number;
};

export type ChoiceRecord = {
  trialId: string;
  participantId: string;
  choiceKey: "1" | "2";
  chosenModel: ModelId;
  reactedMs: number | null;
  createdAt: number;
};

export type AggregateStats = {
  totalTrials: number;
  totalChoices: number;
  modelWins: { o3: number; gpt5: number };
};

class MemoryStore {
  trials = new Map<string, TrialRecord>();
  choices: ChoiceRecord[] = [];

  createTrial(input: Omit<TrialRecord, "trialId" | "createdAt">): TrialRecord {
    const trialId = randomUUID();
    const record: TrialRecord = {
      ...input,
      trialId,
      createdAt: Date.now(),
    };
    this.trials.set(trialId, record);
    return record;
  }

  getTrial(trialId: string): TrialRecord | undefined {
    return this.trials.get(trialId);
  }

  recordChoice(choice: ChoiceRecord): void {
    this.choices.push(choice);
  }

  getStats(): AggregateStats {
    const stats: AggregateStats = {
      totalTrials: this.trials.size,
      totalChoices: this.choices.length,
      modelWins: { o3: 0, gpt5: 0 },
    };
    for (const c of this.choices) {
      stats.modelWins[c.chosenModel] += 1;
    }
    return stats;
  }
}

// Singleton store for the runtime
let globalStore: MemoryStore | null = null;
export function getStore(): MemoryStore {
  if (!globalStore) globalStore = new MemoryStore();
  return globalStore;
}


