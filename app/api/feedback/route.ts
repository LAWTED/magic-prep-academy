import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { FeedbackItem } from "@/app/components/MentorFeedback";
import { parseAIGeneratedJson, validators } from "@/app/utils/jsonParser";
import { DOCUMENTS_PROMPTS } from "@/app/config/themePrompts";

/**
 * AI Feedback Generation API for Statement of Purpose documents
 * Analyzes SOP content and generates feedback suggestions
 */
export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Document content is required" },
        { status: 400 }
      );
    }

    // Get the SOP feedback prompt template
    const promptTemplate = DOCUMENTS_PROMPTS.FEEDBACK_SOP;

    // Generate the full prompt
    const systemPrompt = `${promptTemplate}

The document content is: ${content}`;

    // Call OpenAI API using the responses endpoint
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: systemPrompt,
    });

    try {
      // Parse and validate the JSON response using our validator
      const feedbackItems = parseAIGeneratedJson<FeedbackItem[]>(
        response.output_text,
        validators.aiFeedback
      );

      // Ensure all items have the correct mentorId and current timestamps
      const processedFeedback = feedbackItems.map(item => ({
        ...item,
        mentorId: "ai",
        timestamp: new Date()
      }));

      return NextResponse.json({
        success: true,
        feedback: processedFeedback,
      });
    } catch (parseError) {
      console.error("Error parsing AI feedback:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse feedback results",
          raw_response: response.output_text,
        },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("Error in AI feedback generation API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate feedback" },
      { status: 500 }
    );
  }
}