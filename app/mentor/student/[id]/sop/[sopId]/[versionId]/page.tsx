"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, Loader2, FileText, Edit } from "lucide-react";
import Link from "next/link";
import { useMentorStore } from "@/store/mentorStore";
import TextPreview from "@/app/components/TextPreview";
import { toast } from "sonner";

export default function MentorSOPVersionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { auth, mentor, fetchMentorData, isMentor, initialized } = useMentorStore();

  const studentId = params.id as string;
  const sopId = params.sopId as string;
  const versionId = params.versionId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sopData, setSOPData] = useState<any | null>(null);
  const [documentName, setDocumentName] = useState<string>("");
  const [versionNumber, setVersionNumber] = useState<number | null>(null);
  const [versionName, setVersionName] = useState<string | null>(null);
  const [student, setStudent] = useState<any | null>(null);
  const [hasFeedback, setHasFeedback] = useState(false);

  useEffect(() => {
    // Initialize mentor store if not already done
    if (!initialized) {
      fetchMentorData();
    }
  }, [initialized, fetchMentorData]);

  useEffect(() => {
    // Only proceed if we've checked mentor status
    if (!initialized) return;

    if (!auth) {
      router.push("/mentor/sign-in");
      return;
    }

    if (!isMentor) {
      router.push("/mentor/onboarding");
      return;
    }

    if (studentId && sopId && versionId) {
      fetchData();
    }
  }, [auth, isMentor, initialized, studentId, sopId, versionId]);

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
      setSOPData(versionData.metadata || {});

      // Check if there's existing feedback
      if (mentor?.id) {
        const { data: existingFeedback, error: feedbackError } = await supabase
          .from("document_feedback")
          .select("id")
          .eq("document_version_id", versionId)
          .eq("mentor_id", mentor.id)
          .single();

        if (!feedbackError && existingFeedback) {
          setHasFeedback(true);
        }
      }
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

  const handleEditFeedback = () => {
    router.push(`/mentor/student/${studentId}/sop/${sopId}/${versionId}/feedback`);
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
        <div>
          <h1 className="text-xl font-bold">{documentName}</h1>
          <p className="text-sm text-muted-foreground">
            {student?.name} • {versionName || `Version ${versionNumber}`}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Provide Feedback Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleEditFeedback}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg flex items-center justify-center shadow-sm"
        >
          {hasFeedback ? (
            <>
              <Edit size={20} className="mr-2" />
              Edit Feedback
            </>
          ) : (
            <>
              <MessageCircle size={20} className="mr-2" />
              Provide Feedback
            </>
          )}
        </motion.button>

        {/* SOP Content */}
        <div>
          <div className="flex items-center mb-4">
            <FileText className="text-primary mr-3" size={20} />
            <h2 className="text-lg font-medium">Statement of Purpose</h2>
          </div>

          <div className="bg-card rounded-lg border shadow-sm p-6">
            {sopData && sopData.content ? (
              <TextPreview
                content={sopData.content}
                maxHeight="max-h-none"
                className="text-foreground"
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
      </main>
    </div>
  );
}