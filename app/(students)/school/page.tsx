"use client";

import { createClient } from "@/utils/supabase/client";
import { ChevronRight, School, BookOpen, Filter, X, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUserStore } from "@/store/userStore";
import {
  Program,
  SchoolWithPrograms,
  Subject,
  School as SchoolType,
} from "@/app/types";
import { SCHOOL_PROMPTS } from "@/app/config/themePrompts";

export default function SchoolPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, isLoading: userLoading } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [schoolsWithPrograms, setSchoolsWithPrograms] = useState<
    SchoolWithPrograms[]
  >([]);
  const [allSchoolsWithPrograms, setAllSchoolsWithPrograms] = useState<
    SchoolWithPrograms[]
  >([]);
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);
  const [locations, setLocations] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [showFavorited, setShowFavorited] = useState(true);
  const [favoritedPrograms, setFavoritedPrograms] = useState<string[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);

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

        // Fetch favorited programs if user is logged in
        let favoritedProgramIds: string[] = [];
        if (user) {
          const { data: favoritesData, error: favoritesError } = await supabase
            .from('user_programs_progress')
            .select('program_id')
            .eq('user_id', user.id)
            .eq('status', 'favorited');

          if (!favoritesError && favoritesData) {
            favoritedProgramIds = favoritesData.map(item => item.program_id);
            setFavoritedPrograms(favoritedProgramIds);
          }
        }

        // Get all unique subject IDs from programs
        const subjectIds = Array.from(
          new Set(programsData.map((program) => program.subject_id))
        );

        // Fetch all subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("*")
          .in("id", subjectIds);

        if (subjectsError) {
          console.error("Error fetching subjects:", subjectsError);
          return;
        }

        setSubjects(subjectsData);

        // Create a mapping of subject IDs to subject names
        const subjectMap: Record<string, string> = {};
        subjectsData.forEach((subject: Subject) => {
          subjectMap[subject.id] = subject.subject_name;
        });

        // Organize programs by school
        const schoolsMap: Record<string, SchoolWithPrograms> = {};

        schoolsData.forEach((school: SchoolType) => {
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
          .filter((school) => school.programs.length > 0)
          .sort((a, b) => a.name.localeCompare(b.name));

        // Extract unique locations for filtering
        const uniqueLocations = Array.from(
          new Set(schoolsWithProgramsArray.map((school) => school.location))
        ).sort();

        setLocations(uniqueLocations);
        setAllSchoolsWithPrograms(schoolsWithProgramsArray);
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
  }, [router, supabase, userLoading, user]);

  useEffect(() => {
    // Apply filters whenever selected filters change
    let filteredSchools = [...allSchoolsWithPrograms];

    // Filter by location
    if (selectedLocation) {
      filteredSchools = filteredSchools.filter(
        (school) => school.location === selectedLocation
      );
    }

    // Filter by subject
    if (selectedSubject) {
      filteredSchools = filteredSchools.filter((school) =>
        school.programs.some(
          (program) => program.subject_id === selectedSubject
        )
      );

      // Also filter the programs within each school
      filteredSchools = filteredSchools.map((school) => ({
        ...school,
        programs: school.programs.filter(
          (program) => program.subject_id === selectedSubject
        ),
      }));
    }

    // Filter by favorited status
    if (showFavorited) {
      filteredSchools = filteredSchools.filter((school) =>
        school.programs.some((program) => favoritedPrograms.includes(program.id))
      );

      // Also filter the programs within each school
      filteredSchools = filteredSchools.map((school) => ({
        ...school,
        programs: school.programs.filter(
          (program) => favoritedPrograms.includes(program.id)
        ),
      }));
    }

    setSchoolsWithPrograms(filteredSchools);
  }, [selectedLocation, selectedSubject, showFavorited, allSchoolsWithPrograms, favoritedPrograms]);

  const toggleSchool = (schoolId: string) => {
    if (expandedSchool === schoolId) {
      setExpandedSchool(null);
    } else {
      setExpandedSchool(schoolId);
    }
  };

  const clearFilters = () => {
    setSelectedLocation("");
    setSelectedSubject("");
    setShowFavorited(true);
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
    <div className="relative pb-4">
      <div className="sticky top-0 z-10 bg-gray-50 shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <School className="w-5 h-5 text-primary" />
              Schools and Programs
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFavorited(!showFavorited)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                  showFavorited
                    ? "bg-primary/10 text-primary"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Heart className={`w-4 h-4 ${showFavorited ? "fill-primary" : ""}`} />
                Favorites
              </button>
              <button
                onClick={() => setFiltersVisible(!filtersVisible)}
                className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          {filtersVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white p-4 rounded-xl shadow-sm space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Filters</h3>
                {(selectedLocation || selectedSubject) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs flex items-center gap-1 text-gray-500"
                  >
                    <X className="w-3 h-3" /> Clear all
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 bg-transparent"
                >
                  <option value="">All locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 bg-transparent"
                >
                  <option value="">All subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4 mt-2">
        {schoolsWithPrograms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No schools or programs found with selected filters</p>
            {(selectedLocation || selectedSubject || showFavorited) && (
              <button
                onClick={clearFilters}
                className="mt-2 text-primary text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {[...schoolsWithPrograms, ...schoolsWithPrograms, ...schoolsWithPrograms, ...schoolsWithPrograms, ...schoolsWithPrograms, ...schoolsWithPrograms, ...schoolsWithPrograms, ...schoolsWithPrograms, ...schoolsWithPrograms, ...schoolsWithPrograms].map((school) => (
              <div
                key={school.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => toggleSchool(school.id)}
                  className="w-full p-4 flex items-center justify-between  transition-colors active:scale-[0.98] touch-action-manipulation"
                >
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-lg">{school.name}</h3>
                    <p className="text-sm text-gray-600">{school.location}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {school.programs.length} program
                      {school.programs.length !== 1 ? "s" : ""}
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
                          className="p-4 pl-6 flex items-center  active:bg-gray-100 transition-colors"
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
    </div>
  );
}
