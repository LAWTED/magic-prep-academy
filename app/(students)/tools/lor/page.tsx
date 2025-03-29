"use client";

import { ArrowLeft, CheckCircle, Clock, FileCheck, Send } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";
import { toast } from "sonner";

interface RequestItem {
  id: string;
  mentor_name: string;
  program_name: string;
  school_name: string;
  status: string;
  created_at: string;
  letter_content?: string;
  metadata?: any;
}

// Define the structure of the data from Supabase
interface RequestData {
  id: string;
  mentor_id: string;
  status: string;
  created_at: string;
  metadata: {
    program_name?: string;
    school_name?: string;
    letter_content?: string;
    [key: string]: any;
  };
  mentors: {
    name: string;
  };
}

export default function LoRPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingToSchool, setSendingToSchool] = useState<string | null>(null);
  const { user } = useUserStore();
  const supabase = createClient();

  useEffect(() => {
    async function fetchRequests() {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        // Get the student's LOR requests
        const { data, error } = await supabase
          .from("mentor_student_interactions")
          .select(
            `
            id,
            mentor_id,
            status,
            created_at,
            metadata,
            mentors(name)
          `
          )
          .eq("student_id", user.id)
          .eq("type", "lor_request")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching requests:", error);
          return;
        }

        if (data) {
          // Format the data for display
          const formattedRequests = (data as unknown as RequestData[]).map(
            (item) => ({
              id: item.id,
              mentor_name: item.mentors.name || "Unknown Mentor",
              program_name: item.metadata?.program_name || "Unknown Program",
              school_name: item.metadata?.school_name || "Unknown School",
              status: item.status,
              created_at: new Date(item.created_at).toLocaleDateString(),
              letter_content: item.metadata?.letter_content,
              metadata: item.metadata,
            })
          );

          setRequests(formattedRequests);
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRequests();
  }, [supabase, user]);

  // Send recommendation letter to school
  const sendToSchool = async (request: RequestItem) => {
    if (!user?.id || !request.letter_content) {
      console.error("Missing user ID or letter content", {
        userId: user?.id,
        hasContent: Boolean(request.letter_content),
        metadata: request.metadata,
      });
      toast.error("Cannot send letter: content is missing.");
      return;
    }

    // Set the current request as sending
    setSendingToSchool(request.id);

    try {
      // 1. Save the letter to documents and document_versions tables
      const documentName = `Letter of Recommendation - ${request.program_name} - ${request.school_name}`;
      const documentType = "recommendation_letter";

      // First, create the document entry
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          name: documentName,
          type: documentType,
          metadata: {
            format: "text",
            program_name: request.program_name,
            school_name: request.school_name,
            mentor_name: request.mentor_name,
            interaction_id: request.id,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (documentError) {
        console.error("Error creating document:", documentError);
        throw documentError;
      }

      // Then, create the document version with the actual content
      const { data: versionData, error: versionError } = await supabase
        .from("document_versions")
        .insert({
          document_id: documentData.id,
          version_number: 1, // First version
          metadata: {
            format: "text",
            content: request.letter_content,
            program_name: request.program_name,
            school_name: request.school_name,
            mentor_name: request.mentor_name,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (versionError) {
        console.error("Error creating document version:", versionError);
        throw versionError;
      }

      // 2. Get program_id using program_name
      const { data: programData, error: programError } = await supabase
        .from("programs")
        .select("id")
        .eq("name", request.program_name)
        .single();

      if (programError) {
        console.error("Error finding program:", programError);
        // Create a fallback approach - use a default program or create a new one
        console.log("Using fallback approach for program");
      }

      const programId = programData?.id;

      // 3. Update user_programs_progress table
      if (programId) {
        // Check if an entry already exists
        const { data: existingProgress, error: progressCheckError } =
          await supabase
            .from("user_programs_progress")
            .select("id, content")
            .eq("user_id", user.id)
            .eq("program_id", programId)
            .maybeSingle();

        if (!progressCheckError) {
          let progressContent = {};

          // If exists, use existing content structure
          if (existingProgress?.content) {
            progressContent = { ...existingProgress.content };
          } else {
            // Create default structure if no existing content
            progressContent = {
              cv: { status: "not_started" },
              sop: { status: "not_started" },
              wes: { status: "not_started" },
              toefl: { status: "not_started" },
              application_submitted: false,
            };
          }

          // Update the lor section with the new information - use document_version_id instead of document_id
          progressContent = {
            ...progressContent,
            lor: {
              status: "completed",
              document_id: documentData.id,
              document_version_id: versionData.id, // Add document_version_id here
              sent_date: new Date().toISOString(),
              mentor_name: request.mentor_name,
              school_name: request.school_name,
            },
          };

          if (existingProgress) {
            // Update existing progress
            await supabase
              .from("user_programs_progress")
              .update({
                content: progressContent,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingProgress.id);
          } else {
            // Create new progress entry
            await supabase.from("user_programs_progress").insert({
              user_id: user.id,
              program_id: programId,
              status: "in_progress",
              content: progressContent,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }

        // 4. Add entry to user_program_event table
        await supabase.from("user_program_event").insert({
          user_id: user.id,
          program_id: programId,
          action_type: "recommendation_letter_sent",
          start_date: new Date().toISOString().split("T")[0], // Just the date part
          end_date: new Date().toISOString().split("T")[0], // Same day as start_date
          title: `Recommendation Letter Sent to ${request.school_name}`,
          description: `Your LoR from ${request.mentor_name} has been sent to ${request.program_name} at ${request.school_name}.`,
          content: {
            document_id: documentData.id,
            document_version_id: versionData.id, // Also include document_version_id here
            program_name: request.program_name,
            school_name: request.school_name,
            mentor_name: request.mentor_name,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // 5. Update the mentor_student_interactions to mark the letter as sent
      await supabase
        .from("mentor_student_interactions")
        .update({
          status: "finished",
          metadata: {
            ...request.metadata,
            sent_date: new Date().toISOString(),
          },
        })
        .eq("id", request.id);

      // 6. Update the UI by updating the local state
      setRequests((prevRequests) =>
        prevRequests.map((r) =>
          r.id === request.id ? { ...r, status: "finished" } : r
        )
      );

      // Success message
      toast.success(
        "Your recommendation letter has been successfully sent to the school!"
      );
    } catch (error) {
      console.error("Error sending letter to school:", error);
      toast.error(
        "There was an error sending your letter to school. Please try again."
      );
    } finally {
      setSendingToSchool(null);
    }
  };

  // Get the status icon based on request status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <FileCheck size={16} className="text-green-600" />;
      case "finished":
        return <CheckCircle size={16} className="text-blue-600" />;
      case "pending":
        return <Clock size={16} className="text-yellow-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Link href="/tools">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
          >
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h1 className="ml-3 text-2xl font-bold">Letter of Recommendation</h1>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl bg-purple-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Request a Letter</h2>
          <p className="text-gray-700 mb-4">
            Get a recommendation letter from your mentors for your college
            applications.
          </p>

          <Link href="/tools/lor/findmentor">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="mt-4 w-full py-3 rounded-lg font-semibold bg-purple-600 text-white"
            >
              Find a Mentor
            </motion.button>
          </Link>

          <Link href="/chat?person=phd-mentor">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="mt-3 w-full py-3 rounded-lg font-semibold bg-indigo-600 text-white"
            >
              Ask a PhD Mentor
            </motion.button>
          </Link>
        </div>

        {/* Requests List */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Your Requests</h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{request.program_name}</h3>
                      <p className="text-sm text-gray-600">
                        {request.school_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Requested from {request.mentor_name} on{" "}
                        {request.created_at}
                      </p>
                    </div>
                    <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                      {getStatusIcon(request.status)}
                      <span className="text-xs ml-1 capitalize">
                        {request.status}
                      </span>
                    </div>
                  </div>

                  {/* Add Send to School button for completed letters */}
                  {request.status === "completed" && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => sendToSchool(request)}
                      disabled={sendingToSchool === request.id}
                      className="mt-3 w-full py-2 rounded-lg font-medium text-sm bg-blue-600 text-white flex items-center justify-center"
                    >
                      {sendingToSchool === request.id ? (
                        <span className="flex items-center">
                          <Clock size={14} className="animate-spin mr-1" />
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Send size={14} className="mr-1" />
                          Send to School
                        </span>
                      )}
                    </motion.button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>You haven't made any requests yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
