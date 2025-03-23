import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { formatDistanceToNow, format, isPast } from "date-fns";
import LorRequestsList from "./components/LorRequestsList";
import { ArrowLeft, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface LorRequest {
  id: string;
  student_name: string;
  student_avatar: string;
  program_name: string;
  school_name: string;
  status: string;
  created_at: string;
  request_date: string;
  deadline?: string;
}

export default async function LorPage() {
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

  // Fetch all programs to get their deadlines
  const { data: programsData } = await supabase
    .from("programs")
    .select("name, content");

  // Create a map of program names to deadlines
  const programDeadlines = new Map();
  if (programsData) {
    programsData.forEach(program => {
      if (program.content?.deadlines) {
        programDeadlines.set(program.name, program.content.deadlines);
      }
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
    .order("created_at", { ascending: false });

  let lorRequests: LorRequest[] = [];

  if (requestsData && !requestsError) {
    lorRequests = requestsData.map((item: any) => {
      const programName = item.metadata?.program_name || "Unknown Program";
      const deadline = programDeadlines.get(programName);

      return {
        id: item.id,
        student_name: item.users?.name || "Unknown Student",
        student_avatar: item.users?.avatar_name || "",
        program_name: programName,
        school_name: item.metadata?.school_name || "Unknown School",
        status: item.status,
        created_at: item.created_at,
        request_date: formatDistanceToNow(new Date(item.created_at), { addSuffix: true }),
        deadline: deadline,
      };
    });
  }

  // Group requests by status
  const pendingRequests = lorRequests.filter(r => r.status === 'pending');
  const acceptedRequests = lorRequests.filter(r => r.status === 'accepted');
  const completedRejectedRequests = lorRequests.filter(r =>
    r.status === 'completed' || r.status === 'rejected'
  );

  // Identify urgent requests (pending or accepted with close or past deadlines)
  const today = new Date();
  const urgentRequests = [...pendingRequests, ...acceptedRequests].filter(request => {
    if (!request.deadline) return false;

    const deadlineDate = new Date(request.deadline);
    const daysUntilDeadline = Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Consider urgent if deadline is within 14 days or past
    return daysUntilDeadline <= 14;
  });

  // Regular (non-urgent) requests
  const regularRequests = lorRequests.filter(request => {
    // Check if this request is not in the urgent list
    return !urgentRequests.some(urgentReq => urgentReq.id === request.id);
  });

  return (
    <div className="w-full min-h-screen bg-background">
      <header className="border-b p-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/mentor/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold">Recommendation Letter Requests</h1>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-card rounded-lg p-4 border shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Status Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-xl font-semibold">{lorRequests.filter(r => r.status === 'pending').length}</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Accepted</p>
                <p className="text-xl font-semibold">{lorRequests.filter(r => r.status === 'accepted').length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-xl font-semibold">{lorRequests.filter(r => r.status === 'completed').length}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-xl font-semibold">{lorRequests.filter(r => r.status === 'rejected').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Urgent Requests Section */}
        {urgentRequests.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle size={20} />
              <h2 className="font-semibold">Urgent Requests</h2>
            </div>
            <LorRequestsList requests={urgentRequests} showTitle={false} />
          </section>
        )}

        {/* Regular Requests Section */}
        <section className="space-y-3">
          <h2 className="font-semibold">All Recommendation Requests</h2>
          <LorRequestsList requests={regularRequests} showTitle={false} />
        </section>
      </main>
    </div>
  );
}