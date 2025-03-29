"use client";

import Image from "next/image";
import Link from "next/link";
import { FileText, Eye, Clock, CheckCircle } from "lucide-react";
import AcceptRejectLorButtons from "./AcceptRejectLorButtons";
import { format, isPast } from "date-fns";

interface LorRequest {
  id: string;
  student_name: string;
  student_avatar: string;
  program_name: string;
  school_name: string;
  status: string;
  request_date: string;
  deadline?: string;
}

interface LorRequestsListProps {
  requests: LorRequest[];
  showTitle?: boolean;
}

export default function LorRequestsList({ requests, showTitle = true }: LorRequestsListProps) {
  return (
    <section className="bg-card rounded-lg border shadow-sm">
      {showTitle && (
        <h2 className="font-semibold text-lg p-4 border-b">
          Recommendation Letter Requests
        </h2>
      )}

      <div className="divide-y">
        {requests.length > 0 ? (
          requests.map((request) => {
            // Check if there's a deadline and if it's passed
            const hasDeadline = !!request.deadline;
            const deadlineDate = hasDeadline ? new Date(request.deadline!) : null;
            const isPastDeadline = hasDeadline && deadlineDate ? isPast(deadlineDate) : false;
            const isUrgent = hasDeadline && deadlineDate ?
              (deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 14 :
              false;

            return (
              <div key={request.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-grow">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {request.student_avatar ? (
                      <Image
                        src={`/images/avatars/${request.student_avatar}.png`}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {request.student_name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium text-sm">{request.student_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {request.program_name} • {request.school_name}
                    </p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          request.status === "pending"
                            ? "bg-blue-100 text-blue-800"
                            : request.status === "accepted"
                            ? "bg-indigo-100 text-indigo-800"
                            : request.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : request.status === "finished"
                            ? "bg-violet-100 text-violet-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {request.status === "finished" ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={10} />
                            Submitted
                          </span>
                        ) : (
                          request.status.charAt(0).toUpperCase() + request.status.slice(1)
                        )}
                      </span>

                      {hasDeadline && deadlineDate && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isPastDeadline
                              ? "bg-red-100 text-red-800"
                              : isUrgent
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <Clock size={10} />
                          {isPastDeadline
                            ? "Deadline passed"
                            : `Deadline: ${format(deadlineDate, 'MMM d, yyyy')}`}
                        </span>
                      )}

                      <span className="text-xs text-muted-foreground">
                        Requested {request.request_date}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-auto">
                  {request.status === "pending" ? (
                    <AcceptRejectLorButtons requestId={request.id} />
                  ) : request.status === "accepted" ? (
                    <Link
                      href={`/mentor/lor/${request.id}`}
                      className="flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm transition-colors"
                    >
                      <FileText size={16} />
                      <span>Write Recommendation Letter</span>
                    </Link>
                  ) : request.status === "finished" ? (
                    <Link
                      href={`/mentor/lor/${request.id}`}
                      className="flex items-center gap-1 bg-violet-600 text-white hover:bg-violet-700 px-3 py-2 rounded-md text-sm transition-colors"
                    >
                      <CheckCircle size={16} />
                      <span>View Submitted Letter</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/mentor/lor/${request.id}`}
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 px-3 py-2 rounded-md text-sm transition-colors"
                    >
                      <Eye size={16} />
                      <span>View Details</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            No recommendation letter requests at this time.
          </div>
        )}
      </div>
    </section>
  );
}