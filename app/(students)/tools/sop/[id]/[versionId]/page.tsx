"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  MessageCircle,
  Eye,
  Loader2,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import SOPAnalysis from "../../components/SOPAnalysis";
import TextPreview from "@/app/components/TextPreview";
import { toast } from "sonner";
import LoadingCard from "@/app/components/LoadingCard";

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
    if (params?.id && params?.versionId) {
      fetchSOPVersion(params?.id as string, params?.versionId as string);
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
      const initialPrompt = `Please review my Statement of Purpose "${documentName}" (${versionLabel}) for graduate school applications and provide feedback on how to improve it. Here is the SOP content:\n\n${JSON.stringify(sopData, null, 2)}`;

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-yellow">
        <LoadingCard message="Loading SOP version..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-yellow">
        <div className="w-full max-w-3xl bg-sand border border-bronze/20 rounded-xl p-6">
          <h2 className="text-xl text-bronze font-medium mb-2">
            Error Loading SOP
          </h2>
          <p className="text-black">{error}</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-gold text-bronze rounded-lg hover:bg-gold/80 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-yellow">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="mr-4 p-2 rounded-full text-bronze "
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <h1 className="text-xl font-semibold text-bronze">
              {documentName}
            </h1>
            <p className="text-sm text-bronze">
              {versionName || `Version ${versionNumber}`}
            </p>
          </div>
        </div>

        {/* Ask PhD Button - First Row */}
        <div className="mb-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAskMentor}
            className="w-full bg-sand text-skyblue py-3 px-4 rounded-lg flex items-center justify-center"
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
            <FileText className="text-bronze mr-3" size={20} />
            <h2 className="text-lg font-medium text-bronze">
              Statement of Purpose
            </h2>
          </div>

          <div className="bg-sand rounded-xl border border-bronze/20 shadow-sm p-6">
            {sopData && sopData.content ? (
              <TextPreview
                content={sopData.content}
                maxHeight="max-h-none"
                className="text-black"
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-bronze/80">
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
