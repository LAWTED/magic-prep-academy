import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { parseAIGeneratedJson, validators } from "@/app/utils/jsonParser";

type ValidatorName = 'multipleChoice' | 'fillInTheBlank' | 'dialogue' | 'matching' | 'eligibilityResults';

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

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      tools: [
        {
          type: "file_search",
          vector_store_ids: [vectorStoreId],
        },
      ],
    });

    // 如果提供了validator_name，尝试在服务器端解析
    if (validator_name && validators[validator_name as ValidatorName]) {
      try {
        const validatorFn = validators[validator_name as ValidatorName];
        const parsedContent = parseAIGeneratedJson(
          response.output_text,
          validatorFn
        );

        return NextResponse.json({
          response: {
            ...response,
            parsed_content: parsedContent
          }
        });
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        // 返回原始响应和解析错误
        return NextResponse.json({
          response: response,
          parse_error: "Failed to parse JSON response with the specified validator."
        });
      }
    }

    // 未提供validator_name或解析失败，返回原始响应
    return NextResponse.json({
      response: response
    });
  } catch (error) {
    console.error("Error in vector chat API:", error);
    return NextResponse.json(
      { error: "Failed to process vector chat request" },
      { status: 500 }
    );
  }
}
