import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import OpenAI from 'openai';

// Initialize FireCrawl client with version specification
const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || "fc-2aac5dfed4eb42038de75ee4c217e19e",
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
 * Ensure the URL includes the protocol (http:// or https://)
 */
function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Default to https if no protocol is provided
    return `https://${url}`;
  }
  return url;
}

/**
 * Directly fetch and extract content from a URL as a fallback
 */
async function directFetchContent(url: string) {
  try {
    console.log(`Attempting direct fetch as fallback for URL: ${url}`);
    // Use the fetch API to get the page content directly
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL directly. Status: ${response.status}`);
    }

    // Get HTML content
    const html = await response.text();
    
    if (!html || html.trim().length === 0) {
      throw new Error('No content found in direct fetch response');
    }
    
    // Extract metadata from HTML
    const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] || '';
    const description = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i)?.[1] || '';
    
    // Extract text content from HTML (basic extraction)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')  // Remove script tags
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')     // Remove style tags
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')           // Remove nav elements
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')   // Remove header elements
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')   // Remove footer elements
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')     // Remove aside elements
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')       // Remove form elements
      .replace(/<[^>]*>/g, ' ')                                           // Replace other HTML tags with spaces
      .replace(/\s+/g, ' ')                                               // Replace multiple spaces with single space
      .trim();
    
    // Create a mock result structure similar to FireCrawl
    return {
      success: true,
      data: {
        markdown: textContent,
        metadata: {
          title,
          description,
          sourceURL: url
        }
      }
    };
  } catch (error) {
    console.error('Error in direct fetch fallback:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Direct fetch fallback also failed: ${errorMessage}`);
  }
}

/**
 * Extract main article content from HTML (better quality extraction)
 */
