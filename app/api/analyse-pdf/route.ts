import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import pdf from 'pdf-parse'; // Temporarily comment out to isolate the error
import Groq from 'groq-sdk';

const siteUrl = process.env.YOUR_SITE_URL || 'http://localhost:3000'; // Default if not set
const siteName = process.env.YOUR_SITE_NAME || 'My Medical AI'; // Default if not set

export async function POST(req: NextRequest) {
  try {
    console.log('Received request for /api/analyse-pdf');
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      console.error('API Error: OPENROUTER_API_KEY is not set.');
      return NextResponse.json({ error: 'Server configuration error: API key missing.' }, { status: 500 });
    }

    // Initialize client inside the handler
    const groq = new Groq({
      apiKey: groqApiKey,
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
    console.log('Attempting to parse PDF...'); // Comment out usage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(fileBuffer); // Comment out usage
    const pdfText = pdfData.text; // Comment out usage
    // const pdfText = "PDF parsing temporarily disabled for testing."; // Placeholder
    console.log(`PDF parsed successfully. Text length: ${pdfText?.length || 0}`); // Comment out usage

    if (!pdfText || pdfText.trim().length === 0) {
      console.log('PDF parsing error: No text extracted or empty.');
      return NextResponse.json({ error: 'Could not extract text from PDF or PDF is empty.' }, { status: 400 });
    }

    // Modify the prompt temporarily since pdfText is now a placeholder string
    const prompt = `Please analyze the following text extracted from a PDF document and provide a concise summary of about 4000 words:\n\n"${pdfText.substring(0, 4000)}..."`;
    
    console.log('Attempting to call Groq API...');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4000,
    });

    console.log('Groq API call successful.');
    console.log('Raw Groq completion object:', JSON.stringify(completion, null, 2)); // Log the raw response

    const analysis = completion.choices[0]?.message?.content;

    if (!analysis) {
      console.error('Groq response error: No analysis content found in the response.');
      throw new Error('Failed to get analysis content from OpenRouter.');
    }

    console.log('Extracted analysis:', analysis.trim());
    console.log('Sending successful response back to client.');

    return NextResponse.json({ analysis: analysis.trim() });
  } catch (error) {
    console.error('Error processing PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process PDF', details: errorMessage }, { status: 500 });
  }
}