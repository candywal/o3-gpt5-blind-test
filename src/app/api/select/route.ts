import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";

const BodySchema = z.object({
  trialId: z.string().min(1),
  choiceKey: z.union([z.literal("1"), z.literal("2")]),
  participantId: z.string().min(1).default("anon"),
});

export async function POST(req: NextRequest) {
  try {
    const { trialId, choiceKey, participantId } = BodySchema.parse(
      await req.json()
    );
    const store = getStore();
    const trial = store.getTrial(trialId);
    if (!trial) {
      return NextResponse.json({ error: "Trial not found" }, { status: 404 });
    }
    const model = trial.order[choiceKey];
    store.recordChoice({
      trialId,
      participantId,
      choiceKey,
      chosenModel: model,
      reactedMs: null,
      createdAt: Date.now(),
    });
    return NextResponse.json({ ok: true, chosenModel: model });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


