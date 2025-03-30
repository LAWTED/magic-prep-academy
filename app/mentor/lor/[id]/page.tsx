import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { format, isPast, formatDistanceToNow } from "date-fns";
import Image from "next/image";
import CompleteRequestForm from "./CompleteRequestForm";
import TextPreview from "@/app/components/TextPreview";

export default async function RecommendationRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Remove the await Promise.resolve(params) since params is already properly typed
  const { id } = await params;

  const supabase = await createClient();

  // Check if user is authenticated
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

  // Fetch the LoR request
  const { data: request, error } = await supabase
    .from("mentor_student_interactions")
    .select(`
      id,
      student_id,
      mentor_id,
      status,
      created_at,
      metadata,
      users:student_id(id, name, avatar_name)
    `)
    .eq("id", id)
    .eq("type", "lor_request")
    .single();

  if (error || !request) {
    redirect("/mentor/dashboard");
  }

  // Make sure the mentor is accessing their own requests
  if (request.mentor_id !== profile.id) {
    redirect("/mentor/dashboard");
  }

  // Get program deadline if available
  let deadline = null;
  const programName = request.metadata?.program_name;

  if (programName) {
    const { data: programData } = await supabase
      .from("programs")
      .select("content")
      .eq("name", programName)
      .single();

    if (programData?.content?.deadlines) {
      deadline = programData.content.deadlines;
    }
  }

  // Get status label and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          icon: <Clock className="h-5 w-5" />,
          color: "text-yellow-600 bg-yellow-50",
        };
      case "accepted":
        return {
          label: "Accepted",
          icon: <CheckCircle className="h-5 w-5" />,
          color: "text-blue-600 bg-blue-50",
        };
      case "completed":
        return {
          label: "Completed",
          icon: <CheckCircle className="h-5 w-5" />,
          color: "text-green-600 bg-green-50",
        };
      case "finished":
        return {
          label: "Submitted",
          icon: <CheckCircle className="h-5 w-5" />,
          color: "text-indigo-600 bg-indigo-50",
        };
      case "rejected":
        return {
          label: "Rejected",
          icon: <XCircle className="h-5 w-5" />,
          color: "text-red-600 bg-red-50",
        };
      default:
        return {
          label: status,
          icon: <Clock className="h-5 w-5" />,
          color: "text-gray-600 bg-gray-50",
        };
    }
  };

  const statusInfo = getStatusInfo(request.status);
  const requestDate = format(new Date(request.created_at), "PPP");

  // Check if deadline is approaching or passed
  const hasDeadline = !!deadline;
  let isUrgent = false;
  let isPastDeadline = false;

  if (hasDeadline) {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Consider urgent if deadline is within 14 days
    isUrgent = daysUntilDeadline <= 14;
    isPastDeadline = isPast(deadlineDate);
  }

  // Fix TypeScript errors by properly typing the users data
  interface StudentInfo {
    id: string;
    name: string;
    avatar_name: string;
  }

  // Cast the users property to the correct type
  const student = request.users as unknown as StudentInfo;
  const metadata = request.metadata || {};

  return (
    <div className="w-full min-h-screen bg-background">
      <header className="border-b p-4 bg-card">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/mentor/lor"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Recommendation Requests</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span>Letter of Recommendation</span>
          </h1>
          <div
            className={`px-3 py-1 rounded-full flex items-center gap-1 ${statusInfo.color}`}
          >
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Student Information */}
          <div className="space-y-6">
            {/* Student Info Card */}
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border">
                  <Image
                    src={`/images/avatars/${student?.avatar_name || "default"}.png`}
                    alt={student?.name || ""}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{student?.name}</h2>
                  <p className="text-gray-500">Student ID: {student?.id.substring(0, 8)}...</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Requested on {requestDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
              <h3 className="text-lg font-semibold">Request Details</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Program</h4>
                  <p className="text-lg">{metadata.program_name || "N/A"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">School</h4>
                  <p className="text-lg">{metadata.school_name || "N/A"}</p>
                </div>

                {hasDeadline && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Deadline</h4>
                    <div className={`mt-1 inline-flex items-center gap-1 px-3 py-1 rounded-md ${
                      isPastDeadline
                        ? "bg-red-50 text-red-700"
                        : isUrgent
                        ? "bg-amber-50 text-amber-700"
                        : "bg-blue-50 text-blue-700"
                    }`}>
                      <Clock size={16} />
                      <span>
                        {isPastDeadline
                          ? `Deadline passed (${format(new Date(deadline), 'MMM d, yyyy')})`
                          : `${format(new Date(deadline), 'MMMM d, yyyy')}`}
                      </span>
                      {isUrgent && !isPastDeadline && (
                        <AlertTriangle size={16} className="ml-1" />
                      )}
                    </div>
                    {request.status !== "completed" && isUrgent && (
                      <p className="text-sm text-amber-700 mt-1">
                        {isPastDeadline
                          ? "This request's deadline has already passed."
                          : "Urgent: This deadline is approaching soon."}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {metadata.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Student Notes
                  </h4>
                  <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                    {metadata.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Recommendation Letter Editor or Content */}
          <div className="md:col-span-2">
            {/* Status Information */}
            {request.status === "pending" && (
              <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold">Status</h3>
                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
                  <p>This request is pending your acceptance. Please accept or reject it from your dashboard.</p>
                </div>
              </div>
            )}

            {/* Letter Editor (if accepted) */}
            {request.status === "accepted" && (
              <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4 min-h-[600px]">
                <h3 className="text-lg font-semibold mb-4">Write Recommendation Letter</h3>
                <CompleteRequestForm requestId={id} status={request.status} />
              </div>
            )}

            {/* Letter Content (if completed) */}
            {request.status === "completed" && metadata.letter_content && (
              <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4 min-h-[600px]">
                <h3 className="text-lg font-semibold mb-4">Recommendation Letter</h3>
                <div className="mb-4">
                  <TextPreview content={metadata.letter_content} />
                </div>
              </div>
            )}

            {/* Letter Content (if finished/submitted to school) */}
            {request.status === "finished" && metadata.letter_content && (
              <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4 min-h-[600px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Submitted Recommendation Letter</h3>
                  <div className="text-xs bg-indigo-100 text-indigo-800 rounded-full py-1 px-3 flex items-center gap-1">
                    <CheckCircle size={14} />
                    <span>Submitted to School</span>
                  </div>
                </div>
                <TextPreview content={metadata.letter_content} />
                {metadata.finished_at && (
                  <p className="text-sm text-gray-500 mt-4">
                    Submitted on {format(new Date(metadata.finished_at), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
            )}

            {/* Rejection Reason (if rejected) */}
            {request.status === "rejected" && metadata.rejection_reason && (
              <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold">Rejection Reason</h3>
                <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {metadata.rejection_reason}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}