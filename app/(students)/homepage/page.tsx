"use client";

import { createClient } from "@/utils/supabase/client";
import { ChevronRight, Check } from "lucide-react";
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
          supabase
            .from("user_xp")
            .select("*")
            .eq("user_id", user.id)
            .single(),

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

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-[calc(100vh-180px)]">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4">
        {/* Learning Modules */}
        <h2 className="text-lg font-medium sticky top-0 bg-background py-4 z-10">
          Learning Modules
        </h2>
        <div className="space-y-3 pb-20">
          {allModules.map((module) => (
            <button
              key={module.id}
              onClick={() => router.push(`/module/${module.id}`)}
              className="w-full p-4 bg-white rounded-xl shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-[0.98] touch-action-manipulation"
            >
              <div className="flex-1">
                <p className="font-medium text-left">{module.module_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {module.subject_name}
                  </span>
                  <p className="text-xs text-gray-500 text-left">
                    {moduleProgress[module.id]?.progress === "completed" &&
                      "Completed"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {moduleProgress[module.id]?.progress === "completed" && (
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                )}
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          ))}

          {allModules.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No learning modules available
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
