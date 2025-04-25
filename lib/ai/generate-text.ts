import { customModel, completeChatGroq } from './index';

// Function for generating text non-streaming (used for title generation and analysis)
export async function generateText({ model, prompt, system, maxTokens = 1024 }: { 
  model: ReturnType<typeof customModel>,
  prompt: string, 
  system?: string,
  maxTokens?: number
}) {
  if (model.isDirectGroq) {
    const messages = system 
      ? [{ role: 'system', content: system }, { role: 'user', content: prompt }]
      : [{ role: 'user', content: prompt }];
      
    const response = await completeChatGroq({
      messages,
      model: model.modelId,
      stream: false,
      max_tokens: maxTokens
    });
    
    return { text: response.choices[0]?.message?.content || '' };
  }
  
  throw new Error('Only Groq models are currently supported');
}