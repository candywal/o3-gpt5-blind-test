import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY env var");
  }
  return new OpenAI({ apiKey });
}

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY env var");
  }
  return new Anthropic({ apiKey });
}

export function getModelIds() {
  const reasoningModel = process.env.OPENAI_MODEL_REASONING || "o3";
  const thinkingModel = process.env.OPENAI_MODEL_THINKING || "gpt-5";
  const claudeModel =
    process.env.CLAUDE_MODEL || "claude-opus-4-1-20250805";
  return { reasoningModel, thinkingModel, claudeModel };
}

export function getTuning() {
  const openaiTemperature = Number(process.env.OPENAI_TEMPERATURE ?? "0.2");
  const paraphraseTemperature = Number(
    process.env.PARAPHRASE_TEMPERATURE ?? "0.2"
  );
  const maxOutputTokens = Number(process.env.MAX_OUTPUT_TOKENS ?? "1024");
  return { openaiTemperature, paraphraseTemperature, maxOutputTokens };
}


