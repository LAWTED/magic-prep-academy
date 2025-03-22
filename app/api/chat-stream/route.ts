import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const { prompt, system_prompt, messages = [] } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Valid prompt is required" },
        { status: 400 }
      );
    }

    // Create streaming response with conversation history
    const stream = await openai.responses.create({
      model: "gpt-4o-mini",
      input: messages.length > 0 ? messages : prompt,
      instructions: system_prompt || "You are a helpful academic assistant from Magic Prep Academy. Be concise, accurate, and helpful.",
      stream: true,
    });

    // Set up streaming response to client
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';

        try {
          // Process each chunk in the stream
          for await (const chunk of stream) {
            // Send the chunk to the client
            controller.enqueue(encoder.encode(JSON.stringify({ chunk }) + '\n'));

            // Safely extract text from the chunk
            if (typeof chunk === 'object' && chunk !== null) {
              // Handle different chunk formats
              if ('output_text' in chunk && typeof chunk.output_text === 'string') {
                fullResponse += chunk.output_text;
              } else if ('text' in chunk && typeof chunk.text === 'string') {
                fullResponse += chunk.text;
              } else if ('delta' in chunk && chunk.delta && typeof chunk.delta === 'string') {
                fullResponse += chunk.delta;
              }
            }
          }

          // Signal end of stream
          controller.enqueue(encoder.encode(JSON.stringify({
            full_response: fullResponse,
            done: true
          }) + '\n'));

          controller.close();
        } catch (error) {
          console.error("Stream processing error:", error);
          controller.enqueue(encoder.encode(JSON.stringify({
            error: "Stream processing error",
            done: true
          }) + '\n'));
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("Error in chat stream API:", error);
    return NextResponse.json(
      { error: "Failed to process chat stream request" },
      { status: 500 }
    );
  }
}