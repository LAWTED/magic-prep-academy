"use client";

import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
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

interface ModuleProgress {
  module_id: string;
  progress: string;
  score: number;
}

export default function ProtectedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [modules, setModules] = useState<{ [key: string]: Module[] }>({});
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

          // Fetch modules for each subject
          const modulesData: { [key: string]: Module[] } = {};
          const allModuleIds: string[] = [];

          for (const subject of userData.subjects) {
            const { data: subjectModules } = await supabase
              .from("modules")
              .select("*")
              .eq("subject_id", subject)
              .order("order_index");

            if (subjectModules) {
              modulesData[subject] = subjectModules;
              allModuleIds.push(...subjectModules.map(m => m.id));
            }
          }
          setModules(modulesData);

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
          {/* 名字 */}
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
        {/* 展示用户选择的学科 */}
        <div className="grid gap-4">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="p-4 bg-white rounded-xl shadow-sm"
            >
              <p className="font-medium text-lg mb-3">{subject.subject_name}</p>
              <div className="space-y-2">
                {modules[subject.id]?.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => router.push(`/module/${module.id}`)}
                    className="w-full p-3 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors active:scale-[0.98] touch-action-manipulation"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-left">{module.module_name}</p>
                      <p className="text-sm text-gray-500 text-left">{module.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {moduleProgress[module.id] && (
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
                {(!modules[subject.id] || modules[subject.id].length === 0) && (
                  <p className="text-gray-500 text-center py-2">No modules available</p>
                )}
              </div>
            </div>
          ))}
          {subjects.length === 0 && (
            <p className="text-gray-500">No subjects selected</p>
          )}
        </div>
      </div>
    </div>
  );
}
