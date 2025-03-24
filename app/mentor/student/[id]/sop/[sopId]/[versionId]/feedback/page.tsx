"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import TextEditor from "@/app/components/TextEditor";

export default function SOPFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const studentId = params.id as string;
  const sopId = params.sopId as string;
  const versionId = params.versionId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sopContent, setSOPContent] = useState<string>("");
  const [documentName, setDocumentName] = useState<string>("");
  const [versionNumber, setVersionNumber] = useState<number | null>(null);
  const [versionName, setVersionName] = useState<string | null>(null);
  const [student, setStudent] = useState<any | null>(null);

  useEffect(() => {
    if (studentId && sopId && versionId) {
      fetchData();
    }
  }, [studentId, sopId, versionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch student info
      const { data: studentData, error: studentError } = await supabase
        .from("users")
        .select("*")
        .eq("id", studentId)
        .single();

      if (studentError || !studentData) {
        setError("Student not found");
        setLoading(false);
        return;
      }

      setStudent(studentData);

      // Fetch document name
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .select("name")
        .eq("id", sopId)
        .eq("user_id", studentId)
        .single();

      if (documentError) {
        setError("Document not found");
        setLoading(false);
        return;
      }

      // Fetch version details
      const { data: versionData, error: versionError } = await supabase
        .from("document_versions")
        .select("*")
        .eq("id", versionId)
        .eq("document_id", sopId)
        .single();

      if (versionError) {
        setError("Version not found");
        setLoading(false);
        return;
      }

      setDocumentName(documentData.name);
      setVersionNumber(versionData.version_number);
      setVersionName(versionData.name);

      // Set SOP content
      const content = versionData.metadata?.content || "";
      setSOPContent(content);
    } catch (error) {
      console.error("Error fetching SOP version:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load SOP version"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading SOP...</p>
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
    <div className="w-full min-h-screen bg-background">
      {/* Header */}
      <header className="w-full p-6 flex items-center gap-4 border-b bg-card">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="text-primary"
        >
          <ArrowLeft size={24} />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{documentName}</h1>
          <p className="text-sm text-muted-foreground">
            Viewing {student?.name}'s SOP{" "}
            {versionName || `Version ${versionNumber}`}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center">
            <FileText className="text-primary mr-3" size={18} />
            <h2 className="font-medium">SOP Content</h2>
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto">
            <div className="prose max-w-none">
              {sopContent ? (
                <TextEditor
                  initialContent={sopContent}
                  onSave={async (content: string) => {
                    setSOPContent(content);
                    return Promise.resolve();
                  }}
                  showIsland={false}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No content available for this version
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
