import { openai } from '@ai-sdk/openai';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { togetherai } from '@ai-sdk/togetherai';

import { customMiddleware } from "./custom-middleware";
// Type definition for valid reasoning models used for research and structured outputs
type ReasoningModel = typeof VALID_REASONING_MODELS[number];

// Valid reasoning models that can be used for research analysis and structured outputs
const VALID_REASONING_MODELS = [
  
  'google/gemini-2.5-pro-exp-03-25:free',
  
] as const;

// Models that support JSON structured output
const JSON_SUPPORTED_MODELS = ['google/gemini-2.5-pro-exp-03-25:free'] as const;

// Helper to check if model supports JSON
export const supportsJsonOutput = (modelId: string) =>
  JSON_SUPPORTED_MODELS.includes(modelId as typeof JSON_SUPPORTED_MODELS[number]);

// Get reasoning model from env, with JSON support info
const REASONING_MODEL = process.env.REASONING_MODEL || 'o1-mini';
const BYPASS_JSON_VALIDATION = process.env.BYPASS_JSON_VALIDATION === 'true';

// Helper to get the reasoning model based on user's selected model
function getReasoningModel(modelId: string) {
  // If already using a valid reasoning model, keep using it
  if (VALID_REASONING_MODELS.includes(modelId as ReasoningModel)) {
    return modelId;
  }

  const configuredModel = REASONING_MODEL;

  if (!VALID_REASONING_MODELS.includes(configuredModel as ReasoningModel)) {
    const fallback = 'o1-mini';
    console.warn(`Invalid REASONING_MODEL "${configuredModel}", falling back to ${fallback}`);
    return fallback;
  }

  // Warn if trying to use JSON with unsupported model
  if (!BYPASS_JSON_VALIDATION && !supportsJsonOutput(configuredModel)) {
    console.warn(`Warning: Model ${configuredModel} does not support JSON schema. Set BYPASS_JSON_VALIDATION=true to override`);
  }

  return configuredModel;
}

export const customModel = (apiIdentifier: string, forReasoning: boolean = false) => {
  // Check which API key is available
  const hasOpenRouterKey = process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== "****";

  // If it's for reasoning, get the appropriate reasoning model
  const modelId = forReasoning ? getReasoningModel(apiIdentifier) : apiIdentifier;

  if (hasOpenRouterKey) {
    return wrapLanguageModel({
      model: openrouter(modelId),
      middleware: customMiddleware,
    });
  }

  // Select provider based on model
  const model = modelId === 'google/gemini-2.5-pro-exp-03-25:free'
    ? togetherai(modelId)
    : openai(modelId);

  console.log("Using model:", modelId);

  return wrapLanguageModel({
    model,
    middleware: customMiddleware,
  });
};
