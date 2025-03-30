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
import ApplicationProgressCard from "./components/ApplicationProgressCard";
import ProgramSummaryCard from "./components/ProgramSummaryCard";

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
        deadlines?: string;
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

        // Navigate to celebration page instead of showing toast
        if (school) {
          router.push(
            `/school/celebration?id=${programId}&name=${encodeURIComponent(school.name)}`
          );
        } else {
          toast.success("Added to favorites");
        }
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
      <div className="p-4 space-y-6 bg-yellow">

        {/* Skeleton for buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-9 w-32 bg-sand/60 rounded-full animate-pulse"></div>
          <div className="h-9 w-24 bg-sand/60 rounded-full animate-pulse"></div>
        </div>

        {/* Skeleton for program details card */}
        <div className="bg-sand/80 rounded-xl p-4 shadow-sm animate-pulse">
          <div className="h-8 bg-bronze/20 rounded w-3/4 mb-4"></div>
          <div className="flex flex-wrap gap-3 mb-3">
            <div className="h-6 bg-gold/40 rounded-full w-28"></div>
            <div className="h-6 bg-bronze/20 rounded-full w-48"></div>
          </div>
        </div>

        {/* Skeleton for application progress */}
        <div className="bg-sand/80 rounded-xl p-4 shadow-sm animate-pulse">
          <div className="h-6 bg-bronze/20 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-14 bg-bronze/10 rounded-lg"></div>
            ))}
          </div>
          <div className="h-12 bg-gold/40 rounded-lg mt-6"></div>
        </div>

        {/* Skeleton for program summary */}
        <div className="bg-sand/80 rounded-xl p-4 shadow-sm animate-pulse">
          <div className="h-6 bg-bronze/20 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-bronze/20 rounded w-full"></div>
            <div className="h-4 bg-bronze/20 rounded w-5/6"></div>
            <div className="h-4 bg-bronze/20 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="p-4 space-y-6 bg-yellow">
        <div className="flex items-center justify-center h-[calc(100vh-180px)]">
          <p className="text-bronze">Program not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 bg-yellow">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push("/school")}
          className="flex items-center text-bronze active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Schools
        </button>

        <button
          onClick={toggleFavorite}
          disabled={favoriteLoading}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            isFavorited
              ? "bg-gold text-bronze"
              : "bg-sand text-bronze hover:bg-sand/80"
          } ${favoriteLoading ? "opacity-70" : ""}`}
        >
          {isFavorited ? (
            <>
              <BookmarkCheck className="w-4 h-4" />
              Target
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4" />
              Target
            </>
          )}
        </button>
      </div>

      <div className="bg-sand rounded-xl p-4 shadow-sm border border-bronze/20">
        <h1 className="text-2xl font-bold mb-1 text-black">{program.name}</h1>

        <div className="flex items-center gap-2">
          {subject && (
            <div className="mb-4">
              <span className="text-sm bg-gold/60 text-bronze px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                <BookOpen className="w-3 h-3" />
                {subject.subject_name}
              </span>
            </div>
          )}

          {school && (
            <div className="flex items-center gap-1 text-bronze mb-4">
              <School className="w-4 h-4" />
              <span>
                {school.name}, {school.location}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Application Progress Card - only show for favorited programs */}
      {isFavorited && <ApplicationProgressCard programId={programId} />}

      {/* Program Summary Card */}
      {program?.content && (
        <ProgramSummaryCard programContent={program.content} />
      )}

      {/* Check Status Card */}
      <CheckStatusCard programId={programId} />
    </div>
  );
}
