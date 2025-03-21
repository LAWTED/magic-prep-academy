import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { cookies } from "next/headers";
import { openai } from "@/lib/openai";
import { SCHOOL_PROMPTS } from "@/app/config/systemPrompts";
import { parseAIGeneratedJson, validators } from "@/app/utils/jsonParser";

export async function POST(req: Request) {
  try {
    const { programId, userId } = await req.json();

    if (!programId) {
      return NextResponse.json(
        { error: "Program ID is required" },
        { status: 400 }
      );
    }

    // Initialize Supabase client with correct cookies() usage
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    let userIdToUse = userId;

    // If userId is not provided in request, fall back to session auth
    if (!userIdToUse) {
      // Get authenticated user
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get user ID from users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", session.user.id)
        .single();

      if (userError || !userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      userIdToUse = userData.id;
    }

    // Get program data
    const { data: programData, error: programError } = await supabase
      .from("programs")
      .select("*")
      .eq("id", programId)
      .single();

    if (programError || !programData) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Get user academic data
    const { data: academicData, error: academicError } = await supabase
      .from("user_academic")
      .select("*")
      .eq("user_id", userIdToUse)
      .single();

    if (academicError && academicError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Error fetching academic data" },
        { status: 500 }
      );
    }

    if (!academicData) {
      return NextResponse.json(
        {
          error:
            "Academic profile not found. Please complete your academic profile first.",
        },
        { status: 404 }
      );
    }

    // Prepare data for OpenAI
    const programContent = programData.content;
    const userAcademic = academicData.content;

    // Generate the prompt using the SystemPrompt utility
    const userPrompt = SCHOOL_PROMPTS.ELIGIBILITY_CHECK(
      programContent,
      userAcademic
    );

    // Call OpenAI API
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: userPrompt,
    });

    try {
      // 在服务器端解析和验证JSON响应
      const parsedResults = parseAIGeneratedJson<any[]>(
        response.output_text,
        validators.eligibilityResults
      );

      // 按状态排序结果（met优先，not_met最后）
      const sortedResults = [...parsedResults].sort((a, b) => {
        const order: Record<string, number> = {
          met: 0,
          partially_met: 1,
          unknown: 2,
          not_met: 3,
        };
        const statusA = a.status as keyof typeof order;
        const statusB = b.status as keyof typeof order;
        return order[statusA] - order[statusB];
      });

      // 返回结构化的验证响应
      return NextResponse.json({
        success: true,
        data: sortedResults,
      });
    } catch (parseError) {
      console.error("Error parsing eligibility results:", parseError);
      // 解析失败时返回错误
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse eligibility results",
          raw_response: response.output_text,
        },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("Error in eligibility check API:", error);
    return NextResponse.json(
      { error: "Failed to process eligibility check request" },
      { status: 500 }
    );
  }
}
