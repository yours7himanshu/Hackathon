import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import pdf from 'pdf-parse'; // Changed import for pdf-parse

// Ensure pdf-parse types are available or handle potential type issues
// You might need to install @types/pdf-parse

// --- Environment Variables ---
// Ensure these are set in your .env.local file
const siteUrl = process.env.YOUR_SITE_URL || 'http://localhost:3000'; // Default if not set
const siteName = process.env.YOUR_SITE_NAME || 'My Analyse App'; // Default if not set

export async function POST(req: NextRequest) {
  console.log('Received request for /api/analyse-pdf');
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  if (!openRouterApiKey) {
    console.error('API Error: OPENROUTER_API_KEY is not set.');
    return NextResponse.json({ error: 'Server configuration error: API key missing.' }, { status: 500 });
  }

  // Initialize client inside the handler
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: openRouterApiKey,
    defaultHeaders: {
      'HTTP-Referer': siteUrl,
      'X-Title': siteName,
    },
  });

console.log('Attempting to read form data...');
const formData = await req.formData();
const file = formData.get('pdfFile') as File | null;

if (!file) {
    console.log('Form data error: No PDF file found.');
    return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 });
}

if (file.type !== 'application/pdf') {
    console.log(`Form data error: Invalid file type - ${file.type}`);
    return NextResponse.json({ error: 'Invalid file type. Only PDF is allowed.' }, { status: 400 });
}

console.log(`Received file: ${file.name}, size: ${file.size}, type: ${file.type}`);
console.log('Attempting to parse PDF...');
const fileBuffer = Buffer.from(await file.arrayBuffer());
const pdfData = await pdf(fileBuffer);
const pdfText = pdfData.text;
console.log(`PDF parsed successfully. Text length: ${pdfText?.length || 0}`);

if (!pdfText || pdfText.trim().length === 0) {
    console.log('PDF parsing error: No text extracted or empty.');
    return NextResponse.json({ error: 'Could not extract text from PDF or PDF is empty.' }, { status: 400 });
}

const prompt = `Please analyze the following text extracted from a PDF document and provide a concise summary:\n\n"${pdfText.substring(0, 4000)}..."`;
console.log('Attempting to call OpenRouter API...');

const completion = await openai.chat.completions.create({
    model: 'google/gemini-2.5-pro-exp-03-25:free', // Or choose another model supported by OpenRouter
    messages: [
    {
        role: 'user',
        content: prompt,
    },
    ],
    // max_tokens: 500,
});

// --- Added Logging --- 
console.log('OpenRouter API call successful.');
console.log('Raw OpenRouter completion object:', JSON.stringify(completion, null, 2)); // Log the raw response
// --- End Added Logging ---

const analysis = completion.choices[0]?.message?.content;

if (!analysis) {
    console.error('OpenRouter response error: No analysis content found in the response.');
    throw new Error('Failed to get analysis content from OpenRouter.');
}

// --- Added Logging ---
console.log('Extracted analysis:', analysis.trim());
console.log('Sending successful response back to client.');
// --- End Added Logging ---

return NextResponse.json({ analysis: analysis.trim() });
}