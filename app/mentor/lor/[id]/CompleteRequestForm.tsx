"use client";

import React, { useState, useEffect } from "react";
import { AutocompleteTextbox } from "react-ghost-text";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useEditorStore } from "@/app/(students)/tools/store/editorStore";
import { LOR_PROMPTS } from "@/app/config/themePrompts";

interface CompleteRequestFormProps {
  requestId: string;
  status?: string;
}

export default function CompleteRequestForm({
  requestId,
  status = "accepted",
}: CompleteRequestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMarkingFinished, setIsMarkingFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<{
    program_name?: string;
    program_details?: any;
    school_name?: string;
    student_name?: string;
    student_notes?: string;
    mentor_name?: string;
  }>({});
  const supabase = createClient();

  // Get content and setter from editorStore
  const { content, setContent } = useEditorStore();

  // Function to get text suggestion from API
  const fetchSuggestion = async (text: string): Promise<string> => {
    try {
      // For LOR, we should have something in letterData
      if (Object.keys(studentInfo).length === 0) {
        console.error("No letter data available for suggestions");
        return "";
      }

      const prefix = text.substring(text.lastIndexOf("\n") + 1);

      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prefix,
          context: {
            type: "lor",
            student_name: studentInfo.student_name,
            mentor_name: studentInfo.mentor_name,
            program_name: studentInfo.program_name,
            school_name: studentInfo.school_name,
            program_details: studentInfo.program_details,
            student_notes: studentInfo.student_notes,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get suggestion");
      }

      const data = await response.json();
      return data.suggestion || "";
    } catch (error) {
      console.error("Error fetching suggestion:", error);
      return "";
    }
  };

  // Fetch student info for the recommendation context
  useEffect(() => {
    async function fetchRequestDetails() {
      try {
        // Get current user (mentor) info
        const { data: userSession, error: userError } =
          await supabase.auth.getUser();
        if (userError) throw userError;

        // Get mentor name
        const { data: mentorData, error: mentorError } = await supabase
          .from("mentors")
          .select("name")
          .eq("auth_id", userSession.user.id)
          .single();

        if (mentorError)
          console.error("Error fetching mentor data:", mentorError);

        // Get student and request data
        const { data, error } = await supabase
          .from("mentor_student_interactions")
          .select(
            `
            metadata,
            users:student_id(name)
          `
          )
          .eq("id", requestId)
          .single();

        if (error) throw error;

        if (data) {
          const userData = data.users as any;
          const programId = data.metadata?.program_id;
          let programDetails = null;

          // Fetch program details if programId exists
          if (programId) {
            const { data: programData, error: programError } = await supabase
              .from("programs")
              .select("content")
              .eq("id", programId)
              .single();

            if (programError) {
              console.error("Error fetching program data:", programError);
            } else {
              programDetails = programData;
            }
          }

          setStudentInfo({
            program_name: data.metadata?.program_name || "",
            program_details: programDetails,
            school_name: data.metadata?.school_name || "",
            student_name: userData?.name || "",
            student_notes:
              data.metadata?.notes || data.metadata?.student_notes || "",
            mentor_name: mentorData?.name || "",
          });
        }
      } catch (error) {
        console.error("Error fetching request details:", error);
      }
    }

    fetchRequestDetails();
  }, [requestId, supabase]);

  /**
   * Helper function to convert HTML with divs to plain text with newlines
   */
  const convertDivsToNewlines = (html: string): string => {
    // Replace <div><br></div> with a newline
    let content = html.replace(/<div><br><\/div>/gi, "\n");
    // Replace &nbsp; with a space
    content = content.replace(/&nbsp;/gi, " ");
    // Replace opening div tags with newlines (except the first one)
    content = content.replace(/<div(?:\s[^>]*)?>/gi, "\n");
    // Remove all closing div tags
    content = content.replace(/<\/div>/gi, "");
    // Remove any remaining HTML tags
    content = content.replace(/<[^>]+>/g, "");
    return content;
  };

  const handleSave = async (content: string) => {
    const cleanedContent = convertDivsToNewlines(content);

    if (!cleanedContent.trim()) {
      toast.error("Letter content cannot be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // First, get the current request to access its metadata
      const { data: request, error: fetchError } = await supabase
        .from("mentor_student_interactions")
        .select("metadata")
        .eq("id", requestId)
        .eq("type", "lor_request")
        .single();

      if (fetchError) {
        console.error("Error fetching request:", fetchError);
        throw new Error("Failed to fetch the recommendation request");
      }

      // Update the request with the letter content and change status to completed
      const { error: updateError } = await supabase
        .from("mentor_student_interactions")
        .update({
          status: "completed",
          metadata: {
            ...request.metadata,
            letter_content: cleanedContent,
            completed_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Error updating request:", updateError);
        throw new Error("Failed to submit recommendation letter");
      }

      toast.success("Letter of recommendation submitted successfully");
      router.push("/mentor/lor");
      router.refresh();
    } catch (error) {
      console.error("Error saving letter:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit letter"
      );
      setError(
        error instanceof Error ? error.message : "Failed to submit letter"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsFinished = async () => {
    try {
      setIsMarkingFinished(true);
      setError(null);

      // First, get the current request to access its metadata
      const { data: request, error: fetchError } = await supabase
        .from("mentor_student_interactions")
        .select("metadata")
        .eq("id", requestId)
        .eq("type", "lor_request")
        .single();

      if (fetchError) {
        console.error("Error fetching request:", fetchError);
        throw new Error("Failed to fetch the recommendation request");
      }

      // Update the status to finished
      const { error: updateError } = await supabase
        .from("mentor_student_interactions")
        .update({
          status: "finished",
          metadata: {
            ...request.metadata,
            finished_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Error updating request:", updateError);
        throw new Error("Failed to mark letter as submitted to school");
      }

      toast.success("Letter marked as submitted to school successfully");
      router.push("/mentor/lor");
      router.refresh();
    } catch (error) {
      console.error("Error marking as finished:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      );
      setError(
        error instanceof Error ? error.message : "Failed to update status"
      );
    } finally {
      setIsMarkingFinished(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-800 rounded-md">
          Error: {error}
        </div>
      )}

      <AutocompleteTextbox
        value={`Dear Admissions Committee,`}
        className="flex-grow border border-gray-300 rounded-md overflow-hidden min-h-[450px] w-full h-full p-4 font-serif text-base leading-relaxed resize-none focus:outline-none focus:ring-0"
        onContentChange={(content) => {
          console.log("content", content);
          setContent(content);
        }}
        getSuggestion={fetchSuggestion}
      />

      <div className="flex justify-end mt-4 gap-4">
        {status === "completed" ? (
          <button
            onClick={handleMarkAsFinished}
            disabled={isMarkingFinished}
            className="py-2 px-6 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {isMarkingFinished ? "Updating..." : "Mark as Submitted to School"}
          </button>
        ) : status !== "finished" && (
          <button
            onClick={() => {
              if (content.trim()) {
                handleSave(content);
              } else {
                toast.error("Please write a recommendation letter first");
              }
            }}
            disabled={isSubmitting}
            className="py-2 px-6 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? "Submitting..." : "Submit Recommendation Letter"}
          </button>
        )}
      </div>
    </div>
  );
}
