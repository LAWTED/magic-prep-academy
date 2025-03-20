"use client";

import { Loader2, FileText, Save, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { MATERIAL_PROMPTS } from "@/app/config/systemPrompts";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface MultipleChoiceGeneratorProps {
  vectorStoreId: string | null;
  moduleId?: string;
}

export default function MultipleChoiceGenerator({
  vectorStoreId,
  moduleId,
}: MultipleChoiceGeneratorProps) {
  const supabase = createClient();
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const fetchContent = async () => {
    if (!vectorStoreId || isLoading) return;

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/vector-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vectorStoreId,
          prompt: MATERIAL_PROMPTS.GENERATE_MULTIPLE_CHOICE,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate multiple choice questions");
      }

      const data = await response.json();

      // Improved JSON extraction and parsing
      try {
        const jsonText = data.response.output_text;

        // Try different patterns to extract JSON
        const jsonRegexPatterns = [
          /```json\n([\s\S]*?)\n```/, // Standard JSON code block
          /```\n([\s\S]*?)\n```/, // Code block without language
          /\{[\s\S]*"title"[\s\S]*\}/, // Direct JSON object
        ];

        let cleanJson = "";
        for (const pattern of jsonRegexPatterns) {
          const match = jsonText.match(pattern);
          if (match && match[1]) {
            cleanJson = match[1].trim();
            break;
          } else if (match) {
            cleanJson = match[0].trim();
            break;
          }
        }

        // If no pattern matched, use the whole response as a last resort
        if (!cleanJson) {
          cleanJson = jsonText.trim();
        }

        // Additional cleanup for common issues
        cleanJson = cleanJson
          .replace(/^```json/, "")
          .replace(/```$/, "")
          .trim();

        // Parse the JSON
        const parsedContent = JSON.parse(cleanJson);

        // Validate the required structure
        if (
          !parsedContent.title ||
          !parsedContent.questions ||
          !Array.isArray(parsedContent.questions)
        ) {
          throw new Error("Generated content is missing required fields");
        }

        setContent(parsedContent);
        setIsGenerated(true);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        setError("Failed to parse generated content. Please try again.");
      }
    } catch (err) {
      console.error("Error fetching multiple choice questions:", err);
      setError(
        "Failed to generate multiple choice questions. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const saveToSession = async () => {
    if (!moduleId || !content || isSaving) return;

    try {
      setIsSaving(true);

      // Format the content for the sessions table
      const sessionContent = {
        type: "MULTIPLE_CHOICE",
        content: content,
      };

      // Insert into sessions table with session_name
      const { error: insertError } = await supabase.from("sessions").insert({
        module_id: moduleId,
        session_name: content.title || "Multiple Choice Quiz",
        content: sessionContent,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        throw insertError;
      }

      setIsSaved(true);
      toast.success("Multiple choice questions saved to session");
    } catch (err) {
      console.error("Error saving session:", err);
      toast.error("Failed to save session. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderOptions = (options: any[]) => {
    return options.map((option) => (
      <div key={option.id} className="p-2 border rounded-md mb-1">
        <span className="font-medium">{option.id}:</span> {option.text}
      </div>
    ));
  };

  return (
    <div className="mt-6">
      <div
        className={`relative rounded-xl transition-all ${isGenerated ? "bg-muted" : "bg-primary/5 hover:bg-primary/10 cursor-pointer"}`}
        onClick={() => !isGenerated && !isLoading && fetchContent()}
      >
        <div className="flex items-center gap-2 p-4 border-b border-border/50">
          <FileText className="text-primary w-5 h-5" />
          <h3 className="text-lg font-medium">Multiple Choice Questions</h3>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="ml-3 text-muted-foreground">
                Generating multiple choice questions...
              </span>
            </div>
          ) : error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          ) : content ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-bold mb-2">{content.title}</h4>
                <p className="text-muted-foreground mb-4">
                  {content.instruction}
                </p>
              </div>

              {content.questions.map((question: any, index: number) => (
                <div
                  key={question.id}
                  className="p-4 bg-card rounded-lg border mb-4"
                >
                  <h5 className="font-medium mb-2">
                    {index + 1}. {question.text}
                  </h5>
                  <div className="space-y-1 mb-3">
                    {renderOptions(question.options)}
                  </div>
                  <div className="bg-green-50 p-3 rounded-md border border-green-200">
                    <div className="font-medium text-green-700">
                      Correct Answer: {question.correctAnswer}
                    </div>
                    <div className="text-green-700 text-sm mt-1">
                      {question.explanation}
                    </div>
                  </div>
                </div>
              ))}

              {moduleId && (
                <div className="flex justify-end">
                  {isSaved ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Saved to sessions
                    </div>
                  ) : (
                    <button
                      onClick={saveToSession}
                      disabled={isSaving}
                      className="flex items-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 disabled:bg-primary/50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save as Session
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mb-4 text-primary/50" />
              <p>Click to generate multiple choice questions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
