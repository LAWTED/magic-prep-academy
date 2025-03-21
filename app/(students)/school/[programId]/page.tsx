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
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

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

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">{program.name}</h1>

        {school && (
          <div className="flex items-center gap-1 text-gray-600 mb-4">
            <School className="w-4 h-4" />
            <span>
              {school.name}, {school.location}
            </span>
          </div>
        )}

        {subject && (
          <div className="mb-4">
            <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1 w-fit">
              <BookOpen className="w-3 h-3" />
              {subject.subject_name}
            </span>
          </div>
        )}

        {program.application_deadline && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Application Deadline</h3>
            <p>{new Date(program.application_deadline).toLocaleDateString()}</p>
          </div>
        )}

        {program.content && (
          <div className="mt-6">
            <button
              onClick={() => setIsInfoExpanded(!isInfoExpanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-semibold">About the Program</h3>
              <div className="bg-gray-100 rounded-full p-1">
                {isInfoExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
              </div>
            </button>

            {isInfoExpanded && (
              <div className="mt-2 space-y-4 animate-fadeIn">
                <div className="prose prose-sm max-w-none">
                  {typeof program.content === "string"
                    ? program.content
                    : program.content.description ||
                      JSON.stringify(program.content, null, 2)}
                </div>

                {typeof program.content === "object" &&
                  program.content !== null && (
                    <div className="space-y-4">
                      {/* Program details */}
                      {program.content.name && (
                        <div>
                          <h4 className="text-md font-semibold">
                            Program Name
                          </h4>
                          <p>{program.content.name}</p>
                        </div>
                      )}

                      {program.content.degree && (
                        <div>
                          <h4 className="text-md font-semibold">Degree Type</h4>
                          <p>{program.content.degree}</p>
                        </div>
                      )}

                      {program.content.department && (
                        <div>
                          <h4 className="text-md font-semibold">Department</h4>
                          <p>{program.content.department}</p>
                        </div>
                      )}

                      {program.content.university && (
                        <div>
                          <h4 className="text-md font-semibold">University</h4>
                          <p>{program.content.university}</p>
                        </div>
                      )}

                      {program.content.deadlines && (
                        <div>
                          <h4 className="text-md font-semibold">
                            Application Deadlines
                          </h4>
                          <ul className="list-disc pl-5">
                            {program.content.deadlines.fall && (
                              <li>
                                Fall:{" "}
                                {new Date(
                                  program.content.deadlines.fall
                                ).toLocaleDateString()}
                              </li>
                            )}
                            {program.content.deadlines.spring && (
                              <li>
                                Spring:{" "}
                                {new Date(
                                  program.content.deadlines.spring
                                ).toLocaleDateString()}
                              </li>
                            )}
                            {program.content.deadlines.summer && (
                              <li>
                                Summer:{" "}
                                {new Date(
                                  program.content.deadlines.summer
                                ).toLocaleDateString()}
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Links */}
                      <div className="flex flex-col gap-2">
                        {program.content.programUrl && (
                          <a
                            href={program.content.programUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                          >
                            Program Website
                          </a>
                        )}

                        {program.content.applicationUrl && (
                          <a
                            href={program.content.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                          >
                            Application Portal
                          </a>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {!program.content && (
          <div className="text-gray-500 italic">
            No additional information available about this program.
          </div>
        )}
      </div>

      {/* Check Status Card */}
      <CheckStatusCard programId={programId} />
    </div>
  );
}
