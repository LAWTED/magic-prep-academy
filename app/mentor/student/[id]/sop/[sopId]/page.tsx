"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  FileText,
  Loader2,
  MessageCircle,
  CheckCircle,
  History,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useMentorStore } from "@/store/mentorStore";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import TextPreview from "@/app/components/TextPreview";
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
  version_number: number;
  name: string | null;
  created_at: string;
  updated_at: string;
  metadata: Document_VERSIONS_METADATA;
};

export default function MentorStudentSOPDetail() {
  const supabase = createClient();
  const { auth, mentor, fetchMentorData, isMentor, initialized } =
    useMentorStore();
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;
  const sopId = params?.sopId as string;

  const [student, setStudent] = useState<any | null>(null);
  const [sopDocument, setSOPDocument] = useState<SOPDocument | null>(null);
  const [versions, setVersions] = useState<SOPVersion[]>([]);
  const [latestVersion, setLatestVersion] = useState<SOPVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    if (studentId && sopId) {
      fetchData();
    }
  }, [auth, isMentor, initialized, studentId, sopId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch student info
      const { data: studentData, error: studentError } = await supabase
        .from("users")
        .select("*")
        .eq("id", studentId)
        .single();

      if (studentError || !studentData) {
        setError("Student not found");
        setIsLoading(false);
        return;
      }

      setStudent(studentData);

      // Fetch SOP document
      const { data: sopData, error: sopError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", sopId)
        .eq("user_id", studentId)
        .eq("type", "sop")
        .single();

      if (sopError) {
        setError("SOP not found");
        setIsLoading(false);
        return;
      }

      setSOPDocument(sopData);

      // Fetch SOP versions
      const { data: versionsData, error: versionsError } = await supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", sopId)
        .order("version_number", { ascending: false });

      if (versionsError) {
        console.error("Error fetching versions:", versionsError);
      } else {
        setVersions(versionsData || []);
        if (versionsData && versionsData.length > 0) {
          setLatestVersion(versionsData[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackChat = (versionId?: string) => {
    const targetVersionId = versionId || (latestVersion?.id as string);
    if (!targetVersionId) {
      toast.error("No version available to provide feedback on");
      return;
    }

    router.push(`/mentor/student/${studentId}/sop/${sopId}/feedback`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading student SOP...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto">
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            <h2 className="font-medium text-lg mb-2">Error</h2>
            <p>{error}</p>
            <Link href={`/mentor/student/${studentId}/sop`}>
              <span className="block mt-4 text-blue-600 hover:underline">
                Back to student SOPs
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Header */}
      <header className="w-full p-6 flex items-center gap-4 border-b bg-card">
        <Link
          href={`/mentor/student/${studentId}/sop`}
          className="text-primary"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{sopDocument?.name || "SOP"}</h1>
          <p className="text-muted-foreground">
            {student?.name}'s Statement of Purpose
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Provide Feedback Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleFeedbackChat()}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg flex items-center justify-center shadow-sm"
        >
          <MessageCircle size={20} className="mr-2" />
          Provide Feedback to {student?.name}
        </motion.button>

        {/* Latest Version Preview */}
        {latestVersion ? (
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-primary mr-3" />
                <h2 className="font-medium">
                  Latest Version (
                  {latestVersion.name ||
                    `Version ${latestVersion.version_number}`}
                  )
                </h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDate(latestVersion.created_at)}
              </span>
            </div>
            <div className="p-6">
              {latestVersion.metadata?.content ? (
                <TextPreview
                  content={latestVersion.metadata.content}
                  maxHeight="max-h-96"
                  className="text-foreground"
                />
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No content available for this version
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-lg border p-6 text-center">
            <p className="text-muted-foreground">
              No versions available for this SOP
            </p>
          </div>
        )}

        {/* Version History */}
        {versions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Version History
            </h2>

            <div className="space-y-2">
              {versions.map((version) => (
                <motion.div
                  key={version.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="bg-card rounded-lg border p-4 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-between"
                  onClick={() =>
                    router.push(
                      `/mentor/student/${studentId}/sop/${sopId}/${version.id}`
                    )
                  }
                >
                  <div className="flex items-center">
                    {version.id === latestVersion?.id ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary mr-3" />
                    )}
                    <div>
                      <h3 className="font-medium">
                        {version.name || `Version ${version.version_number}`}
                        {version.id === latestVersion?.id && " (Latest)"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Created: {formatDate(version.created_at)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
