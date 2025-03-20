import Image from "next/image";
import { Cog, BookOpen, ChevronRight, Users, Upload, BookMarked } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

interface Subject {
  id: string;
  subject_name: string;
}

interface Student {
  id: string;
  name: string;
  avatar_name: string;
  subjects: string[];
}

export default async function MentorDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/mentor/sign-in");
  }

  // Check if mentor has a profile
  const { data: profile } = await supabase
    .from("mentors")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (!profile || !profile.name) {
    redirect("/mentor/onboarding");
  }

  // Initialize subjects and students as empty arrays
  let subjects: Subject[] = [];
  let students: Student[] = [];

  // Fetch subjects and students only if mentor has subjects
  if (profile.subjects && profile.subjects.length > 0) {
    // Fetch subjects data
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("*")
      .in("id", profile.subjects);

    subjects = subjectsData || [];

    // Fetch students who are studying these subjects
    const { data: studentsData } = await supabase
      .from("users")
      .select("id, name, avatar_name, subjects")
      .contains("subjects", profile.subjects);

    students = studentsData || [];
  }

  // Get avatar path based on profile's avatar_name
  const avatarPath = `/images/avatars/${profile.avatar_name}.png`;

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Header */}
      <header className="w-full p-6 flex items-center justify-between border-b bg-card">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
            <Image
              src={avatarPath}
              alt={profile.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-muted-foreground">Mentor</p>
          </div>
        </div>

        <button className="text-gray-400 cursor-not-allowed" disabled>
          <Cog size={24} />
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Learning Materials Upload Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Learning Materials</h2>
          </div>
          <Link
            href="/mentor/materials/upload"
            className="block p-6 bg-card rounded-xl shadow-sm border hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload New Materials</h3>
                <p className="text-sm text-muted-foreground">
                  Upload textbooks, blogs, or academic articles to create interactive learning modules
                </p>
              </div>
              <BookMarked className="w-8 h-8 text-primary" />
            </div>
          </Link>
        </section>

        {/* Subjects Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Your Subjects</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="p-6 bg-card rounded-xl shadow-sm border hover:border-primary/50 transition-colors"
              >
                <h3 className="text-lg font-medium mb-2">{subject.subject_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {students.filter(s => s.subjects.includes(subject.id)).length} students enrolled
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Students Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Your Students</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {students.map((student) => (
              <Link
                key={student.id}
                href={`/mentor/student/${student.id}`}
                className="flex items-center gap-4 p-4 bg-card rounded-xl shadow-sm border hover:border-primary/50 transition-colors"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden border">
                  <Image
                    src={`/images/avatars/${student.avatar_name}.png`}
                    alt={student.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium">{student.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {student.subjects.length} subjects
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))}
          </div>
          {students.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No students enrolled in your subjects yet
            </p>
          )}
        </section>
      </main>
    </div>
  );
}