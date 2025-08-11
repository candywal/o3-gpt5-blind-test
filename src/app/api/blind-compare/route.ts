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
    console.log("Making OpenAI API calls...", { reasoningModel, thinkingModel });
    const [o3RespU, gpt5RespU] = await Promise.all([
      openai.chat.completions.create({
        model: reasoningModel,
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: maxOutputTokens,
      }).catch(err => {
        console.error("o3 API error:", err);
        throw err;
      }),
      openai.chat.completions.create({
        model: thinkingModel,
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: maxOutputTokens,
      }).catch(err => {
        console.error("gpt5 API error:", err);
        throw err;
      }),
    ]);

    const getOutputText = (resp: unknown): string => {
      if (resp && typeof resp === "object") {
        // Handle standard OpenAI chat completion response
        const completion = resp as {
          choices?: Array<{
            message?: {
              content?: string;
            };
          }>;
          output_text?: string;
        };
        if (completion.choices && completion.choices[0] && completion.choices[0].message) {
          return completion.choices[0].message.content || "";
        }
        // Fallback for other response formats
        if ("output_text" in resp) {
          const val = (resp as { output_text?: unknown }).output_text;
          if (typeof val === "string") return val;
        }
      }
      return "";
    };

    const o3Text = getOutputText(o3RespU);
    const gpt5Text = getOutputText(gpt5RespU);
    
    console.log("OpenAI responses:", { 
      o3Length: o3Text.length, 
      gpt5Length: gpt5Text.length,
      o3Preview: o3Text.substring(0, 100),
      gpt5Preview: gpt5Text.substring(0, 100)
    });

    // Paraphrase with Claude Opus 4.1 in parallel
    console.log("Making Claude API calls...", { claudeModel });
    const [paraA, paraB] = await Promise.all([
      anthropic.messages.create({
        model: claudeModel,
        max_tokens: maxOutputTokens,
        temperature: paraphraseTemperature,
        messages: [
          { role: "user", content: buildParaphrasePrompt(o3Text) },
        ],
      }).catch(err => {
        console.error("Claude API error (o3 paraphrase):", err);
        throw err;
      }),
      anthropic.messages.create({
        model: claudeModel,
        max_tokens: maxOutputTokens,
        temperature: paraphraseTemperature,
        messages: [
          { role: "user", content: buildParaphrasePrompt(gpt5Text) },
        ],
      }).catch(err => {
        console.error("Claude API error (gpt5 paraphrase):", err);
        throw err;
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
    let message = err instanceof Error ? err.message : "Unknown error";
    
    // Provide helpful error messages for common issues
    if (message.includes("OPENAI_API_KEY")) {
      message = "OpenAI API key is missing. Please set OPENAI_API_KEY in your .env.local file.";
    } else if (message.includes("ANTHROPIC_API_KEY")) {
      message = "Anthropic API key is missing. Please set ANTHROPIC_API_KEY in your .env.local file.";
    } else if (message.includes("not found") || message.includes("404")) {
      message = "Model not available. Please check your model configuration.";
    }
    
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


