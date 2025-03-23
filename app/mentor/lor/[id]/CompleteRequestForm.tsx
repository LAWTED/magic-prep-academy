"use client";

import React, { useState, useRef, useEffect } from "react";
import TextEditor from "@/app/components/TextEditor";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Tag } from "lucide-react";
import { useEditorStore } from "@/app/(students)/tools/store/editorStore";

interface CompleteRequestFormProps {
  requestId: string;
}

export default function CompleteRequestForm({ requestId }: CompleteRequestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<{
    program_name?: string;
    school_name?: string;
    student_name?: string;
  }>({});
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const supabase = createClient();

  // Get content and setter from editorStore
  const { content, setContent } = useEditorStore();

  // Fetch student info for the tags
  useEffect(() => {
    async function fetchRequestDetails() {
      try {
        const { data, error } = await supabase
          .from("mentor_student_interactions")
          .select(`
            metadata,
            users:student_id(name)
          `)
          .eq("id", requestId)
          .single();

        if (error) throw error;

        if (data) {
          const userData = data.users as any;
          setStudentInfo({
            program_name: data.metadata?.program_name || "",
            school_name: data.metadata?.school_name || "",
            student_name: userData?.name || ""
          });
        }
      } catch (error) {
        console.error("Error fetching request details:", error);
      }
    }

    fetchRequestDetails();
  }, [requestId, supabase]);

  // Get reference to the textarea after component mounts
  useEffect(() => {
    // Find the textarea after the component has mounted
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textAreaRef.current = textarea;
    }
  }, []);

  const insertTag = (tagContent: string) => {
    // Option 1: Try to use the textarea ref directly
    if (textAreaRef.current) {
      const textarea = textAreaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Create new content with the tag inserted
      const newContent =
        content.substring(0, start) +
        tagContent +
        content.substring(end);

      // Update the zustand store content
      setContent(newContent);

      // Set focus and cursor position
      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          const newPosition = start + tagContent.length;
          textarea.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    } else {
      // Fallback: Just append the tag to the current content
      setContent(content + tagContent);
      toast.success(`Inserted: ${tagContent}`);
    }
  };

  const handleSave = async (content: string) => {
    if (!content.trim()) {
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
            letter_content: content,
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
      toast.error(error instanceof Error ? error.message : "Failed to submit letter");
      setError(error instanceof Error ? error.message : "Failed to submit letter");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-800 rounded-md">
          Error: {error}
        </div>
      )}

      {/* Tags section */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center text-sm text-gray-500">
          <Tag size={16} className="mr-1" /> Click to insert:
        </div>

        {studentInfo.student_name && (
          <button
            onClick={() => insertTag(studentInfo.student_name || "")}
            className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm hover:bg-indigo-100 transition-colors"
          >
            {studentInfo.student_name}
          </button>
        )}

        {studentInfo.program_name && (
          <button
            onClick={() => insertTag(studentInfo.program_name || "")}
            className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm hover:bg-green-100 transition-colors"
          >
            {studentInfo.program_name}
          </button>
        )}

        {studentInfo.school_name && (
          <button
            onClick={() => insertTag(studentInfo.school_name || "")}
            className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm hover:bg-purple-100 transition-colors"
          >
            {studentInfo.school_name}
          </button>
        )}
      </div>

      <div className="flex-grow border border-gray-300 rounded-md overflow-hidden min-h-[450px]">
        <TextEditor
          initialContent=""
          onSave={handleSave}
          placeholder="Dear Admissions Committee,

I am writing to strongly recommend [Student Name] for admission to your [Program Name] program. As [Student's] mentor at Magic Prep Academy, I have had the pleasure of working closely with them and have been consistently impressed by their..."
          className="h-full"
          showIsland={false}
        />
      </div>

      <div className="flex justify-end mt-4">
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
      </div>
    </div>
  );
}