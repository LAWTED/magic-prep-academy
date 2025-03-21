"use client";

import { Loader2, FileText, Save, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { MATERIAL_PROMPTS } from "@/app/config/systemPrompts";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface MatchingGeneratorProps {
  vectorStoreId: string | null;
  moduleId?: string;
}

export default function MatchingGenerator({
  vectorStoreId,
  moduleId,
}: MatchingGeneratorProps) {
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
          prompt: MATERIAL_PROMPTS.GENERATE_MATCHING,
          validator_name: "matching",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate matching questions");
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
      console.error("Error fetching matching questions:", err);
      setError("Failed to generate matching questions. Please try again.");
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
        type: "MATCHING",
        content: content,
      };

      // Insert into sessions table
      const { error: insertError } = await supabase.from("sessions").insert({
        module_id: moduleId,
        session_name: content.title || "Matching Exercise",
        content: sessionContent,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        throw insertError;
      }

      setIsSaved(true);
      toast.success("Matching exercise saved to session");
    } catch (err) {
      console.error("Error saving session:", err);
      toast.error("Failed to save session. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderRow = (row: any) => {
    return (
      <div key={row.id} className="mb-4 border rounded-lg p-4 bg-card">
        <h5 className="font-medium mb-2">{row.text}</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {row.options.map((option: any) => (
            <div key={option.id} className="p-2 border rounded-md">
              <span className="font-medium">{option.id}:</span> {option.text}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderConcept = (concept: any, rowsMap: Record<string, any>) => {
    return (
      <div key={concept.name} className="mb-4 border rounded-lg p-4 bg-blue-50">
        <h5 className="font-medium mb-2 text-blue-700">{concept.name}</h5>
        <div className="space-y-2">
          {Object.entries(concept.matches).map(([rowId, optionId]) => {
            const row = rowsMap[rowId];
            const option = row?.options.find((o: any) => o.id === optionId);
            return (
              <div key={rowId} className="text-blue-600">
                <span className="font-medium">{row?.text}:</span>{" "}
                {option ? `${option.id} - ${option.text}` : "Unknown option"}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6">
      <div
        className={`relative rounded-xl transition-all ${
          isGenerated
            ? "bg-muted"
            : "bg-primary/5 hover:bg-primary/10 cursor-pointer"
        }`}
        onClick={() => !isGenerated && !isLoading && fetchContent()}
      >
        <div className="flex items-center gap-2 p-4 border-b border-border/50">
          <FileText className="text-primary w-5 h-5" />
          <h3 className="text-lg font-medium">Matching Exercise</h3>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="ml-3 text-muted-foreground">
                Generating matching exercise...
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

              <div className="space-y-4">
                <h5 className="font-semibold text-lg">Categories & Options:</h5>
                {content.rows.map((row: any) => renderRow(row))}
              </div>

              <div className="space-y-4 mt-6">
                <h5 className="font-semibold text-lg">Correct Matches:</h5>
                {content.concepts.map((concept: any) => {
                  // Create a map of row IDs to row objects for easier access
                  const rowsMap = content.rows.reduce((acc: any, row: any) => {
                    acc[row.id] = row;
                    return acc;
                  }, {});

                  return renderConcept(concept, rowsMap);
                })}
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
              <p>Click to generate matching exercise</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
