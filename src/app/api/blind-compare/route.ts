import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, getModelIds, getOpenAIClient, getTuning } from "@/lib/clients";
import { getStore } from "@/lib/store";
import { z } from "zod";

const BodySchema = z.object({
  prompt: z.string().min(1),
});

function buildParaphrasePrompt(text: string) {
  const prefix =
    process.env.PARAPHRASE_PROMPT_PREFIX ||
    "Paraphrase the following text to preserve factual content and reasoning, while removing stylistic fingerprints (tone, phrasing, idioms). Do NOT add or remove information. Keep structure simple and neutral. Return plain text only.";
  return `${prefix}\n\n${text}`;
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { prompt } = BodySchema.parse(json);

    const openai = getOpenAIClient();
    const anthropic = getAnthropicClient();
    const { reasoningModel, thinkingModel, claudeModel } = getModelIds();
    const { paraphraseTemperature, maxOutputTokens } = getTuning();

    // Call OpenAI o3 and GPT-5 in parallel
    const [o3RespU, gpt5RespU] = await Promise.all([
      (openai.responses.create as unknown as (
        args: Record<string, unknown>
      ) => Promise<unknown>)({
        model: reasoningModel,
        input: prompt,
        max_output_tokens: maxOutputTokens,
      }),
      (openai.responses.create as unknown as (
        args: Record<string, unknown>
      ) => Promise<unknown>)({
        model: thinkingModel,
        input: prompt,
        max_output_tokens: maxOutputTokens,
      }),
    ]);

    const getOutputText = (resp: unknown): string => {
      if (resp && typeof resp === "object" && "output_text" in resp) {
        const val = (resp as { output_text?: unknown }).output_text;
        if (typeof val === "string") return val;
      }
      return "";
    };

    const o3Text = getOutputText(o3RespU);
    const gpt5Text = getOutputText(gpt5RespU);

    // Paraphrase with Claude Opus 4.1 in parallel
    const [paraA, paraB] = await Promise.all([
      (anthropic.messages.create as unknown as (
        args: Record<string, unknown>
      ) => Promise<unknown>)({
        model: claudeModel,
        max_tokens: maxOutputTokens,
        temperature: paraphraseTemperature,
        messages: [
          { role: "user", content: buildParaphrasePrompt(o3Text) },
        ],
      }),
      (anthropic.messages.create as unknown as (
        args: Record<string, unknown>
      ) => Promise<unknown>)({
        model: claudeModel,
        max_tokens: maxOutputTokens,
        temperature: paraphraseTemperature,
        messages: [
          { role: "user", content: buildParaphrasePrompt(gpt5Text) },
        ],
      }),
    ]);

    type MinimalAnthropicMessage = {
      content?: Array<{ type?: string; text?: string }>;
    };
    const getAnthropicText = (m: unknown): string => {
      const msg = m as MinimalAnthropicMessage;
      if (!msg?.content || !Array.isArray(msg.content)) return "";
      for (const part of msg.content) {
        if (part && part.type === "text" && typeof part.text === "string") {
          return part.text;
        }
      }
      const first = msg.content[0] as { text?: unknown } | undefined;
      return typeof first?.text === "string" ? first.text : "";
    };

    const A = getAnthropicText(paraA);
    const B = getAnthropicText(paraB);

    // Randomize order so user cannot infer which is which
    const items: Array<{ id: "o3" | "gpt5"; text: string }> = [
      { id: "o3", text: A },
      { id: "gpt5", text: B },
    ];
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    const key1Model = items[0].id;
    const key2Model = items[1].id;

    const store = getStore();
    const trial = store.createTrial({
      prompt,
      order: { "1": key1Model, "2": key2Model },
      raw: { o3: o3Text, gpt5: gpt5Text },
      paraphrased: { "1": items[0].text, "2": items[1].text },
    });

    return NextResponse.json({
      trialId: trial.trialId,
      outputs: [
        { key: "1", text: trial.paraphrased["1"] },
        { key: "2", text: trial.paraphrased["2"] },
      ],
    });
  } catch (err: unknown) {
    console.error("blind-compare error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


