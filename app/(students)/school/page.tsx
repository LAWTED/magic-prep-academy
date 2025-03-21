"use client";

import { createClient } from "@/utils/supabase/client";
import { ChevronRight, School, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUserStore } from "@/store/userStore";

interface School {
  id: string;
  name: string;
  location: string;
}

interface Program {
  id: string;
  school_id: string;
  subject_id: string;
  name: string;
}

interface Subject {
  id: string;
  subject_name: string;
}

interface SchoolWithPrograms extends School {
  programs: (Program & { subject_name: string })[];
}

export default function SchoolPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, isLoading: userLoading } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [schoolsWithPrograms, setSchoolsWithPrograms] = useState<SchoolWithPrograms[]>([]);
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all schools
        const { data: schoolsData, error: schoolsError } = await supabase
          .from("schools")
          .select("*");

        if (schoolsError) {
          console.error("Error fetching schools:", schoolsError);
          return;
        }

        // Fetch all programs
        const { data: programsData, error: programsError } = await supabase
          .from("programs")
          .select("*");

        if (programsError) {
          console.error("Error fetching programs:", programsError);
          return;
        }

        // Get all unique subject IDs from programs
        const subjectIds = Array.from(new Set(programsData.map(program => program.subject_id)));

        // Fetch all subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("*")
          .in("id", subjectIds);

        if (subjectsError) {
          console.error("Error fetching subjects:", subjectsError);
          return;
        }

        // Create a mapping of subject IDs to subject names
        const subjectMap: Record<string, string> = {};
        subjectsData.forEach((subject: Subject) => {
          subjectMap[subject.id] = subject.subject_name;
        });

        // Organize programs by school
        const schoolsMap: Record<string, SchoolWithPrograms> = {};

        schoolsData.forEach((school: School) => {
          schoolsMap[school.id] = {
            ...school,
            programs: [],
          };
        });

        programsData.forEach((program: Program) => {
          if (schoolsMap[program.school_id]) {
            schoolsMap[program.school_id].programs.push({
              ...program,
              subject_name: subjectMap[program.subject_id] || "Unknown Subject",
            });
          }
        });

        // Convert the map to an array and sort by school name
        const schoolsWithProgramsArray = Object.values(schoolsMap)
          .filter(school => school.programs.length > 0)
          .sort((a, b) => a.name.localeCompare(b.name));

        setSchoolsWithPrograms(schoolsWithProgramsArray);
      } catch (error) {
        console.error("Error loading school data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading) {
      fetchData();
    }
  }, [router, supabase, userLoading]);

  const toggleSchool = (schoolId: string) => {
    if (expandedSchool === schoolId) {
      setExpandedSchool(null);
    } else {
      setExpandedSchool(schoolId);
    }
  };

  if (loading || userLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-center h-[calc(100vh-180px)]">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-medium flex items-center gap-2">
        <School className="w-5 h-5 text-primary" />
        Schools and Programs
      </h2>

      {schoolsWithPrograms.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No schools or programs found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schoolsWithPrograms.map((school) => (
            <div key={school.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleSchool(school.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-[0.98] touch-action-manipulation"
              >
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-lg">{school.name}</h3>
                  <p className="text-sm text-gray-600">{school.location}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {school.programs.length} program{school.programs.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedSchool === school.id ? "rotate-90" : ""
                  }`}
                />
              </button>

              {expandedSchool === school.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-100"
                >
                  <div className="divide-y divide-gray-100">
                    {school.programs.map((program) => (
                      <div
                        key={program.id}
                        className="p-4 pl-6 flex items-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        onClick={() => router.push(`/school/${program.id}`)}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{program.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {program.subject_name}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}