"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Edit, MessageCircle, Eye, Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import SOPAnalysis from "../../components/SOPAnalysis";
import TextPreview from "@/app/(students)/tools/components/TextPreview";
import { toast } from "sonner";

export default function SOPVersionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sopData, setSOPData] = useState<any | null>(null);
  const [documentName, setDocumentName] = useState<string>("");
  const [versionNumber, setVersionNumber] = useState<number | null>(null);
  const [versionName, setVersionName] = useState<string | null>(null);

  useEffect(() => {
    if (params.id && params.versionId) {
      fetchSOPVersion(params.id as string, params.versionId as string);
    }
  }, [params]);

  const fetchSOPVersion = async (documentId: string, versionId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch document name
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .select("name")
        .eq("id", documentId)
        .single();

      if (documentError) {
        throw new Error("Document not found");
      }

      // Fetch version details
      const { data: versionData, error: versionError } = await supabase
        .from("document_versions")
        .select("*")
        .eq("id", versionId)
        .eq("document_id", documentId)
        .single();

      if (versionError) {
        throw new Error("Version not found");
      }

      setDocumentName(documentData.name);
      setVersionNumber(versionData.version_number);
      setVersionName(versionData.name);
      setSOPData(versionData.metadata || {});
    } catch (error) {
      console.error("Error fetching SOP version:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load SOP version"
      );
      toast.error("Could not load SOP version");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleAskMentor = () => {
    try {
      if (!sopData || !sopData.content) {
        toast.error("No SOP content available to share with the mentor");
        return;
      }

      // Create a prompt with the SOP data
      const versionLabel = versionName || `Version ${versionNumber || ""}`;
      const initialPrompt = `Please review my Statement of Purpose "${documentName}" (${versionLabel}) for graduate school applications and provide feedback on how to improve it. Here is the SOP content:\n\n${sopData.content}`;

      // Store in sessionStorage for the chat page to access
      sessionStorage.setItem("sop_review_prompt", initialPrompt);

      // Navigate to chat with the PhD mentor
      router.push(`/chat?person=phd-mentor&has_sop=true`);
    } catch (error) {
      console.error("Error preparing SOP for review:", error);
      toast.error("Could not prepare SOP for review");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading SOP version...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl text-red-700 font-medium mb-2">
            Error Loading SOP
          </h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <h1 className="text-xl font-semibold">{documentName}</h1>
            <p className="text-sm text-gray-500">
              {versionName || `Version ${versionNumber}`}
            </p>
          </div>
        </div>

        {/* Ask PhD Button - First Row */}
        <div className="mb-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAskMentor}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center"
          >
            <MessageCircle size={20} className="mr-2" />
            Ask PhD Mentor
          </motion.button>
        </div>

        {/* Analysis Section - Top */}
        {sopData && sopData.content && (
          <SOPAnalysis
            sopContent={sopData.content}
            fileName={`${documentName} - ${versionName || `Version ${versionNumber}`}`}
          />
        )}

        {/* SOP Content */}
        <div className="mt-6">
          <div className="flex items-center mb-4">
            <FileText className="text-blue-600 mr-3" size={20} />
            <h2 className="text-lg font-medium">Statement of Purpose</h2>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            {sopData && sopData.content ? (
              <TextPreview
                content={sopData.content}
                maxHeight="max-h-none"
                className="text-gray-800"
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No content available for this version
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}