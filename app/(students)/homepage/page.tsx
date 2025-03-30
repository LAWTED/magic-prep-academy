"use client";

import { createClient } from "@/utils/supabase/client";
import { ChevronRight, Check, BookCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserXP,
  UserHearts,
  Module,
  Subject,
  ModuleProgress,
  ModuleWithSubject,
} from "@/app/types/index";
import { themeConfig } from "@/app/config/themeConfig";
import { useUserStore } from "@/store/userStore";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, isLoading: userLoading } = useUserStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allModules, setAllModules] = useState<ModuleWithSubject[]>([]);
  const [moduleProgress, setModuleProgress] = useState<
    Record<string, ModuleProgress>
  >({});
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [userHearts, setUserHearts] = useState<UserHearts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!user) return;

        // Fetch XP and Hearts data
        const [xpResponse, heartsResponse] = await Promise.all([
          supabase.from("user_xp").select("*").eq("user_id", user.id).single(),

          supabase
            .from("user_hearts")
            .select("*")
            .eq("user_id", user.id)
            .single(),
        ]);

        if (xpResponse.data) {
          setUserXP(xpResponse.data);
        }

        if (heartsResponse.data) {
          setUserHearts(heartsResponse.data);
        }

        // If no subjects, nothing else to fetch
        if (!user.subjects || user.subjects.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch subjects and all modules in parallel
        const [subjectsResponse, modulesResponse] = await Promise.all([
          // Get all subjects
          supabase.from("subjects").select("*").in("id", user.subjects),

          // Get all modules for all subjects at once
          supabase
            .from("modules")
            .select("*")
            .in("subject_id", user.subjects)
            .order("order_index"),
        ]);

        // Process subjects
        const subjectsData = subjectsResponse.data || [];
        setSubjects(subjectsData);

        // Create a subject id to name mapping
        const subjectMap: Record<string, string> = {};
        subjectsData.forEach((subject: Subject) => {
          subjectMap[subject.id] = subject.subject_name;
        });

        // Process modules
        const modulesData = modulesResponse.data || [];
        const modulesWithSubjectInfo = modulesData.map((module: Module) => ({
          ...module,
          subject_name: subjectMap[module.subject_id] || "Unknown Subject",
        }));

        setAllModules(modulesWithSubjectInfo);

        // If we have modules, fetch their progress
        if (modulesData.length > 0) {
          const moduleIds = modulesData.map((m) => m.id);

          const { data: progressData } = await supabase
            .from("module_progress")
            .select("*")
            .eq("user_id", user.id)
            .in("module_id", moduleIds);

          if (progressData) {
            const progressMap: Record<string, ModuleProgress> = {};
            progressData.forEach((p: ModuleProgress) => {
              progressMap[p.module_id] = p;
            });
            setModuleProgress(progressMap);
          }
        }
      } catch (error) {
        console.error("Error loading homepage data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading) {
      fetchData();
    }
  }, [user, supabase, userLoading]);

  if (
    loading ||
    userLoading ||
    (user?.subjects?.length > 0 && allModules.length === 0)
  ) {
    return (
      <div className="max-w-lg mx-auto p-4 bg-field">
        {/* Skeleton for title */}
        <div className="h-14 bg-gold/60 rounded-lg px-4 mb-4 animate-pulse"></div>

        {/* Skeleton for modules */}
        <div className="space-y-3 pb-10">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="w-full p-4 bg-sand/80 rounded-xl shadow-sm flex items-center justify-between animate-pulse"
            >
              <div className="flex-1">
                <div className="h-5 bg-bronze/20 rounded w-3/4 mb-2"></div>
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-bronze/20 rounded-full w-20"></div>
                  <div className="h-4 bg-bronze/20 rounded w-16"></div>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-bronze/20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 bg-field ">
      {/* Learning Modules */}
      <h2 className="text-lg font-bold  top-0 bg-gold py-4 z-10 text-bronze rounded-lg px-4 shadow-sm mb-4 flex items-center gap-2">
        <BookCheck className="w-5 h-5 text-bronze" />
        Learning Modules
      </h2>
      <div className="space-y-3 pb-10">
        {allModules.map((module) => (
          <button
            key={module.id}
            onClick={() => router.push(`/module/${module.id}`)}
            className="w-full p-4 bg-sand rounded-xl shadow-sm flex items-center justify-between active:scale-[0.98] touch-action-manipulation"
          >
            <div className="flex-1">
              <p className="font-semibold text-left text-black">
                {module.module_name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-gold/60 text-bronze px-2 py-1 rounded-full">
                  {module.subject_name}
                </span>
                <p className="text-xs text-grass text-left">
                  {moduleProgress[module.id]?.progress === "completed" &&
                    "Completed"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {moduleProgress[module.id]?.progress === "completed" && (
                <div className="w-6 h-6 rounded-full bg-grass/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-grass" />
                </div>
              )}
              <ChevronRight className="w-5 h-5 text-bronze" />
            </div>
          </button>
        ))}

        {allModules.length === 0 && (
          <div className="text-center text-bronze py-8 bg-sand rounded-xl p-6">
            No learning modules available
          </div>
        )}
      </div>
    </div>
  );
}
