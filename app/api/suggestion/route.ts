import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const { text, instructions } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Valid text is required" },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: text,
      instructions: instructions,
    });

    // Return the suggestion
    return NextResponse.json({
      suggestion: response.output_text || "",
    });
  } catch (error) {
    console.error("Error in suggestion API:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}