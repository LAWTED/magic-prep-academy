"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMentorStore } from "@/store/mentorStore";
import { Document_METADATA } from "@/app/types";

type SOPDocument = {
  id: string;
  name: string;
  user_id: string;
  type: string;
  created_at: string;
  updated_at: string;
  metadata: Document_METADATA;
};

export default function MentorStudentSOPList() {
  const supabase = createClient();
  const { auth, mentor, fetchMentorData, isMentor, initialized } = useMentorStore();
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any | null>(null);
  const [sopDocuments, setSOPDocuments] = useState<SOPDocument[]>([]);
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

    fetchData();
  }, [auth, isMentor, initialized, studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);

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

      // Fetch student's SOPs
      const { data: sopData, error: sopError } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", studentId)
        .eq("type", "sop")
        .order("updated_at", { ascending: false });

      if (sopError) {
        setError("Failed to fetch student SOPs");
      } else {
        setSOPDocuments(sopData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading student SOPs...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Header */}
      <header className="w-full p-6 flex items-center gap-4 border-b bg-card">
        <Link href={`/mentor/student/${studentId}`} className="text-primary">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{student?.name || "Student"}'s SOPs</h1>
          <p className="text-muted-foreground">Review and provide feedback</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        ) : sopDocuments.length === 0 ? (
          <div className="p-6 bg-card rounded-lg text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-medium mb-2">No SOPs Found</h2>
            <p className="text-muted-foreground">
              This student hasn't uploaded any Statements of Purpose yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sopDocuments.map((sop) => (
              <motion.div
                key={sop.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="bg-card rounded-lg border p-4 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/mentor/student/${studentId}/sop/${sop.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-primary mr-3" />
                    <div>
                      <h3 className="font-medium">{sop.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {formatDate(sop.updated_at)}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    SOP
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}