"use client";

import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { Cog, Star, ChevronRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Module {
  id: string;
  subject_id: string;
  module_name: string;
  order_index: number;
  description: string;
}

interface Subject {
  id: string;
  subject_name: string;
}

interface ModuleProgress {
  module_id: string;
  progress: string;
  score: number;
}

interface ModuleWithSubject extends Module {
  subject_name: string;
}

export default function ProtectedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allModules, setAllModules] = useState<ModuleWithSubject[]>([]);
  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Check if user has a profile
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", user.id)
          .single();

        if (!userData || !userData.name) {
          router.push("/onboarding");
          return;
        }

        setProfile(userData);

        // Fetch subjects data
        if (userData.subjects && userData.subjects.length > 0) {
          const { data: subjectsData } = await supabase
            .from("subjects")
            .select("*")
            .in("id", userData.subjects);

          setSubjects(subjectsData || []);

          // Create a subject id to name mapping
          const subjectMap: Record<string, string> = {};
          if (subjectsData) {
            subjectsData.forEach((subject: Subject) => {
              subjectMap[subject.id] = subject.subject_name;
            });
          }

          // Fetch modules for each subject
          const modulesWithSubjectInfo: ModuleWithSubject[] = [];
          const allModuleIds: string[] = [];

          for (const subject of userData.subjects) {
            const { data: subjectModules } = await supabase
              .from("modules")
              .select("*")
              .eq("subject_id", subject)
              .order("order_index");

            if (subjectModules) {
              // Add subject name to each module
              const modulesWithSubject = subjectModules.map((module: Module) => ({
                ...module,
                subject_name: subjectMap[subject] || "Unknown Subject"
              }));

              modulesWithSubjectInfo.push(...modulesWithSubject);
              allModuleIds.push(...subjectModules.map(m => m.id));
            }
          }
          setAllModules(modulesWithSubjectInfo);

          // Fetch progress for all modules
          if (allModuleIds.length > 0) {
            const { data: progressData } = await supabase
              .from("module_progress")
              .select("*")
              .eq("user_id", userData.id)
              .in("module_id", allModuleIds);

            if (progressData) {
              const progressMap: Record<string, ModuleProgress> = {};
              progressData.forEach((p: ModuleProgress) => {
                progressMap[p.module_id] = p;
              });
              setModuleProgress(progressMap);
            }
          }
        }
      } catch (error) {
        console.error("Error checking user:", error);
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, [router, supabase]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <p>Loading...</p>
      </div>
    );
  }

  // Get avatar path based on profile's avatar_name
  const avatarPath = `/images/avatars/${profile.avatar_name}.png`;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <header className="w-full p-4 flex items-center justify-between border-b">
        {/* Avatar and Stars */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary">
            <Image
              src={avatarPath}
              alt={profile.name}
              fill
              className="object-cover"
            />
          </div>
          {/* Name */}
          <p className="text-lg font-bold">{profile.name}</p>
          {/* Daily Stars */}
          <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-xl">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-medium text-sm">5</span>
          </div>
        </div>

        {/* Settings (disabled) */}
        <button className="text-gray-400 cursor-not-allowed" disabled>
          <Cog size={22} />
        </button>
      </header>

      {/* Main Content */}
      <div className="grow p-4 space-y-6">
        {/* Learning Modules */}
        <h2 className="text-lg font-medium">Learning Modules</h2>
        <div className="space-y-3">
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
                    {moduleProgress[module.id]?.progress === "completed"
                      ? "Completed"
                      : moduleProgress[module.id]?.progress === "in_progress"
                        ? "In progress"
                        : "Not started"}
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
