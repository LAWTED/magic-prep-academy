"use client";

import { createClient } from "@/utils/supabase/client";
import {
  ArrowLeft,
  BookOpen,
  School,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { toast } from "sonner";
import CheckStatusCard from "./components/CheckStatusCard";
import ReactMarkdown from "react-markdown";

interface Program {
  id: string;
  school_id: string;
  subject_id: string;
  name: string;
  content:
    | string
    | {
        name?: string;
        degree?: string;
        deadlines?: {
          fall?: string;
          spring?: string;
          summer?: string;
        };
        department?: string;
        programUrl?: string;
        university?: string;
        description?: string;
        requirements?: any;
        applicationUrl?: string;
        requiredDocuments?: any;
      }
    | null;
  application_deadline: string | null;
}

interface School {
  id: string;
  name: string;
  location: string;
}

interface Subject {
  id: string;
  subject_name: string;
}

export default function ProgramDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<Program | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [programSummary, setProgramSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Check if program is already favorited
  useEffect(() => {
    async function checkFavoriteStatus() {
      if (!user || !programId) return;

      try {
        const { data, error } = await supabase
          .from("user_programs_progress")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("program_id", programId)
          .single();

        if (data && data.status === "favorited") {
          setIsFavorited(true);
        }
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    }

    checkFavoriteStatus();
  }, [programId, user, supabase]);

  // Fetch program summary using the new API
  const fetchProgramSummary = async (programContent: any) => {
    if (!programContent) return;

    try {
      setSummaryLoading(true);
      const response = await fetch("/api/schoolInfo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          programContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch program summary");
      }

      const data = await response.json();
      if (data.success && data.summary) {
        setProgramSummary(data.summary);
      }
    } catch (error) {
      console.error("Error fetching program summary:", error);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Instead of getting user from Supabase, we're now using the user from the store
        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Fetch program details
        const { data: programData, error: programError } = await supabase
          .from("programs")
          .select("*")
          .eq("id", programId)
          .single();

        if (programError || !programData) {
          console.error("Error fetching program:", programError);
          router.push("/school");
          return;
        }

        setProgram(programData);

        // Fetch program summary
        if (programData.content) {
          fetchProgramSummary(programData.content);
        }

        // Fetch school details
        const { data: schoolData, error: schoolError } = await supabase
          .from("schools")
          .select("*")
          .eq("id", programData.school_id)
          .single();

        if (schoolError || !schoolData) {
          console.error("Error fetching school:", schoolError);
        } else {
          setSchool(schoolData);
        }

        // Fetch subject details
        const { data: subjectData, error: subjectError } = await supabase
          .from("subjects")
          .select("*")
          .eq("id", programData.subject_id)
          .single();

        if (subjectError || !subjectData) {
          console.error("Error fetching subject:", subjectError);
        } else {
          setSubject(subjectData);
        }
      } catch (error) {
        console.error("Error loading program data:", error);
        router.push("/school");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [programId, router, supabase, user]);

  const toggleFavorite = async () => {
    if (!user || !program) return;

    setFavoriteLoading(true);

    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from("user_programs_progress")
          .delete()
          .eq("user_id", user.id)
          .eq("program_id", programId);

        if (error) throw error;
        setIsFavorited(false);
        toast.success("Removed from favorites");
      } else {
        // Add to favorites
        const { error } = await supabase.from("user_programs_progress").upsert({
          user_id: user.id,
          program_id: programId,
          status: "favorited",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        setIsFavorited(true);
        toast.success("Added to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorites");
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-center h-[calc(100vh-180px)]">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-center h-[calc(100vh-180px)]">
          <p>Program not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/school")}
          className="flex items-center text-gray-600 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Schools
        </button>

        <button
          onClick={toggleFavorite}
          disabled={favoriteLoading}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            isFavorited
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          } ${favoriteLoading ? "opacity-70" : ""}`}
        >
          {isFavorited ? (
            <>
              <BookmarkCheck className="w-4 h-4" />
              Favorited
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4" />
              Favorite
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-xl ">
        <h1 className="text-2xl font-bold mb-1">{program.name}</h1>

        <div className="flex items-center gap-2">
          {subject && (
            <div className="mb-4">
              <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                <BookOpen className="w-3 h-3" />
                {subject.subject_name}
              </span>
            </div>
          )}

          {school && (
            <div className="flex items-center gap-1 text-gray-600 mb-4">
              <School className="w-4 h-4" />
              <span>
                {school.name}, {school.location}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Display AI-generated summary first */}
      {summaryLoading ? (
        <div className="prose prose-sm max-w-none mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex flex-col items-center py-4">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2"></div>
            <p className="text-gray-500 text-sm">Generating an AI summary...</p>
          </div>
        </div>
      ) : programSummary ? (
        <div className="prose prose-sm max-w-none mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="text-2xl font-bold mb-4 mt-6" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-xl font-bold mb-3 mt-5" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-lg font-bold mb-2 mt-4" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="mb-4 text-gray-700" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc pl-5 mb-4" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal pl-5 mb-4" {...props} />
              ),
              li: ({ node, ...props }) => <li className="mb-1" {...props} />,
              a: ({ node, ...props }) => (
                <a className="text-blue-600 hover:underline" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-gray-200 pl-4 italic my-4"
                  {...props}
                />
              ),
              code: ({ node, ...props }) => (
                <code
                  className="bg-gray-100 rounded px-1 py-0.5 font-mono text-sm"
                  {...props}
                />
              ),
              pre: ({ node, ...props }) => (
                <pre
                  className="bg-gray-100 rounded p-4 overflow-x-auto my-4 font-mono text-sm"
                  {...props}
                />
              ),
              hr: ({ node, ...props }) => (
                <hr className="my-6 border-t border-gray-200" {...props} />
              ),
            }}
          >
            {programSummary}
          </ReactMarkdown>
        </div>
      ) : null}

      {/* Check Status Card */}
      {programSummary && <CheckStatusCard programId={programId} />}
    </div>
  );
}
