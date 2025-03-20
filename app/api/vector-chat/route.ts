import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const { vectorStoreId, prompt } = await request.json();

    if (!vectorStoreId) {
      return NextResponse.json(
        { error: 'Vector store ID is required' },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Valid prompt is required' },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      tools: [{
        type: "file_search",
        vector_store_ids: [vectorStoreId],
      }],
    });

    return NextResponse.json({
      response: response
    });
  } catch (error) {
    console.error('Error in vector chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process vector chat request' },
      { status: 500 }
    );
  }
}