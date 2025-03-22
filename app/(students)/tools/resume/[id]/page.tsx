"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Edit, MessageCircle, Eye } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import ResumeVersions from "../components/ResumeVersions";
import APAPreview from "../components/APAPreview";
import { Document_METADATA, Document_VERSIONS_METADATA } from "@/app/types";

type ResumeDocument = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  metadata: Document_METADATA;
};

type ResumeVersion = {
  id: string;
  document_id: string;
  version_number: number;
  metadata: Document_VERSIONS_METADATA;
  created_at: string;
  name?: string;
};

export default function ResumeVersionsPage() {
  const supabase = createClient();
  const { user } = useUserStore();
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [resumeDocument, setResumeDocument] = useState<ResumeDocument | null>(
    null
  );
  const [latestVersion, setLatestVersion] = useState<ResumeVersion | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (documentId && user) {
      fetchResumeDocument();
      fetchLatestVersion();
    }
  }, [documentId, user]);

  const fetchResumeDocument = async () => {
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

      setResumeDocument(data);
    } catch (error) {
      console.error("Error fetching resume document:", error);
      setError(
        "Failed to load resume. It might not exist or you may not have permission to view it."
      );
      toast.error("Failed to load resume document");
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
    if (!latestVersion) {
      return (
        <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Eye size={18} className="mr-2 text-gray-500" />
              No Versions Available
            </h2>
          </div>
          <p className="text-gray-500">
            This resume doesn't have any versions yet. Edit the resume to create
            a new version.
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

        <div className="prose max-w-none">
          {typeof latestVersion.metadata.content === "string" ? (
            <div className="apa-format font-serif leading-loose whitespace-pre-wrap p-6 bg-slate-50 border border-slate-200 rounded-md">
              {/* APA Format Styling */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-1">
                  {resumeDocument?.name}
                </h1>
                <p className="text-sm mb-2">{user?.email}</p>
                <p className="text-sm">Magic Prep Academy</p>
              </div>
              <div className="apa-content">
                {latestVersion.metadata.content}
              </div>
            </div>
          ) : (
            <APAPreview
              resumeData={latestVersion.metadata.content}
              fileName={resumeDocument?.name || "Resume"}
              defaultExpanded={false}
            />
          )}
        </div>

        {latestVersion.name && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              Version Name:
            </h3>
            <p className="text-sm text-gray-600">{latestVersion.name}</p>
          </div>
        )}
      </div>
    );
  };

  // For debugging
  const renderDebugData = () => {
    return process.env.NODE_ENV === "development" ? (
      <div className="mt-6 bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-60 hidden">
        <h3 className="font-bold mb-2">Debug Data:</h3>
        <div>
          <strong>Latest Version:</strong>
          <pre>{JSON.stringify(latestVersion, null, 2)}</pre>
        </div>
      </div>
    ) : null;
  };

  return (
    <div className="p-4 pb-20 w-full">
      <div className="flex items-center mb-6">
        <Link href="/tools/resume">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
          >
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        {isLoading ? (
          <h1 className="ml-3 text-2xl font-bold">Loading Resume...</h1>
        ) : (
          <h1 className="ml-3 text-2xl font-bold">
            {resumeDocument?.name || "Resume Not Found"}
          </h1>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 bg-white rounded-xl shadow-sm border p-5">
          <p className="text-red-500 mb-2">{error}</p>
          <Link href="/tools/resume">
            <span className="text-blue-600 hover:underline">
              Return to Resume List
            </span>
          </Link>
        </div>
      ) : resumeDocument ? (
        <>
          <div className="flex gap-2 mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (latestVersion?.metadata) {
                  try {
                    // 准备完整的metadata对象，包括format等信息
                    const resumeMetadata = latestVersion.metadata;
                    const documentName = resumeDocument?.name || "Resume";

                    // 创建包含完整上下文的提示，但针对简历编辑
                    const initialPrompt = `Here is my resume "${documentName}" (Version ${latestVersion.version_number}). \n\n${JSON.stringify(resumeMetadata, null, 2)}`;

                    // 使用sessionStorage存储内容
                    sessionStorage.setItem(
                      "resume_review_prompt",
                      initialPrompt
                    );

                    // 导航到聊天页面，使用resume-editor角色
                    router.push(
                      `/tools/resume/${documentId}/edit?person=resume-editor&has_resume=true`
                    );
                  } catch (error) {
                    console.error("Error processing resume:", error);
                    toast.error("Could not prepare resume for editing");
                  }
                } else {
                  // 如果没有简历数据，直接导航到聊天页面
                  toast.info("No resume data available to edit");
                }
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
                if (latestVersion?.metadata) {
                  try {
                    // 准备完整的metadata对象，包括format等信息
                    const resumeMetadata = latestVersion.metadata;
                    const documentName = resumeDocument?.name || "Resume";

                    // 创建包含完整上下文的提示
                    const initialPrompt = `Please review my resume "${documentName}" (Version ${latestVersion.version_number}) for academic applications and provide feedback on how to improve it. Here is the resume data:\n\n${JSON.stringify(resumeMetadata, null, 2)}`;

                    // 使用sessionStorage存储内容
                    sessionStorage.setItem(
                      "resume_review_prompt",
                      initialPrompt
                    );

                    // 导航到聊天页面，使用标记指示存在sessionStorage数据
                    router.push(`/chat?person=phd-mentor&has_resume=true`);
                  } catch (error) {
                    console.error("Error processing resume:", error);
                    router.push("/chat?person=phd-mentor");
                    toast.error("Could not prepare resume for review");
                  }
                } else {
                  // 如果没有简历数据，直接导航到聊天页面
                  router.push("/chat?person=phd-mentor");
                  toast.info(
                    "No resume data available to share with the mentor"
                  );
                }
              }}
              className="flex items-center gap-1 py-2 px-4 bg-purple-100 text-purple-600 rounded-full font-medium"
            >
              <MessageCircle size={16} />
              <span>Chat with PhD</span>
            </motion.button>
          </div>

          {renderPreview()}

          {renderDebugData()}

          <ResumeVersions
            documentId={documentId}
            documentName={resumeDocument?.name || ""}
            onBack={() => {}} // Not used since we have the Link above
          />
        </>
      ) : (
        <div className="text-center py-8 bg-white rounded-xl shadow-sm border p-5">
          <p className="text-gray-500 mb-2">Resume not found</p>
          <Link href="/tools/resume">
            <span className="text-blue-600 hover:underline">
              Return to Resume List
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
