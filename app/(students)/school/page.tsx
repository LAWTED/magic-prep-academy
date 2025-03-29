"use client";

import { createClient } from "@/utils/supabase/client";
import { ChevronRight, School, BookOpen, Filter, X, Heart, CheckCircle2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProgramWithSubmissionStatus extends Program {
  subject_name: string;
  is_submitted?: boolean;
}

interface SchoolWithProgramsAndStatus extends SchoolType {
  programs: ProgramWithSubmissionStatus[];
}

export default function SchoolPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, isLoading: userLoading } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [schoolsWithPrograms, setSchoolsWithPrograms] = useState<
    SchoolWithProgramsAndStatus[]
  >([]);
  const [allSchoolsWithPrograms, setAllSchoolsWithPrograms] = useState<
    SchoolWithProgramsAndStatus[]
  >([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [showFavorited, setShowFavorited] = useState(false);
  const [favoritedPrograms, setFavoritedPrograms] = useState<string[]>([]);
  const [submittedPrograms, setSubmittedPrograms] = useState<string[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [showAsCards, setShowAsCards] = useState(true);

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

        // Fetch favorited and submitted programs if user is logged in
        let favoritedProgramIds: string[] = [];
        let submittedProgramIds: string[] = [];

        if (user) {
          // Get favorited programs
          const { data: favoritesData, error: favoritesError } = await supabase
            .from("user_programs_progress")
            .select("program_id")
            .eq("user_id", user.id)
            .eq("status", "favorited");

          if (!favoritesError && favoritesData) {
            favoritedProgramIds = favoritesData.map((item) => item.program_id);
            setFavoritedPrograms(favoritedProgramIds);
          }

          // Get submitted applications
          const { data: progressData, error: progressError } = await supabase
            .from("user_programs_progress")
            .select("program_id, content")
            .eq("user_id", user.id);

          if (!progressError && progressData) {
            submittedProgramIds = progressData
              .filter(item => item.content?.application_submitted === true)
              .map(item => item.program_id);
            setSubmittedPrograms(submittedProgramIds);
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
        const schoolsMap: Record<string, SchoolWithProgramsAndStatus> = {};

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
              is_submitted: submittedProgramIds.includes(program.id)
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
    if (selectedLocation !== "all") {
      filteredSchools = filteredSchools.filter(
        (school) => school.location === selectedLocation
      );
    }

    // Filter by subject
    if (selectedSubject !== "all") {
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
        school.programs.some((program) =>
          favoritedPrograms.includes(program.id)
        )
      );

      // Also filter the programs within each school
      filteredSchools = filteredSchools.map((school) => ({
        ...school,
        programs: school.programs.filter((program) =>
          favoritedPrograms.includes(program.id)
        ),
      }));
    }

    setSchoolsWithPrograms(filteredSchools);
  }, [
    selectedLocation,
    selectedSubject,
    showFavorited,
    allSchoolsWithPrograms,
    favoritedPrograms,
  ]);

  const clearFilters = () => {
    setSelectedLocation("all");
    setSelectedSubject("all");
    setShowFavorited(false);
  };

  const toggleViewMode = () => {
    setShowAsCards(!showAsCards);
  };

  if (loading || userLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-center h-[calc(100vh-180px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pb-4">
      <div className="sticky top-0 z-10 bg-gray-50 shadow-sm">
        <div className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <School className="w-5 h-5 text-primary" />
              Schools and Programs
            </h2>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setShowFavorited(!showFavorited)}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                  showFavorited
                    ? "bg-primary/10 text-primary"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${showFavorited ? "fill-primary" : ""}`}
                />
                Favorites
              </button>
              <button
                onClick={toggleViewMode}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                  showAsCards
                    ? "bg-gray-100 text-gray-600"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                {showAsCards ? "Grid View" : "List View"}
              </button>
              <button
                onClick={() => setFiltersVisible(!filtersVisible)}
                className="flex-shrink-0 flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium"
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
                {(selectedLocation !== "all" || selectedSubject !== "all") && (
                  <button
                    onClick={clearFilters}
                    className="text-xs flex items-center gap-1 text-gray-500"
                  >
                    <X className="w-3 h-3" /> Clear all
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Location
                </label>
                <Select
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Subject
                </label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4 mt-2">
        {schoolsWithPrograms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No schools or programs found with selected filters</p>
            {(selectedLocation !== "all" ||
              selectedSubject !== "all" ||
              showFavorited) && (
              <button
                onClick={clearFilters}
                className="mt-2 text-primary text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : showAsCards ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {schoolsWithPrograms.flatMap((school) =>
              school.programs.map((program) => (
                <motion.div
                  key={program.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/school/${program.id}`)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 cursor-pointer"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-lg line-clamp-2">{program.name}</h3>
                        <p className="text-sm text-gray-600">{school.name}</p>
                        <p className="text-xs text-gray-500">{school.location}</p>
                      </div>
                      {program.is_submitted && (
                        <div className="flex-shrink-0 text-green-600" title="Application Submitted">
                          <CheckCircle2 size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {program.subject_name}
                      </span>
                      {favoritedPrograms.includes(program.id) && (
                        <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-pink-600" />
                          Favorite
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          /* List View - grouped by school */
          <div className="space-y-4">
            {schoolsWithPrograms.map((school) => (
              <div
                key={school.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
              >
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-medium text-lg">{school.name}</h3>
                  <p className="text-sm text-gray-600">{school.location}</p>
                </div>

                <div className="divide-y divide-gray-100">
                  {school.programs.map((program) => (
                    <motion.div
                      key={program.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(`/school/${program.id}`)}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          <p className="font-medium">{program.name}</p>
                          {program.is_submitted && (
                            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {program.subject_name}
                          </span>
                          {favoritedPrograms.includes(program.id) && (
                            <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full flex items-center gap-1">
                              <Heart className="w-3 h-3 fill-pink-600" />
                              Favorite
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
