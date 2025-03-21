import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { parseAIGeneratedJson } from "@/app/utils/jsonParser";
import { SCHOOL_PROMPTS } from "@/app/config/systemPrompts";

export async function POST(request: Request) {
  try {
    const { programContent } = await request.json();

    if (!programContent) {
      return NextResponse.json(
        { error: "Program content is required" },
        { status: 400 }
      );
    }

    // Generate a summary of the program content using the system prompt
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `${SCHOOL_PROMPTS.PROGRAM_SUMMARY}

      PROGRAM INFORMATION:
      ${JSON.stringify(programContent, null, 2)}`,
    });

    // Return the generated summary
    return NextResponse.json({
      success: true,
      summary: response.output_text,
      raw_response: response.output_text,
    });
  } catch (error) {
    console.error("Error in program summary API:", error);
    return NextResponse.json(
      { error: "Failed to generate program summary" },
      { status: 500 }
    );
  }
}
