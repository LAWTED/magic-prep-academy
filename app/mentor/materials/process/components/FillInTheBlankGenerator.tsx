"use client";

import { Loader2, FileText, Save, CheckCircle2, HelpCircle } from "lucide-react";
import { useState } from "react";
import { MATERIAL_PROMPTS } from "@/app/config/themePrompts";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface FillInTheBlankGeneratorProps {
  vectorStoreId: string | null | undefined;
  moduleId?: string;
}

export default function FillInTheBlankGenerator({
  vectorStoreId,
  moduleId,
}: FillInTheBlankGeneratorProps) {
  const supabase = createClient();
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showAnswers, setShowAnswers] = useState<boolean>(false);

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
          prompt: MATERIAL_PROMPTS.GENERATE_FILL_IN_THE_BLANK,
          validator_name: "fillInTheBlank",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate fill-in-the-blank questions");
      }

      const data = await response.json();

      // 检查API是否返回了解析后的内容
      if (data.response.parsed_content) {
        setContent(data.response.parsed_content);
        setIsGenerated(true);
      } else if (data.parse_error) {
        // API尝试解析但失败了
        setError("Failed to parse content: " + data.parse_error);
      } else {
        // API没有尝试解析
        setError("Failed to generate valid content. Please try again.");
      }
    } catch (err) {
      console.error("Error fetching fill-in-the-blank questions:", err);
      setError(
        "Failed to generate fill-in-the-blank questions. Please try again."
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
        type: "FILL_IN_THE_BLANK",
        content: content,
      };

      // Insert into sessions table
      const { error: insertError } = await supabase.from("sessions").insert({
        module_id: moduleId,
        session_name: content.title || "Fill in the Blank Exercise",
        content: sessionContent,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        throw insertError;
      }

      setIsSaved(true);
      toast.success("Fill in the blank exercise saved to session");
    } catch (err) {
      console.error("Error saving session:", err);
      toast.error("Failed to save session. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderQuestion = (question: any, index: number) => {
    // Replace the blank with a highlighted area
    const parts = question.text.split("_______");

    return (
      <div key={question.id} className="p-4 bg-card rounded-lg border mb-4">
        <h5 className="font-medium mb-2">
          {index + 1}.
          {parts.length > 1 ? (
            <>
              {parts[0]}
              <span className="bg-blue-100 px-2 py-1 rounded font-semibold">
                {showAnswers ? question.answer : "_______"}
              </span>
              {parts[1]}
            </>
          ) : (
            question.text
          )}
        </h5>

        {!showAnswers && question.hint && (
          <div className="flex items-center mt-2 text-sm text-blue-600">
            <HelpCircle className="w-4 h-4 mr-1" />
            <span>Hint: {question.hint}</span>
          </div>
        )}

        {showAnswers && (
          <div className="bg-green-50 p-3 rounded-md border border-green-200 mt-2">
            <div className="font-medium text-green-700">
              Answer: {question.answer}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6">
      <div
        className={`relative rounded-xl transition-all ${
          isGenerated ? "bg-muted" : "bg-primary/5 hover:bg-primary/10 cursor-pointer"
        }`}
        onClick={() => !isGenerated && !isLoading && fetchContent()}
      >
        <div className="flex items-center gap-2 p-4 border-b border-border/50">
          <FileText className="text-primary w-5 h-5" />
          <h3 className="text-lg font-medium">Fill in the Blank Exercise</h3>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="ml-3 text-muted-foreground">
                Generating fill in the blank exercise...
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

              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowAnswers(!showAnswers)}
                  className="text-sm text-primary hover:underline flex items-center"
                >
                  {showAnswers ? "Hide Answers" : "Show Answers"}
                </button>
              </div>

              <div className="space-y-4">
                {content.questions.map((question: any, index: number) =>
                  renderQuestion(question, index)
                )}
              </div>

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
              <p>Click to generate fill in the blank exercise</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}