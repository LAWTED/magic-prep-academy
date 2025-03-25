"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";
import TextEditor from "@/app/components/TextEditor";
import TextIsland from "@/app/components/TextIsland";
import StudentFeedback from "@/app/components/StudentFeedback";
import { useEditorStore } from "@/app/(students)/tools/store/editorStore";
import { type FeedbackItem } from "@/app/components/MentorFeedback";

export default function SOPEditPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUserStore();
  const { setIsSaving, setIsDirty, setLastSaved, setShowDynamicIsland } =
    useEditorStore();

  const [sopDocument, setSOPDocument] = useState<any | null>(null);
  const [sopContent, setSOPContent] = useState<string>("");
  const [documentId, setDocumentId] = useState<string>("");
  const [latestVersionId, setLatestVersionId] = useState<string>("");
  const [versionNumber, setVersionNumber] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsLoadingSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackCount, setFeedbackCount] = useState<number>(0);

  // For feedback handling
  const [selectedText, setSelectedText] = useState<string>("");
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    if (params.id && user) {
      setDocumentId(params.id as string);
      fetchSOPDocument(params.id as string);
      fetchFeedbackCount(params.id as string);
      fetchFeedbacks(params.id as string);
    }
  }, [params.id, user]);

  // 显示灵动岛
  useEffect(() => {
    setShowDynamicIsland(true);

    return () => {
      // 清理时间器
      const timer = useEditorStore.getState().dynamicIslandTimeoutRef;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  const fetchSOPDocument = async (docId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch document details
      const { data: document, error: documentError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", docId)
        .eq("user_id", user?.id)
        .single();

      if (documentError) {
        throw new Error(
          "Document not found or you don't have permission to access it",
        );
      }

      setSOPDocument(document);

      // Fetch latest version
      const { data: versions, error: versionsError } = await supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", docId)
        .order("version_number", { ascending: false })
        .limit(1);

      if (versionsError) {
        throw new Error("Failed to fetch document versions");
      }

      if (versions && versions.length > 0) {
        const latestVersion = versions[0];
        setLatestVersionId(latestVersion.id);
        setVersionNumber(latestVersion.version_number);

        // Extract the content from the metadata
        if (latestVersion.metadata && latestVersion.metadata.content) {
          setSOPContent(latestVersion.metadata.content);
        } else {
          setSOPContent(""); // No content available
        }
      } else {
        // No versions exist yet
        setSOPContent("");
      }
    } catch (error) {
      console.error("Error fetching SOP for editing:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load the SOP",
      );
      toast.error("Failed to load SOP for editing");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeedbackCount = async (docId: string) => {
    try {
      const { count, error } = await supabase
        .from("document_feedback")
        .select("id", { count: "exact" })
        .eq("document_id", docId);

      if (error) {
        console.error("Error fetching feedback count:", error);
        return;
      }

      setFeedbackCount(count || 0);
    } catch (error) {
      console.error("Error fetching feedback count:", error);
    }
  };

  const fetchFeedbacks = async (docId: string) => {
    if (!docId || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from("document_feedback")
        .select("*")
        .eq("document_id", docId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching feedbacks:", error);
        toast.error("Failed to load feedbacks");
        return;
      }

      if (data && data.length > 0) {
        // Convert database feedback to FeedbackItem format
        const dbFeedbacks = data.map((item) => {
          const content = item.content;
          return {
            id: item.id,
            text: content.text,
            selectedText: content.selectedText,
            timestamp: new Date(item.created_at),
            type: content.type,
            mentorId: item.mentor_id,
            documentId: item.document_id,
            status: item.status,
          };
        });

        setFeedbacks(dbFeedbacks);
      } else {
        setFeedbacks([]);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      toast.error("Failed to load feedbacks");
    }
  };

  const handleSaveContent = async (newContent: string) => {
    if (!documentId || !user) {
      toast.error("Unable to save: Document or user information is missing");
      return;
    }

    try {
      setIsLoadingSaving(true);
      // 更新编辑器状态
      setIsSaving(true);

      // Create a new version with the updated content
      const newVersionNumber = versionNumber + 1;

      const { data: newVersion, error: versionError } = await supabase
        .from("document_versions")
        .insert({
          document_id: documentId,
          version_number: newVersionNumber,
          metadata: {
            format: "text",
            content: newContent,
            updated_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (versionError) {
        throw new Error("Failed to save changes");
      }

      // Update the local state
      setVersionNumber(newVersionNumber);
      setLatestVersionId(newVersion.id);
      setSOPContent(newContent);

      // Also update the document's updated_at timestamp
      await supabase
        .from("documents")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", documentId);

      // 更新编辑器保存状态
      setLastSaved(new Date());
      setIsDirty(false);
      toast.success("SOP saved successfully");
    } catch (error) {
      console.error("Error saving SOP:", error);
      toast.error("Failed to save changes");
      throw error; // Re-throw to let the TextEditor component handle the error state
    } finally {
      setIsLoadingSaving(false);
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/tools/sop/${documentId}`);
  };

  const handleFeedbackRemoved = (feedbackId: string) => {
    // Update the feedbacks array by removing the processed feedback
    setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
    // Update the feedback count
    setFeedbackCount(prev => Math.max(0, prev - 1));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={handleBack}
          className="text-blue-500 hover:text-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <h1 className="text-xl font-semibold">
              {sopDocument?.name || "Edit SOP"}
            </h1>
            <p className="text-sm text-gray-500">
              Creating Version {versionNumber + 1}
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex-1">
        <div className="max-w-4xl mx-auto px-4 py-4 h-full">
          <TextEditor
            initialContent={sopContent}
            onSave={handleSaveContent}
            placeholder="Write your Statement of Purpose here..."
            className="h-full"
            showIsland={false}
            highlights={feedbacks.map((feedback) => ({
              highlight: feedback.selectedText,
              className: feedback.id === activeCommentId
                ? "bg-yellow-200/70"
                : feedback.type === "suggestion"
                  ? "bg-violet-100/60"
                  : "bg-amber-100/50"
            }))}
            activeHighlight={activeCommentId ? feedbacks.find(f => f.id === activeCommentId)?.selectedText : undefined}
            onSelectionChange={setSelectedText}
          />
        </div>

        <TextIsland
          onSave={() => handleSaveContent(useEditorStore.getState().content)}
          feedbackCount={feedbackCount}
          feedbacks={feedbacks}
          onFeedbackClick={(feedback) => {
            setSelectedText(feedback.selectedText);
            setActiveCommentId(feedback.id);
          }}
          onApplyFeedback={(feedback) => {
            setSelectedText("");
            setActiveCommentId(null);
          }}
          onRejectFeedback={(feedback) => {
            setSelectedText("");
            setActiveCommentId(null);
          }}
          onMarkAsRead={(feedback) => {
            setSelectedText("");
            setActiveCommentId(null);
          }}
          onFeedbackRemoved={handleFeedbackRemoved}
        />
      </div>
    </div>
  );
}
