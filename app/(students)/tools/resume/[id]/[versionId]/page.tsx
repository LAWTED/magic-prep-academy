"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, FileText, MessageCircle } from "lucide-react";
import APAPreview from "../../components/APAPreview";
import ResumeAnalysis from "../../components/ResumeAnalysis";
import { toast } from "sonner";

export default function ResumeVersionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<any | null>(null);
  const [documentName, setDocumentName] = useState<string>("");
  const [versionNumber, setVersionNumber] = useState<number | null>(null);
  const [versionName, setVersionName] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id && params?.versionId) {
      fetchResumeVersion(params?.id as string, params?.versionId as string);
    }
  }, [params]);

  const fetchResumeVersion = async (documentId: string, versionId: string) => {
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
      setResumeData(versionData.metadata?.content || {});
    } catch (error) {
      console.error("Error fetching resume version:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load resume version"
      );
      toast.error("Could not load resume version");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleAskMentor = () => {
    try {
      if (!resumeData || Object.keys(resumeData).length === 0) {
        toast.error("No resume data available to share with the mentor");
        return;
      }

      // Create a prompt with the resume data
      const versionLabel = versionName || `Version ${versionNumber || ""}`;
      const initialPrompt = `Please review my resume "${documentName}" (${versionLabel}) for academic applications and provide feedback on how to improve it. Here is the resume data:\n\n${JSON.stringify({ format: "APA", content: resumeData }, null, 2)}`;

      // Store in sessionStorage for the chat page to access
      sessionStorage.setItem("resume_review_prompt", initialPrompt);

      // Navigate to chat with the PhD mentor
      router.push(`/chat?person=phd-mentor&has_resume=true`);
    } catch (error) {
      console.error("Error preparing resume for review:", error);
      toast.error("Could not prepare resume for review");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-yellow">
        <div className="w-full max-w-3xl bg-sand border border-bronze/20 rounded-xl p-6">
          <h2 className="text-xl text-tomato font-medium mb-2">
            Error Loading Resume
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-yellow">
        <Loader2 className="h-8 w-8 text-bronze animate-spin" />
        <p className="mt-4 text-bronze">Loading resume...</p>
      </div>
    );
  }

  const hasResumeData = resumeData && typeof resumeData === 'object' && Object.keys(resumeData).length > 0;

  return (
    <div className="min-h-screen p-4 md:p-6 bg-yellow">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="mr-4 p-2 rounded-full hover:bg-sand text-bronze"
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
        {hasResumeData && (
          <ResumeAnalysis
            resumeContent={resumeData}
            fileName={`${documentName} - ${versionName || `Version ${versionNumber}`}`}
          />
        )}

        {/* Resume Content - Without Card Wrap */}
        <div className="mt-6">
          <div className="flex items-center mb-4">
            <FileText className="text-bronze mr-3" size={20} />
            <h2 className="text-lg font-medium text-bronze">Resume Content</h2>
          </div>

          {hasResumeData ? (
            <APAPreview
              resumeData={resumeData}
              fileName={`${documentName} - ${versionName || `Version ${versionNumber}`}`}
            />
          ) : (
            <div className="bg-sand rounded-xl border border-bronze/20 p-8 text-center">
              <p className="text-black">
                No content available for this version
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
