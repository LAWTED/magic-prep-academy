"use client";

import {
  Loader2,
  FileText,
  Save,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { MATERIAL_PROMPTS } from "@/app/config/themePrompts";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface DialogueGeneratorProps {
  vectorStoreId: string | null | undefined;
  moduleId?: string;
}

export default function DialogueGenerator({
  vectorStoreId,
  moduleId,
}: DialogueGeneratorProps) {
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
          prompt: MATERIAL_PROMPTS.GENERATE_DIALOGUE,
          validator_name: "dialogue",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate dialogue exercise");
      }

      const data = await response.json();

      if (data.response.parsed_content) {
        setContent(data.response.parsed_content);
        setIsGenerated(true);
      } else if (data.parse_error) {
        setError("Failed to parse content: " + data.parse_error);
      } else {
        setError("Failed to generate valid content. Please try again.");
      }
    } catch (err) {
      console.error("Error fetching dialogue exercise:", err);
      setError("Failed to generate dialogue exercise. Please try again.");
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
        type: "DIALOGUE",
        content: content,
      };

      // Insert into sessions table
      const { error: insertError } = await supabase.from("sessions").insert({
        module_id: moduleId,
        session_name: content.title || "Dialogue Exercise",
        content: sessionContent,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        throw insertError;
      }

      setIsSaved(true);
      toast.success("Dialogue exercise saved to session");
    } catch (err) {
      console.error("Error saving session:", err);
      toast.error("Failed to save session. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderDialogueLine = (line: any, index: number) => {
    // Check if the line has a blank that needs to be filled in
    if (line.blank) {
      // Split the text by the blank marker "_______"
      const parts = line.text.split("_______");

      return (
        <div
          key={index}
          className={`p-4 rounded-lg mb-3 ${
            line.speaker === "Xiao Li"
              ? "bg-blue-50 ml-auto mr-0 max-w-[80%]"
              : "bg-gray-100 mr-auto ml-0 max-w-[80%]"
          }`}
        >
          <div className="font-medium mb-1 text-sm">{line.speaker}</div>
          <div>
            {parts[0]}
            <span className="bg-blue-100 px-2 py-1 rounded font-semibold">
              {showAnswers ? line.blank.answer : "_______"}
            </span>
            {parts[1]}
          </div>

          {!showAnswers && line.blank.hint && (
            <div className="flex items-center mt-2 text-xs text-blue-600">
              <HelpCircle className="w-3 h-3 mr-1" />
              <span>Hint: {line.blank.hint}</span>
            </div>
          )}
        </div>
      );
    } else {
      // Regular dialogue line without blanks
      return (
        <div
          key={index}
          className={`p-4 rounded-lg mb-3 ${
            line.speaker === "Xiao Li"
              ? "bg-blue-50 ml-auto mr-0 max-w-[80%]"
              : "bg-gray-100 mr-auto ml-0 max-w-[80%]"
          }`}
        >
          <div className="font-medium mb-1 text-sm">{line.speaker}</div>
          <div>{line.text}</div>
        </div>
      );
    }
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
          <MessageCircle className="text-primary w-5 h-5" />
          <h3 className="text-lg font-medium">Dialogue Exercise</h3>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="ml-3 text-muted-foreground">
                Generating dialogue exercise...
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

              <div className="border rounded-lg p-4 bg-white">
                <div className="space-y-1">
                  {content.dialogue.map((line: any, index: number) =>
                    renderDialogueLine(line, index)
                  )}
                </div>
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
              <MessageCircle className="w-12 h-12 mb-4 text-primary/50" />
              <p>Click to generate dialogue exercise</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
