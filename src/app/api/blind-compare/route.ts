import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, getModelIds, getOpenAIClient, getTuning } from "@/lib/clients";
import { z } from "zod";

const BodySchema = z.object({
  prompt: z.string().min(1),
});

function buildParaphrasePrompt(text: string) {
  return (
    "Paraphrase the following text to preserve factual content and reasoning, while removing stylistic fingerprints (tone, phrasing, idioms).\n" +
    "Do NOT add or remove information. Keep structure simple and neutral.\n" +
    "Return plain text only.\n\n" +
    text
  );
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { prompt } = BodySchema.parse(json);

    const openai = getOpenAIClient();
    const anthropic = getAnthropicClient();
    const { reasoningModel, thinkingModel, claudeModel } = getModelIds();
    const { openaiTemperature, paraphraseTemperature, maxOutputTokens } = getTuning();

    // Call OpenAI o3 and GPT-5 in parallel
    const [o3Resp, gpt5Resp] = await Promise.all([
      openai.responses.create({
        model: reasoningModel,
        input: prompt,
        temperature: openaiTemperature,
        max_output_tokens: maxOutputTokens,
      } as any),
      openai.responses.create({
        model: thinkingModel,
        input: prompt,
        temperature: openaiTemperature,
        max_output_tokens: maxOutputTokens,
      } as any),
    ]);

    const o3Text = o3Resp.output_text ?? "";
    const gpt5Text = gpt5Resp.output_text ?? "";

    // Paraphrase with Claude Opus 4.1 in parallel
    const [paraA, paraB] = await Promise.all([
      anthropic.messages.create({
        model: claudeModel,
        max_tokens: maxOutputTokens,
        temperature: paraphraseTemperature,
        messages: [
          { role: "user", content: buildParaphrasePrompt(o3Text) },
        ],
      }),
      anthropic.messages.create({
        model: claudeModel,
        max_tokens: maxOutputTokens,
        temperature: paraphraseTemperature,
        messages: [
          { role: "user", content: buildParaphrasePrompt(gpt5Text) },
        ],
      }),
    ]);

    const getAnthropicText = (m: any) =>
      (m?.content?.[0]?.text as string) || "";

    const A = getAnthropicText(paraA);
    const B = getAnthropicText(paraB);

    // Randomize order so user cannot infer which is which
    const items: Array<{ id: string; text: string }> = [
      { id: "o3", text: A },
      { id: "gpt5", text: B },
    ];
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    return NextResponse.json({
      outputs: items.map((it, idx) => ({ key: String(idx + 1), text: it.text })),
    });
  } catch (err: any) {
    console.error("blind-compare error", err);
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 400 }
    );
  }
}