function extractMainContent(html: string): string {
  // Look for common article container patterns
  const articlePatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class=["'].*?(article|post|content|main).*?["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id=["'].*?(article|post|content|main).*?["'][^>]*>([\s\S]*?)<\/div>/i
  ];
  
  // Try to find article content using patterns
  for (const pattern of articlePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      // Clean up the extracted content
      return match[1]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }
  
  // If no article content found, return empty string
  return '';
}

/**
 * Scrape content from a URL using FireCrawl
 */
async function scrapeNewsContent(url: string) {
  try {
    const normalizedUrl = normalizeUrl(url);
    console.log(`Attempting to scrape URL: ${normalizedUrl}`);

    // First attempt: Try with markdown format
    const result = await firecrawl.scrapeUrl(normalizedUrl, { 
      formats: ['markdown', 'html'], // Request both markdown and HTML as fallback
      timeout: 30000,
      waitFor: 3000
    });
    
    console.log('FireCrawl API response status:', result.success);
    
    if (!result.success) {
      throw new Error(`Failed to scrape: ${result.error}`);
    }

    // Create a properly structured response object
    const responseData = {
      markdown: result.markdown || '',
      html: result.html || '',
      metadata: result.metadata || { 
        title: '', 
        description: '', 
        sourceURL: normalizedUrl 
      }
    };

    // Log the response structure
    console.log('FireCrawl response structure:', 
      JSON.stringify({
        success: result.success,
        markdownExists: !!responseData.markdown,
        htmlExists: !!responseData.html,
        metadata: responseData.metadata
      })
    );

    // If FireCrawl returns success but no content, try direct fetch as fallback
    if (!responseData.markdown && !responseData.html) {
      console.log('FireCrawl returned empty result, falling back to direct fetch');
      return await directFetchContent(normalizedUrl);
    }

    // If markdown is not available but HTML is, convert HTML to text
    if (!responseData.markdown && responseData.html) {
      console.log('Using HTML content instead of markdown');
      // Create a simple text representation from HTML
      const htmlContent = responseData.html;
      // Extract text content from HTML (simple approach)
      const textContent = htmlContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')  // Remove scripts
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')     // Remove styles
        .replace(/<[^>]*>/g, ' ')                                            // Replace tags with spaces
        .replace(/\s+/g, ' ')                                                // Replace multiple spaces with single space
        .trim();
      
      // Add the extracted text as markdown
      responseData.markdown = textContent;
      
      // If still no content, try one more approach
      if (!responseData.markdown || responseData.markdown.length < 200) {
        console.log('HTML content extraction produced insufficient content, trying with title and metadata');
        // Create content from metadata if available
        if (responseData.metadata && responseData.metadata.title) {
          let metadataContent = `# ${responseData.metadata.title}\n\n`;
          
          if (responseData.metadata.description) {
            metadataContent += `${responseData.metadata.description}\n\n`;
          }
          
          metadataContent += `Source: ${normalizedUrl}`;
          responseData.markdown = metadataContent;
        }
      }
    }

    // Final check for markdown content
    if (!responseData.markdown || responseData.markdown.trim().length < 100) {
      console.log('Insufficient content extracted, falling back to direct fetch');
      return await directFetchContent(normalizedUrl);
    }
    
    // Return a consistently structured result
    return {
      success: true,
      data: {
        markdown: responseData.markdown,
        metadata: responseData.metadata
      }
    };
  } catch (error: any) {
    // If FireCrawl fails, try direct fetch as fallback
    console.error('FireCrawl error, attempting direct fetch fallback:', error);
    
    try {
      return await directFetchContent(url);
    } catch (fallbackError: any) {
      // If both methods fail, provide a helpful error message
      console.error('All content extraction methods failed:', fallbackError);
      
      // Add suggestions for URLs that work well
      const suggestions = [
        'https://www.medicalnewstoday.com/articles/latest',
        'https://www.health.harvard.edu/blog',
        'https://www.webmd.com/news/default.htm'
      ];
      
      const errorMessage = `Failed to extract content from this URL. Try using a well-structured news site URL like ${suggestions[0]}`;
      throw new Error(errorMessage);
    }
  }
}

/**
 * Summarize text using OpenAI via OpenRouter
 */
async function summarizeContent(content: string, maxLength: number = 400) {
  try {
    console.log('Calling OpenRouter API for summarization...');
    
    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-3-haiku:beta', // Changed model to more reliable one
      messages: [
        {
          role: 'system',
          content: `You are a medical news summarizer. Create a concise summary of the following medical news article. 
          Focus on key findings, implications for healthcare, and clinical relevance. 
          The summary should be clear, informative, and approximately ${maxLength} words.`
        },
        {
          role: 'user',
          content: content.substring(0, 10000), // Limiting content length to avoid token issues
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });
    
    // Log the response structure to diagnose issues
    console.log('OpenRouter API response structure:', 
      JSON.stringify({
        hasChoices: Array.isArray(completion.choices),
        choicesLength: Array.isArray(completion.choices) ? completion.choices.length : 0,
        firstChoice: completion.choices && completion.choices.length > 0 ? 'exists' : 'missing'
      })
    );
    
    // Check if the response has the expected structure
    if (!completion.choices || completion.choices.length === 0) {
      console.error('Unexpected API response structure - missing choices array:', completion);
      return "Unable to generate summary. The article may be too complex or contain formatting issues.";
    }
    
    if (!completion.choices[0].message || !completion.choices[0].message.content) {
      console.error('Unexpected API response structure - missing message content:', completion.choices[0]);
      return "Summary generation incomplete. Please try again with a different article.";
    }
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error summarizing content:', error);
    // Provide a more informative error message
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    // Return a fallback message instead of throwing
    return "Unable to generate summary due to an API error. Please try again later.";
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    // Step 1: Scrape the content
    try {
      const scrapedResult = await scrapeNewsContent(url);
      
      // Step 2: Summarize the content
      const summary = await summarizeContent(scrapedResult.data.markdown);
      
      return NextResponse.json({
        success: true,
        summary,
        originalContent: scrapedResult.data.markdown,
        metadata: scrapedResult.data.metadata
      });
    } catch (scrapeError: any) {
      console.error('Error scraping content:', scrapeError);
      return NextResponse.json({ 
        error: scrapeError.message,
        suggestion: 'Try a different URL or check that the content is publicly accessible.' 
      }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('Error in summarize API:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process the URL',
      suggestion: 'Please check the URL and try again.'
    }, { status: 500 });
  }
}
