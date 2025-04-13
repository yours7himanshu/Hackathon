import FirecrawlApp from '@mendable/firecrawl-js';
import OpenAI from 'openai';

// Initialize FireCrawl client
const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || "fc-2aac5dfed4eb42038de75ee4c217e19e"
});

// Initialize OpenRouter (OpenAI compatible) client
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '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',
  defaultHeaders: {
    'HTTP-Referer': 'https://extract.chat',
    'X-Title': 'Medical News Summarizer',
  },
});

/**
 * Scrape content from a URL using FireCrawl
 */
export async function scrapeNewsContent(url: string) {
  try {
    const result = await firecrawl.scrapeUrl(url, { 
      formats: ['markdown'],
    });
    
    if (!result.success) {
      throw new Error(`Failed to scrape: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error scraping content:', error);
    throw error;
  }
}

/**
 * Summarize text using OpenAI via OpenRouter
 */
export async function summarizeContent(content: string, maxLength: number = 400) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a medical news summarizer. Create a concise summary of the following medical news article. 
          Focus on key findings, implications for healthcare, and clinical relevance. 
          The summary should be clear, informative, and approximately ${maxLength} words.`
        },
        {
          role: 'user',
          content: content,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw error;
  }
}
