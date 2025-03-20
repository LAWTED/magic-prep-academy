import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Module, Subject } from "@/app/types";

export default async function StudentProgress({
  params,
}: {
  params: { id: string };
}) {
  const studentId = params.id;
  const supabase = await createClient();

  // Authenticate mentor
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/mentor/sign-in");
  }

  // Get mentor profile
  const { data: mentorProfile } = await supabase
    .from("mentors")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (!mentorProfile) {
    redirect("/mentor/onboarding");
  }

  // Get student details
  const { data: student } = await supabase
    .from("users")
    .select("*")
    .eq("id", studentId)
    .single();

  if (!student) {
    redirect("/mentor/dashboard");
  }

  // Get subjects that both mentor and student have in common
  const sharedSubjectIds = student.subjects.filter((subjectId: string) =>
    mentorProfile.subjects.includes(subjectId)
  );

  // Get subject details
  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .in("id", sharedSubjectIds);

  // Get all modules for these subjects
  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .in("subject_id", sharedSubjectIds)
    .order("subject_id, order_index");

  // Get student's progress for these modules
  const { data: moduleProgress } = await supabase
    .from("module_progress")
    .select("*")
    .eq("user_id", studentId)
    .in("module_id", modules?.map((m) => m.id) || []);

  // Organize data by subject for display
  const subjectsWithProgress =
    subjects?.map((subject: Subject) => {
      const subjectModules =
        modules?.filter((m) => m.subject_id === subject.id) || [];

      const modulesWithProgress = subjectModules.map((module: Module) => {
        const progress = moduleProgress?.find((p) => p.module_id === module.id);
        return {
          ...module,
          progress: progress?.progress || "not_started",
          score: progress?.score || 0,
        };
      });

      // Calculate subject completion percentage
      const completedModules = modulesWithProgress.filter(
        (m) => m.progress === "completed"
      ).length;
      const totalModules = modulesWithProgress.length;
      const completionPercentage =
        totalModules > 0
          ? Math.round((completedModules / totalModules) * 100)
          : 0;

      return {
        ...subject,
        modules: modulesWithProgress,
        completionPercentage,
      };
    }) || [];

  // Get avatar path
  const avatarPath = `/images/avatars/${student.avatar_name}.png`;

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Header */}
      <header className="w-full p-6 flex items-center gap-4 border-b bg-card">
        <Link href="/mentor/dashboard" className="text-primary">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
            <Image
              src={avatarPath}
              alt={student.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <p className="text-muted-foreground">Student Progress</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Learning Modules Progress */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Learning Modules
          </h2>

          {subjectsWithProgress.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No modules available for this student
            </p>
          ) : (
            <div className="space-y-8">
              {subjectsWithProgress.map((subject) => (
                <div key={subject.id} className="space-y-3">
                  {/* Module list */}
                  {subject.modules.map((module) => (
                    <div
                      key={module.id}
                      className="flex items-center gap-3 p-4 rounded-lg bg-card border shadow-sm"
                    >
                      {module.progress === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : module.progress === "in_progress" ? (
                        <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{module.module_name}</p>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {subject.subject_name}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">
                          {module.progress.replace("_", " ")}
                          {module.progress === "completed" &&
                            module.score > 0 &&
                            ` • Score: ${module.score}`}
                        </p>
                      </div>
                    </div>
                  ))}

                  {subject.modules.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No modules available
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
