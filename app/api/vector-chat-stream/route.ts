import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { parseAIGeneratedJson, validators } from "@/app/utils/jsonParser";

type ValidatorName = 'multipleChoice' | 'fillInTheBlank' | 'dialogue' | 'matching' | 'eligibilityResults' | 'apaResume';

export async function POST(request: Request) {
  try {
    const { vectorStoreId, prompt, validator_name } = await request.json();

    if (!vectorStoreId) {
      return NextResponse.json(
        { error: "Vector store ID is required" },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Valid prompt is required" },
        { status: 400 }
      );
    }

    // Create streaming response
    const stream = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      tools: [
        {
          type: "file_search",
          vector_store_ids: [vectorStoreId],
        },
      ],
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

          // Process final result with validator if requested
          if (validator_name && validators[validator_name as ValidatorName]) {
            try {
              const validatorFn = validators[validator_name as ValidatorName];
              const parsedContent = parseAIGeneratedJson(
                fullResponse,
                validatorFn
              );

              controller.enqueue(encoder.encode(JSON.stringify({
                parsed_content: parsedContent,
                done: true
              }) + '\n'));
            } catch (parseError) {
              console.error('Error parsing JSON response:', parseError);
              controller.enqueue(encoder.encode(JSON.stringify({
                parse_error: "Failed to parse JSON response with specified validator.",
                done: true
              }) + '\n'));
            }
          } else {
            // Signal end of stream
            controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + '\n'));
          }

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
    console.error("Error in vector chat stream API:", error);
    return NextResponse.json(
      { error: "Failed to process vector chat stream request" },
      { status: 500 }
    );
  }
}