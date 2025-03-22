import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { parseAIGeneratedJson, validators } from "@/app/utils/jsonParser";
import { DOCUMENTS_PROMPTS } from "@/app/config/themePrompts";
import { ResumeAnalysisData, SOPAnalysisData } from "@/app/types";

/**
 * Document analyze API
 * Analyzes different types of documents (resume, CV, SOP, etc.)
 */
export async function POST(request: Request) {
  try {
    const { content, type } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content is required" },
        { status: 400 }
      );
    }

    if (!type || typeof type !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid document type is required" },
        { status: 400 }
      );
    }

    if (type === "resume") {
      // Handle resume analysis
      const response = await openai.responses.create({
        model: "gpt-4o-mini",
        input: `${DOCUMENTS_PROMPTS.ANALYZE_RESUME}

RESUME CONTENT:
${JSON.stringify(content, null, 2)}`,
      });

      try {
        // Parse and validate the JSON response
        const parsedContent = parseAIGeneratedJson<ResumeAnalysisData>(
          response.output_text,
          validators.resumeContentAnalysis
        );

        return NextResponse.json({
          success: true,
          analysis: parsedContent,
        });
      } catch (parseError) {
        console.error("Error parsing resume analysis:", parseError);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to parse analysis results",
            raw_response: response.output_text,
          },
          { status: 422 }
        );
      }
    } else if (type === "sop") {
      // Handle SOP analysis
      const response = await openai.responses.create({
        model: "gpt-4o-mini",
        input: `${DOCUMENTS_PROMPTS.ANALYZE_SOP}

SOP CONTENT:
${JSON.stringify(content, null, 2)}`,
      });

      try {
        // Parse and validate the JSON response
        const parsedContent = parseAIGeneratedJson<SOPAnalysisData>(
          response.output_text,
          validators.sopContentAnalysis
        );

        return NextResponse.json({
          success: true,
          analysis: parsedContent,
        });
      } catch (parseError) {
        console.error("Error parsing SOP analysis:", parseError);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to parse analysis results",
            raw_response: response.output_text,
          },
          { status: 422 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported document type" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in document analysis API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze document" },
      { status: 500 }
    );
  }
}