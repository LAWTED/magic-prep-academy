"use client";

import { createClient } from "@/utils/supabase/client";
import {
  ChevronRight,
  School,
  BookOpen,
  Filter,
  X,
  Heart,
  CheckCircle2,
  Dot,
  BookmarkCheck,
  Bookmark,
} from "lucide-react";
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
  subjects?: Subject;
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
        // Single optimized query to fetch schools with their programs and subjects
        const { data: schoolsWithProgramsData, error: fetchError } = await supabase
          .from("schools")
          .select(`
            *,
            programs:programs(
              *,
              subjects:subject_id(*)
            )
          `);

        if (fetchError) {
          console.error("Error fetching schools and programs:", fetchError);
          return;
        }

        // Fetch favorited and submitted programs if user is logged in
        let favoritedProgramIds: string[] = [];
        let submittedProgramIds: string[] = [];

        if (user) {
          // Get favorited programs and submitted applications in a single query
          const { data: userProgressData, error: progressError } = await supabase
            .from("user_programs_progress")
            .select("program_id, status, content")
            .eq("user_id", user.id);

          if (!progressError && userProgressData) {
            // Extract favorited programs
            favoritedProgramIds = userProgressData
              .filter(item => item.status === "favorited")
              .map(item => item.program_id);

            // Extract submitted applications
            submittedProgramIds = userProgressData
              .filter(item => item.content?.application_submitted === true)
              .map(item => item.program_id);

            setFavoritedPrograms(favoritedProgramIds);
            setSubmittedPrograms(submittedProgramIds);
          }
        }

        // Process the data to match the expected format
        const processedSchools = schoolsWithProgramsData
          .map((school: any) => {
            // Add subject_name to each program and check submission status
            const processedPrograms = school.programs.map((program: any) => ({
              ...program,
              subject_name: program.subjects ? program.subjects.subject_name : "Unknown Subject",
              is_submitted: submittedProgramIds.includes(program.id)
            }));

            return {
              ...school,
              programs: processedPrograms
            };
          })
          .filter((school: SchoolWithProgramsAndStatus) => school.programs.length > 0)
          .sort((a: SchoolWithProgramsAndStatus, b: SchoolWithProgramsAndStatus) =>
            a.name.localeCompare(b.name)
          );

        // Extract unique locations for filtering
        const uniqueLocations = Array.from(
          new Set(processedSchools.map((school: SchoolWithProgramsAndStatus) => school.location))
        ).sort();

        // Extract unique subjects
        const uniqueSubjects = Array.from(
          new Set(
            processedSchools.flatMap((school: SchoolWithProgramsAndStatus) =>
              school.programs.map(program => program.subjects)
            ).filter(Boolean)
          )
        ) as Subject[];

        setLocations(uniqueLocations);
        setSubjects(uniqueSubjects);
        setAllSchoolsWithPrograms(processedSchools);
        setSchoolsWithPrograms(processedSchools);
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
      <div className="p-4 space-y-4">
        {/* Skeleton for title */}
        <div className="h-14 bg-gold/60 rounded-lg px-4 mb-4 animate-pulse"></div>

        {/* Skeleton for filter buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-9 w-24 bg-sand/60 rounded-full animate-pulse"
            ></div>
          ))}
        </div>

        {/* Skeleton for schools/programs in grid view */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-sand/80 rounded-xl p-4 shadow-sm animate-pulse"
            >
              <div className="h-6 bg-bronze/20 rounded w-3/4 mb-3"></div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 bg-bronze/20 rounded w-1/2"></div>
                <div className="h-4 bg-bronze/20 rounded w-1/4"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 bg-gold/40 rounded-full w-24"></div>
                <div className="h-6 bg-skyblue/20 rounded-full w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative pb-4">
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold  top-0 bg-gold py-4 z-10 text-bronze rounded-lg px-4 shadow-sm mb-4 flex items-center gap-2">
          <School className="w-5 h-5 text-bronze" />
          Schools and Programs
        </h2>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setShowFavorited(!showFavorited)}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
              showFavorited
                ? "bg-sand text-bronze"
                : "bg-sand/50 text-bronze/70"
            }`}
          >
            <Bookmark
              className={`w-4 h-4 ${showFavorited ? "fill-bronze" : ""}`}
            />
            Target
          </button>
          <button
            onClick={toggleViewMode}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
              showAsCards ? "bg-sand/50 text-bronze/70" : "bg-sand text-bronze"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            {showAsCards ? "Grid View" : "List View"}
          </button>
          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="flex-shrink-0 flex items-center gap-1 bg-sand text-bronze px-3 py-1.5 rounded-full text-sm font-medium"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {filtersVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-sand p-4 rounded-xl shadow-sm space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-bronze">Filters</h3>
              {(selectedLocation !== "all" || selectedSubject !== "all") && (
                <button
                  onClick={clearFilters}
                  className="text-xs flex items-center gap-1 text-bronze/70"
                >
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm text-bronze mb-1">Location</label>
              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger className="w-full border-bronze/30 bg-sand/70">
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
              <label className="block text-sm text-bronze mb-1">Subject</label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger className="w-full border-bronze/30 bg-sand/70">
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

        <div className="space-y-4">
          {schoolsWithPrograms.length === 0 ? (
            <div className="text-center py-8 text-bronze bg-sand rounded-xl">
              <p>No schools or programs found with selected filters</p>
              {(selectedLocation !== "all" ||
                selectedSubject !== "all" ||
                showFavorited) && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-bronze/80 text-sm"
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
                    className="bg-sand rounded-xl overflow-hidden shadow-sm border border-bronze/20 cursor-pointer"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-lg line-clamp-2 text-black">
                            {program.name}
                          </h3>
                          <div className="flex items-center">
                            <p className="text-sm text-bronze">{school.name}</p>
                            <Dot className="size-4 text-cement" />
                            <p className="text-xs text-cement">
                              {school.location}
                            </p>
                          </div>
                        </div>
                        {program.is_submitted && (
                          <div
                            className="flex-shrink-0 text-grass"
                            title="Application Submitted"
                          >
                            <CheckCircle2 size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs bg-gold/60 text-bronze px-2 py-1 rounded-full flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {program.subject_name}
                        </span>
                        {favoritedPrograms.includes(program.id) && (
                          <span className="text-xs bg-skyblue/20 text-skyblue px-2 py-1 rounded-full flex items-center gap-1">
                            <BookmarkCheck className="w-3 h-3 fill-skyblue" />
                            Target
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
                  className="bg-sand rounded-xl overflow-hidden shadow-sm"
                >
                  <div className="p-4 border-b border-bronze/20">
                    <h3 className="font-medium text-lg text-bronze">
                      {school.name}
                    </h3>
                    <p className="text-sm text-cement">{school.location}</p>
                  </div>

                  <div className="divide-y divide-bronze/10">
                    {school.programs.map((program) => (
                      <motion.div
                        key={program.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push(`/school/${program.id}`)}
                        className="p-4 flex items-center justify-between hover:bg-gold/20 cursor-pointer transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <p className="font-medium text-black">
                              {program.name}
                            </p>
                            {program.is_submitted && (
                              <CheckCircle2
                                size={16}
                                className="text-grass flex-shrink-0 mt-1"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-gold/60 text-bronze px-2 py-1 rounded-full flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {program.subject_name}
                            </span>
                            {favoritedPrograms.includes(program.id) && (
                              <span className="text-xs bg-skyblue/20 text-skyblue px-2 py-1 rounded-full flex items-center gap-1">
                                <Heart className="w-3 h-3 fill-skyblue" />
                                Target
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-bronze/70" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
