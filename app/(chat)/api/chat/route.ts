import { z } from 'zod';
import { auth, signIn } from '@/app/(auth)/auth';
import { customModel, completeChatGroq } from '@/lib/ai';
import { models, reasoningModels } from '@/lib/ai/models';
import { rateLimiter } from '@/lib/rate-limit';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  getUser,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import FirecrawlApp from '@mendable/firecrawl-js';

// Message type definition that was previously imported from 'ai'
interface Message {
  id?: string;
  content: string;
  role: 'system' | 'user' | 'assistant' | 'function' | 'data' | 'tool';
  createdAt?: Date;
  name?: string;
}

// Helper function to convert messages to core format (previously from 'ai')
function convertToCoreMessages(messages: Message[]) {
  return messages.map(message => ({
    content: message.content,
    role: message.role,
    name: message.name
  }));
}

// Custom implementation of createDataStreamResponse (previously from 'ai')
function createDataStreamResponse({ execute }) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const dataStream = {
        writeData: (data) => {
          const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
          controller.enqueue(chunk);
        },
        writeMessageAnnotation: (data) => {
          const chunk = encoder.encode(`data: ${JSON.stringify({ type: 'message-annotation', ...data })}\n\n`);
          controller.enqueue(chunk);
        },
        close: () => {
          const chunk = encoder.encode('data: [DONE]\n\n');
          controller.enqueue(chunk);
          controller.close();
        }
      };

      await execute(dataStream);
      dataStream.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

// Custom implementation for streaming chat completions from Groq
async function streamText(options) {
  const { model, system, messages, tools, onFinish } = options;
  
  // If this is our direct Groq implementation, handle it differently
  if (model.isDirectGroq) {
    // Format messages with system prompt if provided
    const formattedMessages = system 
      ? [{ role: 'system', content: system }, ...messages]
      : [...messages];
    
    // Create a response object to collect the streamed messages
    const responseObject = {
      messages: [...messages]
    };
    
    return {
      mergeIntoDataStream: async (dataStream) => {
        try {
          // Start stream with a pending message
          dataStream.writeData({
            type: 'assistant-message', 
            content: '',
            role: 'assistant',
            id: generateUUID()
          });
          
          // Get the Groq completion stream
          const stream = await completeChatGroq({
            messages: formattedMessages,
            model: model.modelId,
            stream: true
          });
          
          let fullContent = '';
          
          // Process the stream chunks
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              
              // Write chunk to the stream
              dataStream.writeData({
                type: 'text', 
                content
              });
            }
          }
          
          // Add the complete response to the response object
          responseObject.messages.push({
            role: 'assistant',
            content: fullContent
          });
          
          // Call onFinish callback if provided
          if (onFinish) {
            await onFinish({ response: responseObject });
          }
        } catch (error) {
          console.error('Error streaming from Groq:', error);
          dataStream.writeData({
            type: 'error',
            error: error.message || 'An error occurred while streaming from Groq'
          });
        }
      }
    };
  }
  
  // Fallback for other models (should be removed when all AI SDKs are removed)
  throw new Error('Only Groq models are currently supported');
}

// Function to extract data from URLs
async function extractFromUrls(urls: string[]): Promise<Array<{text: string; source: string}>> {
  // Filter out any empty or undefined URLs
  const validUrls = urls.filter(url => !!url);
  
  if (validUrls.length === 0) {
    return [];
  }
  
  try {
    const findings: Array<{text: string; source: string}> = [];
    
    // Process each URL and extract content
    for (const url of validUrls) {
      try {
        const result = await app.scrapeUrl(url);
        
        if (result.success && result.markdown) {
          // Limit the text size to avoid token issues
          const truncatedText = result.markdown.substring(0, 4000);
          findings.push({
            text: truncatedText,
            source: url
          });
        }
      } catch (err) {
        console.error(`Error extracting from URL ${url}:`, err);
        // Continue with other URLs even if one fails
      }
    }
    
    return findings;
  } catch (error) {
    console.error('Error in extractFromUrls:', error);
    return [];
  }
}

