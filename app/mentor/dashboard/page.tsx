import Image from "next/image";
import {
  Cog,
  BookOpen,
  ChevronRight,
  Users,
  Upload,
  BookMarked,
  MessageCircle,
  FileText,
  BarChart,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import LorRequestsList from "../lor/components/LorRequestsList";

interface Subject {
  id: string;
  subject_name: string;
}

interface Student {
  id: string;
  name: string;
  avatar_name: string;
  subjects: string[];
  program?: string;
}

interface SubjectWithStudents extends Subject {
  students: Student[];
}

interface LorRequest {
  id: string;
  student_name: string;
  student_avatar: string;
  program_name: string;
  school_name: string;
  status: string;
  created_at: string;
  request_date: string;
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
  let subjectsWithStudents: SubjectWithStudents[] = [];

  // Fetch subjects and students only if mentor has subjects
  if (profile.subjects && profile.subjects.length > 0) {
    // Fetch subjects data
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("*")
      .in("id", profile.subjects);

    const subjects = subjectsData || [];

    // Fetch students who are studying these subjects
    const { data: studentsData } = await supabase
      .from("users")
      .select("id, name, avatar_name, subjects")
      .contains("subjects", profile.subjects);

    const students = studentsData || [];

    // Group students by subject
    subjectsWithStudents = subjects.map((subject) => {
      const subjectStudents = students.filter((student) =>
        student.subjects.includes(subject.id)
      );

      return {
        ...subject,
        students: subjectStudents,
      };
    });
  }

  // Fetch LoR requests for this mentor
  const { data: requestsData, error: requestsError } = await supabase
    .from("mentor_student_interactions")
    .select(`
      id,
      student_id,
      status,
      created_at,
      metadata,
      users:student_id(name, avatar_name)
    `)
    .eq("mentor_id", profile.id)
    .eq("type", "lor_request")
    .order("created_at", { ascending: false })
    .limit(3);

  let lorRequests: LorRequest[] = [];

  if (requestsData && !requestsError) {
    lorRequests = requestsData.map((item: any) => ({
      id: item.id,
      student_name: item.users?.name || "Unknown Student",
      student_avatar: item.users?.avatar_name || "",
      program_name: item.metadata?.program_name || "Unknown Program",
      school_name: item.metadata?.school_name || "Unknown School",
      status: item.status,
      created_at: item.created_at,
      request_date: formatDistanceToNow(new Date(item.created_at), { addSuffix: true }),
    }));
  }

  const pendingRequestsCount = lorRequests.filter(r => r.status === 'pending').length;

  // Get avatar path based on profile's avatar_name
  const avatarPath = `/images/avatars/${profile.avatar_name}.png`;

  return (
    <div className="bg-background min-h-screen">
      <main className="container py-6 max-w-6xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mentor Dashboard</h1>
          <div>
            <Link
              href="/mentor/settings"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <Cog size={20} />
              <span className="sr-only">Settings</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Activities Section */}
          <div className="md:col-span-2 space-y-6">
            <section className="bg-card rounded-lg border shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-lg">Activities</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/mentor/lor"
                  className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary p-2.5 rounded-md">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium">Recommendation Letters</h3>
                      <p className="text-sm text-muted-foreground">
                        {pendingRequestsCount > 0 ?
                          `${pendingRequestsCount} pending request${pendingRequestsCount !== 1 ? 's' : ''}` :
                          'Manage recommendation letters'
                        }
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>

                <Link
                  href="/mentor/chat"
                  className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-700 p-2.5 rounded-md">
                      <MessageCircle size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium">Chat with Students</h3>
                      <p className="text-sm text-muted-foreground">
                        Answer questions & provide guidance
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>

                <Link
                  href="/mentor/materials/upload"
                  className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 text-green-700 p-2.5 rounded-md">
                      <Upload size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium">Learning Materials</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload resources for students
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>

                {/* Analytics link removed */}
              </div>
            </section>

            {/* Subjects & Students Section */}
            <section className="bg-card rounded-lg border shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-lg">Your Students</h2>
              </div>
              <div>
                {subjectsWithStudents.map((subject) => (
                  <div key={subject.id} className="border-b last:border-0">
                    <div className="px-4 pt-4 pb-2">
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        <BookOpen size={16} className="text-muted-foreground" />
                        <span>{subject.subject_name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({subject.students.length} student
                          {subject.students.length !== 1 ? "s" : ""})
                        </span>
                      </h3>
                    </div>

                    <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {subject.students.map((student) => (
                        <Link
                          key={student.id}
                          href={`/mentor/student/${student.id}`}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                            {student.avatar_name ? (
                              <Image
                                src={`/images/avatars/${student.avatar_name}.png`}
                                alt=""
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                                {student.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">{student.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {student.program || "Student"}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Stats Section */}
          <div className="space-y-6">
            <section className="bg-card rounded-lg border shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-lg">Your Stats</h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-muted-foreground" />
                      <span className="text-sm">Total Students</span>
                    </div>
                    <span className="font-semibold">{subjectsWithStudents.flatMap((s) => s.students).length}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-muted-foreground" />
                      <span className="text-sm">Subjects</span>
                    </div>
                    <span className="font-semibold">{subjectsWithStudents.length}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-muted-foreground" />
                      <span className="text-sm">LoR Requests</span>
                    </div>
                    <span className="font-semibold">{lorRequests.length}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Links */}
            <section className="bg-card rounded-lg border shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-lg">Quick Links</h2>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <Link
                    href="/mentor/profile"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <ChevronRight size={14} />
                    <span>Edit Profile</span>
                  </Link>
                  <Link
                    href="/mentor/lor"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <ChevronRight size={14} />
                    <span>View All Recommendation Requests</span>
                  </Link>
                  <Link
                    href="/mentor/chat"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <ChevronRight size={14} />
                    <span>Chat History</span>
                  </Link>
                  <Link
                    href="/mentor/support"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <ChevronRight size={14} />
                    <span>Help & Support</span>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
