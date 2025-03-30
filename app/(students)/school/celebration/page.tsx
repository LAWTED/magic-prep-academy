"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles, Star, Check, Calendar } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";
import { toast } from "sonner";
import { themeConfig } from "@/app/config/themeConfig";

// Define timeline theme key type
export type TimelineThemeKey =
  | "languageTest"
  | "applicationMaterials"
  | "submitApplication"
  | "receiveOffers"
  | "prepareVisa"
  | "startSchool";

// Generate timeframe display string from start and end dates
const getTimeframe = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const startMonth = monthNames[start.getMonth()];
  const endMonth = monthNames[end.getMonth()];

  // Check if start and end dates are the same
  if (startDate === endDate) {
    // Return specific date for deadline events
    return `${startMonth} ${start.getDate()}, ${start.getFullYear()}`;
  }

  // If different years
  if (start.getFullYear() !== end.getFullYear()) {
    return `${startMonth} - ${endMonth} (${end.getFullYear()})`;
  }

  // Same year
  return `${startMonth} - ${endMonth}`;
};

// Timeline event interface
interface TimelineEvent {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  action_type: string;
}

interface ProgramDetails {
  id: string;
  name: string;
  content: any;
}

function SchoolCelebration() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolName = searchParams?.get("name") || "the school";
  const schoolId = searchParams?.get("id");
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [programDetails, setProgramDetails] = useState<ProgramDetails | null>(
    null
  );
  const [programDeadlineEvent, setProgramDeadlineEvent] =
    useState<TimelineEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUserStore();
  const supabase = createClient();

  // Fetch program details including deadlines
  useEffect(() => {
    const fetchProgramDetails = async () => {
      if (!schoolId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("programs")
          .select("id, name, content")
          .eq("id", schoolId)
          .single();

        if (error) {
          console.error("Error fetching program details:", error);
          return;
        }

        if (data) {
          setProgramDetails(data);
          console.log("Program data:", data);

          // Try to get deadline date from content.deadlines
          let deadlineDate = null;

          if (data.content?.deadlines) {
            // In this version, deadlines is just a string
            deadlineDate = data.content.deadlines;
            console.log("Using deadlines from content:", deadlineDate);
          }

          // Validate date format (YYYY-MM-DD)
          if (deadlineDate && /^\d{4}-\d{2}-\d{2}$/.test(deadlineDate)) {
            console.log("Valid deadline date found:", deadlineDate);

            // Create deadline event with a unique ID
            setProgramDeadlineEvent({
              id: 999,
              title: `Program Application Deadline`,
              description: `Submit your application for ${programDetails?.name || "this program"} by this date`,
              start_date: deadlineDate,
              end_date: deadlineDate,
              action_type: "deadline",
            });
          } else {
            // Use fallback date only for development
            console.warn(
              "No valid deadline found, using fallback for development only"
            );

            const today = new Date();
            const fallbackDate = `${today.getFullYear() + 1}-12-15`; // Next year Dec 15

            setProgramDeadlineEvent({
              id: 999,
              title: `Program Deadline (estimated)`,
              description: `Estimated application deadline for ${programDetails?.name || "this program"} - please check official website`,
              start_date: fallbackDate,
              end_date: fallbackDate,
              action_type: "deadline",
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch program details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgramDetails();
  }, [schoolId, supabase]);

  // Set animation completion and timeline display timing
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setAnimationComplete(true);
    }, 1000);

    const timer2 = setTimeout(() => {
      setShowTimeline(true);
    }, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Get the full application timeline
  const getFullApplicationTimeline = () => {
    // Get common timeline events from themeConfig, excluding submit_application if we have a deadline
    let eventsToShow: TimelineEvent[] = Object.entries(
      themeConfig.commonTimelineEvents
    )
      .filter(([action_type, _]) => {
        // If we have a deadline, filter out the generic submit_application event
        if (programDeadlineEvent && action_type === "submit_application") {
          return false;
        }
        return true;
      })
      .map(([action_type, event]) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        action_type: action_type,
      }));

    // Add the program-specific deadline at the position of submit_application (id=3)
    if (programDeadlineEvent) {
      const positionedDeadline = {
        ...programDeadlineEvent,
        id: 3, // Make sure it goes where submit_application would be
      };
      eventsToShow.push(positionedDeadline);
    }

    // Sort events by id to ensure correct chronological order
    return eventsToShow.sort((a, b) => a.id - b.id);
  };

  // Save timeline events to user_program_event table
  const saveTimelineEvents = async () => {
    if (!user || !schoolId || !programDeadlineEvent) {
      console.error("Missing user, school ID, or deadline event");
      return false;
    }

    try {
      // First, delete any existing timeline events for this user and program
      const { error: deleteError } = await supabase
        .from("user_program_event")
        .delete()
        .match({
          user_id: user.id,
          program_id: schoolId,
        });

      if (deleteError) {
        console.error("Error deleting existing timeline events:", deleteError);
        toast.error("Failed to update application timeline");
        return false;
      }

      // Create event for the deadline
      const eventToInsert = {
        user_id: user.id,
        program_id: schoolId,
        action_type: programDeadlineEvent.action_type,
        start_date: programDeadlineEvent.start_date,
        end_date: programDeadlineEvent.end_date,
        title: programDeadlineEvent.title,
        description: programDeadlineEvent.description,
        content: {
          timeframe: getTimeframe(
            programDeadlineEvent.start_date,
            programDeadlineEvent.end_date
          ),
        },
      };

      // Insert the event
      const { error } = await supabase
        .from("user_program_event")
        .insert([eventToInsert]);

      if (error) {
        console.error("Error saving timeline events:", error);
        toast.error("Failed to save application timeline");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in saveTimelineEvents:", error);
      return false;
    }
  };

  // Navigate back to school page
  const handleContinue = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Save timeline events
      const success = await saveTimelineEvents();

      if (success) {
        toast.success("Application timeline created successfully!");

        // If we have a deadline date, redirect to calendar with date parameter
        if (programDeadlineEvent?.start_date) {
          router.push(`/cal?date=${programDeadlineEvent.start_date}`);
          return; // Early return to prevent the navigation below
        }
      }

      // Only navigate to school page if there's no deadline or save failed
      if (schoolId) {
        router.push(`/school/${schoolId}`);
      } else {
        router.push("/school");
      }
    } catch (error) {
      console.error("Error handling continue:", error);
      // Fallback navigation on error
      router.push("/school");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the full timeline (including non-saved events)
  const timelineEvents = getFullApplicationTimeline();

  // Verify the timeline to debug
  useEffect(() => {
    if (timelineEvents.length > 0) {
      console.log("Timeline events:", timelineEvents.map(e => `${e.id}: ${e.title} (${e.action_type})`));
    }
  }, [timelineEvents]);

  // Get theme for action type
  const getThemeForAction = (action_type: string) => {
    // Use special theme for program deadline
    if (action_type === 'deadline') {
      // Use the same icon as submit_application but with our custom colors
      return {
        color: "bg-red-100 text-red-600",
        icon: themeConfig.actionThemes.submit_application.icon, // Use Globe icon from submit_application
      };
    }

    // For other action types, use the actionThemes from themeConfig
    const actionTheme = themeConfig.actionThemes[action_type as keyof typeof themeConfig.actionThemes];

    if (actionTheme) {
      return {
        color: actionTheme.color,
        icon: actionTheme.icon,
      };
    }

    // Fallback theme
    return {
      color: "bg-bronze/20 text-bronze",
      icon: Calendar,
    };
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[100dvh] p-6 pt-10 overflow-y-auto bg-yellow">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-md w-full mb-6"
      >
        <div className="absolute -top-6 -left-6">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Sparkles size={32} className="text-gold" />
          </motion.div>
        </div>

        <div className="absolute -top-4 -right-4">
          <motion.div
            initial={{ scale: 0, rotate: 45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Sparkles size={24} className="text-gold" />
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-sand p-8 rounded-2xl shadow-sm border border-bronze/20 text-center"
        >
          <div className="mx-auto w-16 h-16 bg-gold/60 rounded-full flex items-center justify-center mb-4">
            <Star size={32} className="text-bronze" />
          </div>

          <h1 className="text-2xl font-bold mb-4 text-black">
            Add this program to your targets?
          </h1>

          <p className="text-bronze mb-6">
            Great choice! We'll help you prepare and track your application
            progress for {schoolName}.
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: animationComplete ? 1 : 0 }}
            className="flex flex-col gap-3"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              className={`bg-gold text-bronze py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              onClick={handleContinue}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-bronze border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Check size={20} />
              )}
              {isSubmitting ? "Processing..." : "Continue"}
            </motion.button>

            <button
              className={`text-bronze/70 py-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              onClick={() => router.push("/school")}
              disabled={isSubmitting}
            >
              Back to schools
            </button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Application Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: showTimeline ? 1 : 0, y: showTimeline ? 0 : 30 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-sand rounded-2xl shadow-sm border border-bronze/20 p-6 mb-12"
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-bronze" />
          <h2 className="text-xl font-bold text-black">Application Timeline</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-bronze border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline */}
            <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-bronze/20"></div>

            {/* Timeline items */}
            {timelineEvents.map((item, index) => {
              const theme = getThemeForAction(item.action_type);
              const IconComponent = theme.icon;
              const colorClass = theme.color;
              const timeframe = getTimeframe(item.start_date, item.end_date);
              const isDeadlineEvent = item.action_type === "deadline";

              return (
                <motion.div
                  key={`timeline-${item.action_type}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 + index * 0.15 }}
                  className="relative pl-10 pb-8 last:pb-0"
                >
                  {/* Circle dot */}
                  <div
                    className={`absolute left-0 top-0 w-8 h-8 rounded-full ${colorClass} flex items-center justify-center z-10`}
                  >
                    <IconComponent size={16} />
                  </div>

                  <div className="mb-1 flex justify-between items-center flex-wrap gap-1">
                    <h3 className={`font-bold text-sm md:text-base text-black ${isDeadlineEvent ? "flex items-center" : ""}`}>
                      {item.title}
                    </h3>
                    <span
                      className={`text-xs whitespace-nowrap px-2 py-0.5 rounded-full ${
                        isDeadlineEvent
                          ? "bg-red-100 text-red-600 font-medium"
                          : "bg-bronze/10 text-bronze"
                      }`}
                    >
                      {timeframe}
                    </span>
                  </div>
                  <p className="text-sm text-bronze">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function SchoolCelebrationPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading celebration...</div>}>
      <SchoolCelebration />
    </Suspense>
  );
}