type AllowedTools =
  | 'deepResearch'
  | 'search'
  | 'extract'
  | 'scrape';

const firecrawlTools: AllowedTools[] = ['search', 'extract', 'scrape'];
const allTools: AllowedTools[] = [...firecrawlTools, 'deepResearch'];

const app = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || '',
});

export async function POST(request: Request) {
  const maxDuration = process.env.MAX_DURATION
    ? parseInt(process.env.MAX_DURATION)
    : 300; 
  
  const {
    id,
    messages,
    modelId,
    reasoningModelId,
    experimental_deepResearch = false,
  }: { 
    id: string; 
    messages: Array<Message>; 
    modelId: string; 
    reasoningModelId: string;
    experimental_deepResearch?: boolean;
  } = await request.json();

  let session = await auth();

  // If no session exists, create an anonymous session
  if (!session?.user) {
    try {
      const result = await signIn('credentials', {
        redirect: false,
      });

      if (result?.error) {
        console.error('Failed to create anonymous session:', result.error);
        return new Response('Failed to create anonymous session', {
          status: 500,
        });
      }

      // Wait for the session to be fully established
      let retries = 3;
      while (retries > 0) {
        session = await auth();
        
        if (session?.user?.id) {
          // Verify user exists in database
          const users = await getUser(session.user.email as string);
          if (users.length > 0) {
            break;
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      }

      if (!session?.user) {
        console.error('Failed to get session after creation');
        return new Response('Failed to create session', { status: 500 });
      }
    } catch (error) {
      console.error('Error creating anonymous session:', error);
      return new Response('Failed to create anonymous session', {
        status: 500,
      });
    }
  }

  if (!session?.user?.id) {
    return new Response('Failed to create session', { status: 500 });
  }

  // Verify user exists in database before proceeding
  try {
    const users = await getUser(session.user.email as string);
    if (users.length === 0) {
      console.error('User not found in database:', session.user);
      return new Response('User not found', { status: 500 });
    }
  } catch (error) {
    console.error('Error verifying user:', error);
    return new Response('Failed to verify user', { status: 500 });
  }

  // Apply rate limiting
  const identifier = session.user.id;
  const { success, limit, reset, remaining } =
    await rateLimiter.limit(identifier);

  if (!success) {
    return new Response(`Too many requests`, { status: 429 });
  }

  const model = models.find((model) => model.id === modelId);
  const reasoningModel = reasoningModels.find((model) => model.id === reasoningModelId);

  if (!model || !reasoningModel) {
    return new Response('Model not found', { status: 404 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  const userMessageId = generateUUID();

  await saveMessages({
    messages: [
      { ...userMessage, id: userMessageId, createdAt: new Date(), chatId: id },
    ],
  });

  return createDataStreamResponse({
    execute: async (dataStream) => {
      dataStream.writeData({
        type: 'user-message-id',
        content: userMessageId,
      });

      // Here we use our custom streamText implementation
      const result = await streamText({
        // Use our direct Groq model
        model: customModel(model.apiIdentifier, false),
        system: systemPrompt,
        messages: coreMessages,
        experimental_activeTools: experimental_deepResearch ? allTools : firecrawlTools,
        tools: {
          search: {
            description:
              "Search for web pages. Normally you should call the extract tool after this one to get a spceific data point if search doesn't the exact data you need.",
            parameters: z.object({
              query: z
                .string()
                .describe('Search query to find relevant web pages'),
              maxResults: z
                .number()
                .optional()
                .describe('Maximum number of results to return (default 10)'),
            }),
            execute: async ({ query, maxResults = 5 }) => {
              try {
                const searchResult = await app.search(query);

                if (!searchResult.success) {
                  return {
                    error: `Search failed: ${searchResult.error}`,
                    success: false,
                  };
                }

                // Add favicon URLs to search results
                const resultsWithFavicons = searchResult.data.map((result: any) => {
                  const url = new URL(result.url);
                  const favicon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
                  return {
                    ...result,
                    favicon
                  };
                });

                searchResult.data = resultsWithFavicons;

                return {
                  data: searchResult.data,
                  success: true,
                };
              } catch (error: any) {
                return {
                  error: `Search failed: ${error.message}`,
                  success: false,
                };
              }
            },
          },
          extract: {
            description:
              'Extract structured data from web pages. Use this to get whatever data you need from a URL. Any time someone needs to gather data from something, use this tool.',
            parameters: z.object({
              urls: z.array(z.string()).describe(
                'Array of URLs to extract data from',
              ),
              prompt: z
                .string()
                .describe('Description of what data to extract'),
            }),
            execute: async ({ urls, prompt }) => {
              try {
                const scrapeResult = await app.extract(urls, {
                  prompt,
                });

                if (!scrapeResult.success) {
                  return {
                    error: `Failed to extract data: ${scrapeResult.error}`,
                    success: false,
                  };
                }

                return {
                  data: scrapeResult.data,
                  success: true,
                };
              } catch (error: any) {
                console.error('Extraction error:', error);
                console.error(error.message);
                console.error(error.error);
                return {
                  error: `Extraction failed: ${error.message}`,
                  success: false,
                };
              }
            },
          },
          scrape: {
            description:
              'Scrape web pages. Use this to get from a page when you have the url.',
            parameters: z.object({
              url: z.string().describe('URL to scrape'),
            }),
            execute: async ({ url }: { url: string }) => {
              try {
                const scrapeResult = await app.scrapeUrl(url);

                if (!scrapeResult.success) {
                  return {
                    error: `Failed to extract data: ${scrapeResult.error}`,
                    success: false,
                  };
                }

                return {
                  data:
                    scrapeResult.markdown ??
                    'Could get the page content, try using search or extract',
                  success: true,
                };
              } catch (error: any) {
                console.error('Extraction error:', error);
                console.error(error.message);
                console.error(error.error);
                return {
                  error: `Extraction failed: ${error.message}`,
                  success: false,
                };
              }
            },
          },
          deepResearch: {
            description:
              'Perform deep research on a topic using an AI agent that coordinates search, extract, and analysis tools with reasoning steps.',
            parameters: z.object({
              topic: z.string().describe('The topic or question to research'),
            }),
            execute: async ({ topic, maxDepth = 7 }) => {
              const startTime = Date.now();
              const timeLimit = 4.5 * 60 * 1000; // 4 minutes 30 seconds in milliseconds

              const researchState = {
                findings: [] as Array<{ text: string; source: string }>,
                summaries: [] as Array<string>,
                nextSearchTopic: '',
                urlToSearch: '',
                currentDepth: 0,
                failedAttempts: 0,
                maxFailedAttempts: 3,
                completedSteps: 0,
                totalExpectedSteps: maxDepth * 5,
              };

              // Initialize progress tracking
              dataStream.writeData({
                type: 'progress-init',
                content: {
                  maxDepth,
                  totalSteps: researchState.totalExpectedSteps,
                },
              });

              // Internal function to generate text (with a unique name to avoid conflicts)
              async function generateTextInternal({ model, prompt, system, maxTokens = 1024 }) {
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

              const addSource = (source: {
                url: string;
                title: string;
                description: string;
              }) => {
                dataStream.writeData({
                  type: 'source-delta',
                  content: source,
                });
              };

              const addActivity = (activity: {
                type:
                | 'search'
                | 'extract'
                | 'analyze'
                | 'reasoning'
                | 'synthesis'
                | 'thought';
                status: 'pending' | 'complete' | 'error';
                message: string;
                timestamp: string;
                depth: number;
              }) => {
                if (activity.status === 'complete') {
                  researchState.completedSteps++;
                }

                dataStream.writeData({
                  type: 'activity-delta',
                  content: {
                    ...activity,
                    depth: researchState.currentDepth,
                    completedSteps: researchState.completedSteps,
                    totalSteps: researchState.totalExpectedSteps,
                  },
                });
              };

              const analyzeAndPlan = async (
                findings: Array<{ text: string; source: string }>,
              ) => {
                try {
                  const timeElapsed = Date.now() - startTime;
                  const timeRemaining = timeLimit - timeElapsed;
                  const timeRemainingMinutes =
                    Math.round((timeRemaining / 1000 / 60) * 10) / 10;

                  // Reasoning model - using our direct implementation
                  const result = await generateTextInternal({
                    model: customModel(reasoningModel.apiIdentifier, true),
                    prompt: `You are a research agent analyzing findings about: ${topic}
                            You have ${timeRemainingMinutes} minutes remaining to complete the research but you don't need to use all of it.
                            Current findings: ${findings
                        .map((f) => `[From ${f.source}]: ${f.text}`)
                        .join('\n')}
                            What has been learned? What gaps remain? What specific aspects should be investigated next if any?
                            If you need to search for more information, include a nextSearchTopic.
                            If you need to search for more information in a specific URL, include a urlToSearch.
                            Important: If less than 1 minute remains, set shouldContinue to false to allow time for final synthesis.
                            If I have enough information, set shouldContinue to false.
                            
                            Respond in this exact JSON format:
                            {
                              "analysis": {
                                "summary": "summary of findings",
                                "gaps": ["gap1", "gap2"],
                                "nextSteps": ["step1", "step2"],
                                "shouldContinue": true/false,
                                "nextSearchTopic": "optional topic",
                                "urlToSearch": "optional url"
                              }
                            }`,
                  });

                  try {
                    const parsed = JSON.parse(result.text);
                    return parsed.analysis;
                  } catch (error) {
                    console.error('Failed to parse JSON response:', error);
                    return null;
                  }
                } catch (error) {
                  console.error('Analysis error:', error);
                  return null;
                }
              };

              try {
                while (researchState.currentDepth < maxDepth) {
                  const timeElapsed = Date.now() - startTime;
                  if (timeElapsed >= timeLimit) {
                    break;
                  }

                  researchState.currentDepth++;

                  dataStream.writeData({
                    type: 'depth-delta',
                    content: {
                      current: researchState.currentDepth,
                      max: maxDepth,
                      completedSteps: researchState.completedSteps,
                      totalSteps: researchState.totalExpectedSteps,
                    },
                  });

                  // Search phase
                  addActivity({
                    type: 'search',
                    status: 'pending',
                    message: `Searching for "${topic}"`,
                    timestamp: new Date().toISOString(),
                    depth: researchState.currentDepth,
                  });

                  let searchTopic = researchState.nextSearchTopic || topic;
                  const searchResult = await app.search(searchTopic);

                  if (!searchResult.success) {
                    addActivity({
                      type: 'search',
                      status: 'error',
                      message: `Search failed for "${searchTopic}"`,
                      timestamp: new Date().toISOString(),
                      depth: researchState.currentDepth,
                    });

                    researchState.failedAttempts++;
                    if (
                      researchState.failedAttempts >=
                      researchState.maxFailedAttempts
                    ) {
                      break;
                    }
                    continue;
                  }

                  addActivity({
                    type: 'search',
                    status: 'complete',
                    message: `Found ${searchResult.data.length} relevant results`,
                    timestamp: new Date().toISOString(),
                    depth: researchState.currentDepth,
                  });

                  // Add sources from search results
                  searchResult.data.forEach((result: any) => {
                    addSource({
                      url: result.url,
                      title: result.title,
                      description: result.description,
                    });
                  });

                  // Extract phase
                  const topUrls = searchResult.data
                    .slice(0, 3)
                    .map((result: any) => result.url);

                  const newFindings = await extractFromUrls([
                    researchState.urlToSearch,
                    ...topUrls,
                  ]);
                  researchState.findings.push(...newFindings);

                  // Analysis phase
                  addActivity({
                    type: 'analyze',
                    status: 'pending',
                    message: 'Analyzing findings',
                    timestamp: new Date().toISOString(),
                    depth: researchState.currentDepth,
                  });

                  const analysis = await analyzeAndPlan(researchState.findings);
                  researchState.nextSearchTopic =
                    analysis?.nextSearchTopic || '';
                  researchState.urlToSearch = analysis?.urlToSearch || '';
                  researchState.summaries.push(analysis?.summary || '');

                  console.log(analysis);
                  if (!analysis) {
                    addActivity({
                      type: 'analyze',
                      status: 'error',
                      message: 'Failed to analyze findings',
                      timestamp: new Date().toISOString(),
                      depth: researchState.currentDepth,
                    });

                    researchState.failedAttempts++;
                    if (
                      researchState.failedAttempts >=
                      researchState.maxFailedAttempts
                    ) {
                      break;
                    }
                    continue;
                  }

                  addActivity({
                    type: 'analyze',
                    status: 'complete',
                    message: analysis.summary,
                    timestamp: new Date().toISOString(),
                    depth: researchState.currentDepth,
                  });

                  if (!analysis.shouldContinue || analysis.gaps.length === 0) {
                    break;
                  }

                  topic = analysis.gaps.shift() || topic;
                }

                // Final synthesis
                addActivity({
                  type: 'synthesis',
                  status: 'pending',
                  message: 'Preparing final analysis',
                  timestamp: new Date().toISOString(),
                  depth: researchState.currentDepth,
                });

                const finalAnalysis = await generateTextInternal({
                  model: customModel(reasoningModel.apiIdentifier, true),
                  maxTokens: 16000,
                  prompt: `Create a comprehensive long analysis of ${topic} based on these findings:
                          ${researchState.findings
                      .map((f) => `[From ${f.source}]: ${f.text}`)
                      .join('\n')}
                          ${researchState.summaries
                            .map((s) => `[Summary]: ${s}`)
                            .join('\n')}
                          Provide all the thoughts processes including findings details,key insights, conclusions, and any remaining uncertainties. Include citations to sources where appropriate. This analysis should be very comprehensive and full of details. It is expected to be very long, detailed and comprehensive.`,
                });

                addActivity({
                  type: 'synthesis',
                  status: 'complete',
                  message: 'Research completed',
                  timestamp: new Date().toISOString(),
                  depth: researchState.currentDepth,
                });

                dataStream.writeData({
                  type: 'finish',
                  content: finalAnalysis.text,
                });

                return {
                  success: true,
                  data: {
                    findings: researchState.findings,
                    analysis: finalAnalysis.text,
                    completedSteps: researchState.completedSteps,
                    totalSteps: researchState.totalExpectedSteps,
                  },
                };
              } catch (error: any) {
                console.error('Deep research error:', error);

                addActivity({
                  type: 'thought',
                  status: 'error',
                  message: `Research failed: ${error.message}`,
                  timestamp: new Date().toISOString(),
                  depth: researchState.currentDepth,
                });

                return {
                  success: false,
                  error: error.message,
                  data: {
                    findings: researchState.findings,
                    completedSteps: researchState.completedSteps,
                    totalSteps: researchState.totalExpectedSteps,
                  },
                };
              }
            },
          },
        },
        onFinish: async ({ response }) => {
          if (session.user?.id) {
            try {
              const responseMessagesWithoutIncompleteToolCalls =
                sanitizeResponseMessages(response.messages);

              await saveMessages({
                messages: responseMessagesWithoutIncompleteToolCalls.map(
                  (message) => {
                    const messageId = generateUUID();

                    if (message.role === 'assistant') {
                      dataStream.writeMessageAnnotation({
                        messageIdFromServer: messageId,
                      });
                    }

                    return {
                      id: messageId,
                      chatId: id,
                      role: message.role,
                      content: message.content,
                      createdAt: new Date(),
                    };
                  },
                ),
              });
            } catch (error) {
              console.error('Failed to save chat');
            }
          }
        }
      });

      // Merge the result into the data stream
      await result.mergeIntoDataStream(dataStream);
    },
  });
}

// The DELETE implementation remains unchanged
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  let session = await auth();

  // If no session exists, create an anonymous session
  if (!session?.user) {
    await signIn('credentials', {
      redirect: false,
    });
    session = await auth();
  }

  if (!session?.user?.id) {
    return new Response('Failed to create session', { status: 500 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
