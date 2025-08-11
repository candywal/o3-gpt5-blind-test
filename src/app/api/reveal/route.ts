import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";

const BodySchema = z.object({ trialId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const { trialId } = BodySchema.parse(await req.json());
    const store = getStore();
    const trial = store.getTrial(trialId);
    if (!trial) return NextResponse.json({ error: "Trial not found" }, { status: 404 });
    return NextResponse.json({
      order: trial.order,
      raw: trial.raw,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


