"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Edit, MessageCircle, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import SOPVersions from "../components/SOPVersions";
import TextPreview from "@/app/(students)/tools/components/TextPreview";
import { Document_METADATA, Document_VERSIONS_METADATA } from "@/app/types";

type SOPDocument = {
  id: string;
  name: string;
  user_id: string;
  type: string;
  created_at: string;
  updated_at: string;
  metadata: Document_METADATA;
};

type SOPVersion = {
  id: string;
  document_id: string;
  user_id: string;
  version_number: number;
  name: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  metadata: Document_VERSIONS_METADATA;
};

export default function SOPVersionsPage() {
  const supabase = createClient();
  const { user } = useUserStore();
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [sopDocument, setSOPDocument] = useState<SOPDocument | null>(null);
  const [latestVersion, setLatestVersion] = useState<SOPVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (documentId && user) {
      fetchSOPDocument();
      fetchLatestVersion();
    }
  }, [documentId, user]);

  const fetchSOPDocument = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .eq("user_id", user?.id)
        .single();

      if (error) {
        throw error;
      }

      setSOPDocument(data);
    } catch (error) {
      console.error("Error fetching SOP document:", error);
      setError(
        "Failed to load SOP. It might not exist or you may not have permission to view it."
      );
      toast.error("Failed to load SOP document");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLatestVersion = async () => {
    try {
      const { data, error } = await supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", documentId)
        .order("version_number", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching latest version:", error);
        return;
      }

      if (data && data.length > 0) {
        setLatestVersion(data[0]);
      } else {
        setLatestVersion(null);
        console.log("No versions found for this document");
      }
    } catch (error) {
      console.error("Error fetching latest version:", error);
    }
  };

  const renderPreview = () => {
    if (!latestVersion || !latestVersion.metadata?.content) {
      return (
        <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Eye size={18} className="mr-2 text-gray-500" />
              No Content Available
            </h2>
          </div>
          <p className="text-gray-500">
            This SOP doesn't have any content available for preview.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Eye size={18} className="mr-2 text-gray-500" />
            Latest Preview (Version {latestVersion.version_number})
          </h2>
          <span className="text-sm text-gray-500">
            {new Date(latestVersion.created_at).toLocaleDateString()}
          </span>
        </div>

        <TextPreview
          content={latestVersion.metadata.content}
          maxHeight="max-h-64"
          className="text-gray-800"
          fileName={`sop-version-${latestVersion.version_number}.pdf`}
        />
      </div>
    );
  };

  return (
    <div className="p-4 pb-20 w-full">
      <div className="flex items-center mb-6">
        <Link href="/tools/sop">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
          >
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        {isLoading ? (
          <h1 className="ml-3 text-2xl font-bold">Loading SOP...</h1>
        ) : (
          <h1 className="ml-3 text-2xl font-bold">
            {sopDocument?.name || "SOP Not Found"}
          </h1>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : sopDocument ? (
        <>
          <div className="flex gap-2 mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                router.push(`/tools/sop/${documentId}/edit`);
              }}
              className="flex items-center gap-1 py-2 px-4 bg-blue-100 text-blue-600 rounded-full font-medium"
            >
              <Edit size={16} />
              <span>Edit</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (latestVersion?.metadata?.content) {
                  try {
                    // Create a prompt with the SOP data
                    const versionLabel = latestVersion.name || `Version ${latestVersion.version_number}`;
                    const initialPrompt = `Please review my Statement of Purpose "${sopDocument?.name}" (${versionLabel}) for graduate school applications and provide feedback on how to improve it. Here is the SOP content:\n\n${latestVersion.metadata.content}`;

                    // Store in sessionStorage for the chat page to access
                    sessionStorage.setItem("sop_review_prompt", initialPrompt);

                    // Navigate to chat with the PhD mentor
                    router.push(`/chat?person=phd-mentor&has_sop=true`);
                  } catch (error) {
                    console.error("Error preparing SOP for review:", error);
                    toast.error("Could not prepare SOP for review");
                  }
                } else {
                  // If there's no SOP content
                  toast.info("No SOP content available to share with the mentor");
                }
              }}
              className="flex items-center gap-1 py-2 px-4 bg-purple-100 text-purple-600 rounded-full font-medium"
            >
              <MessageCircle size={16} />
              <span>Chat with PhD</span>
            </motion.button>
          </div>

          {renderPreview()}

          <h2 className="text-xl font-semibold mb-4">Version History</h2>
          <SOPVersions
            documentId={documentId}
            documentName={sopDocument?.name || ""}
            onBack={() => {}} // Not used since we have the Link above
            onVersionChange={fetchLatestVersion}
          />
        </>
      ) : (
        <div className="text-center py-8 bg-white rounded-xl shadow-sm border p-5">
          <p className="text-gray-500 mb-2">SOP not found</p>
          <Link href="/tools/sop">
            <span className="text-blue-600 hover:underline">
              Return to SOP List
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
