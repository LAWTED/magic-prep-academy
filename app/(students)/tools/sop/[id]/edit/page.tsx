"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";
import TextEditor from "@/app/components/TextEditor";

export default function SOPEditPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUserStore();

  const [sopDocument, setSOPDocument] = useState<any | null>(null);
  const [sopContent, setSOPContent] = useState<string>("");
  const [documentId, setDocumentId] = useState<string>("");
  const [latestVersionId, setLatestVersionId] = useState<string>("");
  const [versionNumber, setVersionNumber] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id && user) {
      setDocumentId(params.id as string);
      fetchSOPDocument(params.id as string);
    }
  }, [params.id, user]);

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
          "Document not found or you don't have permission to access it"
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
        if (
          latestVersion.metadata &&
          latestVersion.metadata.content
        ) {
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
        error instanceof Error ? error.message : "Failed to load the SOP"
      );
      toast.error("Failed to load SOP for editing");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveContent = async (newContent: string) => {
    if (!documentId || !user) {
      toast.error("Unable to save: Document or user information is missing");
      return;
    }

    try {
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

      toast.success("SOP saved successfully");
    } catch (error) {
      console.error("Error saving SOP:", error);
      toast.error("Failed to save changes");
      throw error; // Re-throw to let the TextEditor component handle the error state
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/tools/sop/${documentId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading SOP for editing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl text-red-700 font-medium mb-2">
            Error Loading SOP
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
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

      {/* Scrollable Editor Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 h-full">
          <TextEditor
            initialContent={sopContent}
            onSave={handleSaveContent}
            placeholder="Write your Statement of Purpose here..."
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
