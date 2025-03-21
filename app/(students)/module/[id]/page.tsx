"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { motion } from "framer-motion";
import { themeConfig } from "../../../config/themeConfig";
import { UserXP, UserHearts } from "@/app/types/index";
import { useUserStore } from "@/store/userStore";

interface Session {
  id: string;
  module_id: string;
  session_name: string;
  content: {
    type: string;
    content: any;
  };
}

interface SessionProgress {
  session_id: string;
  progress: string;
  score: number;
}

interface Module {
  id: string;
  subject_id: string;
  module_name: string;
  description: string;
}

export default function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, isLoading: userLoading } = useUserStore();
  const [module, setModule] = useState<Module | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [progress, setProgress] = useState<Record<string, SessionProgress>>({});
  const [loading, setLoading] = useState(true);
  const [isModuleCompleted, setIsModuleCompleted] = useState(false);
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [userHearts, setUserHearts] = useState<UserHearts | null>(null);

  // Fetch all data in a single effect
  useEffect(() => {
    console.log("Module ID:", id);
    async function fetchData() {
      try {
        if (!profile) return;

        // Get module details, and sessions in parallel
        const [moduleResponse, sessionsResponse] = await Promise.all([
          supabase.from("modules").select("*").eq("id", id).single(),
          supabase.from("sessions").select("*").eq("module_id", id)
        ]);

        if (moduleResponse.error || !moduleResponse.data) {
          console.error("Error fetching module data:", moduleResponse.error);
          return;
        }

        const moduleData = moduleResponse.data;
        const sessionsData = sessionsResponse.data || [];

        setModule(moduleData);
        setSessions(sessionsData);

        // Fetch user XP and hearts data
        const [xpResponse, heartsResponse] = await Promise.all([
          supabase
            .from("user_xp")
            .select("*")
            .eq("user_id", profile.id)
            .single(),
          supabase
            .from("user_hearts")
            .select("*")
            .eq("user_id", profile.id)
            .single()
        ]);

        if (xpResponse.data) {
          setUserXP(xpResponse.data);
        }

        if (heartsResponse.data) {
          setUserHearts(heartsResponse.data);
        }

        if (sessionsData.length > 0) {
          // Fetch session progress and module progress in parallel
          const [sessionProgressResponse, moduleProgressResponse] = await Promise.all([
            supabase
              .from("session_progress")
              .select("*")
              .eq("user_id", profile.id)
              .in("session_id", sessionsData.map(s => s.id)),
            supabase
              .from("module_progress")
              .select("progress")
              .eq("user_id", profile.id)
              .eq("module_id", id)
              .single()
          ]);

          // Process session progress
          if (!sessionProgressResponse.error && sessionProgressResponse.data) {
            const progressMap: Record<string, SessionProgress> = {};
            sessionProgressResponse.data.forEach((p: SessionProgress) => {
              progressMap[p.session_id] = p;
            });
            setProgress(progressMap);

            // Check if all sessions are completed
            const allCompleted = sessionsData.every(session => progressMap[session.id] && progressMap[session.id].progress === "completed");

            // If we have module progress data, use it
            if (!moduleProgressResponse.error && moduleProgressResponse.data) {
              setIsModuleCompleted(moduleProgressResponse.data.progress === "completed");
            } else if (allCompleted) {
              // If all sessions completed but no module progress, update it
              setIsModuleCompleted(true);

              // Add module completion XP reward
              await Promise.all([
                // Update module progress
                supabase.from("module_progress").upsert({
                  user_id: profile.id,
                  module_id: id,
                  progress: "completed",
                  updated_at: new Date().toISOString(),
                }),

                // Award XP
                awardModuleCompletionXP(profile.id, xpResponse.data),
              ]);
            }
          }
        }
      } catch (error) {
        console.error("Error loading module data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading) {
      fetchData();
    }
  }, [id, supabase, userLoading, profile]);

  // Award XP for completing a module
  const awardModuleCompletionXP = async (userId: string, currentXP: UserXP | null) => {
    if (!currentXP) return;

    try {
      const XP_REWARD = 100;

      // Calculate new XP value
      const newTotalXP = currentXP.total_xp + XP_REWARD;

      // Update user XP in database
      const { error } = await supabase
        .from("user_xp")
        .update({
          total_xp: newTotalXP
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Error awarding XP:", error);
        return;
      }

      // Update local state
      setUserXP({
        ...currentXP,
        total_xp: newTotalXP
      });

      // Show success message
      alert(`Congratulations! You earned ¥${XP_REWARD} for completing the module!`);

    } catch (error) {
      console.error("Error awarding module completion XP:", error);
    }
  };

  const handleStartSession = async (sessionId: string) => {
    if (!profile) return;

    // If session is already completed, don't use hearts
    if (progress[sessionId]) {
      router.push(`/session/${sessionId}`);
      return;
    }

    // Check if user has hearts
    if (!userHearts || userHearts.current_hearts <= 0) {
      alert("You don't have enough hearts to start this session!");
      return;
    }

    try {
      // Deduct one heart
      const newHeartCount = userHearts.current_hearts - 1;

      const { error } = await supabase
        .from("user_hearts")
        .update({ current_hearts: newHeartCount })
        .eq("user_id", profile.id);

      if (error) {
        console.error("Error updating hearts:", error);
        return;
      }

      // Update local state
      setUserHearts({
        ...userHearts,
        current_hearts: newHeartCount
      });

      // Navigate to session
      router.push(`/session/${sessionId}`);
    } catch (error) {
      console.error("Error starting session:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <p>Loading...</p>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <p>Module not found</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[100dvh] flex flex-col bg-gray-50">
      {/* Header */}
      <header className="w-full p-4 flex items-center justify-between bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/homepage")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">{module.module_name}</h1>
        </div>
        <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-xl border">
          {themeConfig.hearts(userHearts?.current_hearts || 0)}
        </div>
      </header>

      {/* Main Content */}
      <div className="grow p-4 space-y-4">
        <p className="text-gray-600">{module.description}</p>

        {/* Sessions List */}
        <div className="grid gap-3">
          {sessions.map((session, index) => (
            <motion.button
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleStartSession(session.id)}
              className="w-full p-4 bg-white rounded-xl shadow-sm flex items-center gap-4 hover:bg-gray-50 transition-colors active:scale-[0.98] touch-action-manipulation text-left relative overflow-hidden"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="font-medium text-primary">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{session.session_name}</h3>
                <p className="text-sm text-gray-500">
                  {session.content.type === "MULTIPLE_CHOICE"
                    ? "Multiple Choice Questions"
                    : session.content.type === "FILL_IN_THE_BLANK"
                      ? "Fill in the Blanks"
                      : session.content.type === "MATCHING"
                        ? "Matching Exercise"
                        : "Dialogue Practice"}
                </p>
              </div>
              {progress[session.id] && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No sessions available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
