import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { getOpenAIClient, getTuning } from "@/lib/clients";

const BodySchema = z.object({
  trialId: z.string().min(1),
  key: z.union([z.literal("1"), z.literal("2")]),
  message: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { trialId, key, message } = BodySchema.parse(await req.json());
    const store = getStore();
    const trial = store.getTrial(trialId);
    if (!trial) return NextResponse.json({ error: "Trial not found" }, { status: 404 });
    const modelId = trial.order[key] === "o3" ? "o3" : ("gpt-5" as const);
    const rawBase = modelId === "o3" ? trial.raw.o3 : trial.raw.gpt5;
    const openai = getOpenAIClient();
    const { maxOutputTokens } = getTuning();

    const composite = `You previously answered the user's prompt as below. Continue the conversation and answer the follow-up.\n\nOriginal prompt:\n${trial.prompt}\n\nYour prior answer:\n${rawBase}\n\nFollow-up from user:\n${message}`;

    const resp = await (openai.responses.create as unknown as (
      args: Record<string, unknown>
    ) => Promise<unknown>)({
      model: modelId,
      input: composite,
      max_output_tokens: maxOutputTokens,
    });

    const getOutputText = (r: unknown): string => {
      if (r && typeof r === "object" && "output_text" in r) {
        const possible = (r as { output_text?: unknown }).output_text;
        if (typeof possible === "string") return possible;
      }
      return "";
    };

    return NextResponse.json({ text: getOutputText(resp) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


