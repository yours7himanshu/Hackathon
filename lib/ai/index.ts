import Groq from "groq-sdk";

// Type definition for valid reasoning models used for research and structured outputs
type ReasoningModel = typeof VALID_REASONING_MODELS[number];

// Valid reasoning models that can be used for research analysis and structured outputs
const VALID_REASONING_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.3-70b-versatile',
] as const;

// Models that support JSON structured output
const JSON_SUPPORTED_MODELS = [
  'llama-3.3-70b-versatile', 
  'llama-3.3-70b-versatile',
] as const;

// Helper to check if model supports JSON
export const supportsJsonOutput = (modelId: string) =>
  JSON_SUPPORTED_MODELS.includes(modelId as typeof JSON_SUPPORTED_MODELS[number]);

// Get reasoning model from env, with JSON support info
const REASONING_MODEL = process.env.REASONING_MODEL || 'llama-3.3-70b-versatile';
const BYPASS_JSON_VALIDATION = process.env.BYPASS_JSON_VALIDATION === 'true';

// Helper to get the reasoning model based on user's selected model
function getReasoningModel(modelId: string) {
  // If already using a valid reasoning model, keep using it
  if (VALID_REASONING_MODELS.includes(modelId as ReasoningModel)) {
    return modelId;
  }

  const configuredModel = REASONING_MODEL;

  if (!VALID_REASONING_MODELS.includes(configuredModel as ReasoningModel)) {
    const fallback = 'llama-3.3-70b-versatile';
    console.warn(`Invalid REASONING_MODEL "${configuredModel}", falling back to ${fallback}`);
    return fallback;
  }

  // Warn if trying to use JSON with unsupported model
  if (!BYPASS_JSON_VALIDATION && !supportsJsonOutput(configuredModel)) {
    console.warn(`Warning: Model ${configuredModel} does not support JSON schema. Set BYPASS_JSON_VALIDATION=true to override`);
  }

  return configuredModel;
}

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Simple direct implementation of chat completion with Groq
export async function completeChatGroq(options: {
  messages: Array<{ role: string; content: string }>;
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}) {
  try {
    const { messages, model, temperature = 0.5, max_tokens = 1024, top_p = 1, stream = false } = options;
    
    console.log(`[Groq] Sending request to model ${model} (stream=${stream})`);
    
    return await groq.chat.completions.create({
      messages,
      model,
      temperature,
      max_completion_tokens: max_tokens,
      top_p,
      stream
    });
    
  } catch (error) {
    console.error("[Groq] Error in API call:", error);
    throw error;
  }
}

// Used as a drop-in replacement for the previous customModel function
export const customModel = (apiIdentifier: string, forReasoning: boolean = false) => {
  // If it's for reasoning, get the appropriate reasoning model
  const modelId = forReasoning ? getReasoningModel(apiIdentifier) : apiIdentifier;
  
  // Return object with model information
  return {
    modelId,
    
    // Flag to indicate this is our direct implementation
    isDirectGroq: true
  };
};
