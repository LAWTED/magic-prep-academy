"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  FileCheck,
  Upload,
  PlusCircle,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { useUserStore } from "@/store/userStore";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";

interface ApplicationProgressCardProps {
  programId: string;
}

interface ProgressData {
  cv: {
    status: string;
    document_id?: string;
    document_version_id?: string;
  };
  lor: {
    status: string;
    document_id?: string;
    document_version_id?: string;
    sent_date?: string;
    mentor_name?: string;
    school_name?: string;
  };
  sop: {
    status: string;
    document_id?: string;
    document_version_id?: string;
  };
  wes: { status: string };
  toefl: { status: string };
  application_submitted: boolean;
}

interface Document {
  id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
}

interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  created_at: string;
  name: string;
  metadata: {
    content: string;
    format: string;
  };
}

export default function ApplicationProgressCard({
  programId,
}: ApplicationProgressCardProps) {
  const { user } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const supabase = createClient();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState<
    "cv" | "sop" | null
  >(null);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>(
    []
  );
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [selectionStep, setSelectionStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachingProgress, setAttachingProgress] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from("user_programs_progress")
          .select("content")
          .eq("user_id", user.id)
          .eq("program_id", programId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching progress:", error);
          return;
        }

        if (data?.content) {
          setProgressData(data.content as ProgressData);
        }
      } catch (error) {
        console.error("Error loading progress data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [programId, user?.id, supabase]);

  const fetchUserDocuments = async (type: "cv" | "sop") => {
    if (!user?.id) return;

    setIsDocumentsLoading(true);
    setSelectedDocumentType(type);
    setSelectionStep(1);
    setSelectedDocument(null);
    setDocumentVersions([]);

    try {
      const documentType = type === "cv" ? "resume" : "sop";
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", documentType)
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error(`Error fetching ${type} documents:`, error);
      toast.error(`Failed to load your documents`);
    } finally {
      setIsDocumentsLoading(false);
    }
  };

  const fetchDocumentVersions = async (documentId: string) => {
    setSelectedDocument(documentId);
    setIsDocumentsLoading(true);

    try {
      const { data, error } = await supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", documentId)
        .order("version_number", { ascending: false });

      if (error) {
        throw error;
      }

      setDocumentVersions(data || []);
      setSelectionStep(2);
    } catch (error) {
      console.error("Error fetching document versions:", error);
      toast.error("Failed to load document versions");
    } finally {
      setIsDocumentsLoading(false);
    }
  };

  const goBackToDocuments = () => {
    setSelectionStep(1);
    setSelectedDocument(null);
  };

  const attachDocumentToProgram = async (versionId: string) => {
    if (!user?.id || !selectedDocumentType || !selectedDocument) return;

    setIsAttaching(true);
    setAttachingProgress("Preparing document...");

    try {
      // Get the existing progress data
      setAttachingProgress("Checking application status...");
      const { data, error } = await supabase
        .from("user_programs_progress")
        .select("id, content")
        .eq("user_id", user.id)
        .eq("program_id", programId)
        .maybeSingle();

      if (error) throw error;

      let progressContent = data?.content || {
        cv: { status: "not_started" },
        sop: { status: "not_started" },
        lor: { status: "not_started" },
        wes: { status: "not_started" },
        toefl: { status: "not_started" },
        application_submitted: false,
      };

      // Update the specific section
      progressContent = {
        ...progressContent,
        [selectedDocumentType]: {
          status: "completed",
          document_id: selectedDocument,
          document_version_id: versionId,
        },
      };

      setAttachingProgress("Updating application progress...");
      if (data?.id) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("user_programs_progress")
          .update({
            content: progressContent,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id);

        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from("user_programs_progress")
          .insert({
            user_id: user.id,
            program_id: programId,
            status: "in_progress",
            content: progressContent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      // Get document details
      setAttachingProgress("Getting document details...");
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .select("name, type")
        .eq("id", selectedDocument)
        .single();

      if (documentError) throw documentError;

      // Get document version details
      const { data: versionData, error: versionError } = await supabase
        .from("document_versions")
        .select("name, version_number")
        .eq("id", versionId)
        .single();

      if (versionError) throw versionError;

      // Get program details
      setAttachingProgress("Getting program details...");
      const { data: programData, error: programError } = await supabase
        .from("programs")
        .select("name, school_id")
        .eq("id", programId)
        .single();

      if (programError) throw programError;

      // Get school name
      let schoolName = "Unknown School";
      if (programData.school_id) {
        const { data: schoolData } = await supabase
          .from("schools")
          .select("name")
          .eq("id", programData.school_id)
          .single();

        if (schoolData) {
          schoolName = schoolData.name;
        }
      }

      // Create event in user_program_event table
      setAttachingProgress("Recording event...");
      const documentType = selectedDocumentType === "cv" ? "Resume" : "Statement of Purpose";
      const actionType = `${selectedDocumentType}_attached`;
      const today = new Date().toISOString().split("T")[0]; // Get just the date part

      const { error: eventError } = await supabase
        .from("user_program_event")
        .insert({
          user_id: user.id,
          program_id: programId,
          action_type: actionType,
          start_date: today,
          end_date: today,
          title: `${documentType} Sent to ${schoolName}`,
          description: `You sent your ${documentType} to ${programData.name} at ${schoolName}.`,
          content: {
            document_id: selectedDocument,
            document_version_id: versionId,
            document_name: documentData.name,
            document_type: documentData.type,
            version_name: versionData.name || `Version ${versionData.version_number}`,
            program_name: programData.name,
            school_name: schoolName,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (eventError) throw eventError;

      // Update local state
      setAttachingProgress("Finalizing...");
      setProgressData(progressContent as ProgressData);
      toast.success(`Successfully attached document to your application`);
    } catch (error) {
      console.error("Error attaching document:", error);
      toast.error("Failed to attach document to your application");
    } finally {
      setAttachingProgress(null);
      setIsAttaching(false);
    }
  };

  const toggleApplicationSubmitted = async () => {
    if (!user?.id) return;

    // Check if all required documents are completed
    const isLorCompleted =
      progressData?.lor?.status === "completed" ||
      progressData?.lor?.status === "finished";
    const isCvCompleted = progressData?.cv?.status === "completed";
    const isSopCompleted = progressData?.sop?.status === "completed";

    // If trying to mark as submitted but not all documents are complete
    if (
      !progressData?.application_submitted &&
      (!isLorCompleted || !isCvCompleted || !isSopCompleted)
    ) {
      const missing = [];
      if (!isLorCompleted) missing.push("Letter of Recommendation");
      if (!isCvCompleted) missing.push("CV/Resume");
      if (!isSopCompleted) missing.push("Statement of Purpose");

      toast.error(
        `Cannot submit application: ${missing.join(", ")} not completed`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the existing progress data
      const { data, error } = await supabase
        .from("user_programs_progress")
        .select("id, content")
        .eq("user_id", user.id)
        .eq("program_id", programId)
        .maybeSingle();

      if (error) throw error;

      let progressContent = data?.content || {
        cv: { status: "not_started" },
        sop: { status: "not_started" },
        lor: { status: "not_started" },
        wes: { status: "not_started" },
        toefl: { status: "not_started" },
        application_submitted: false,
      };

      // Toggle the application_submitted status
      progressContent = {
        ...progressContent,
        application_submitted: !progressContent.application_submitted,
      };

      if (data?.id) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("user_programs_progress")
          .update({
            content: progressContent,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id);

        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from("user_programs_progress")
          .insert({
            user_id: user.id,
            program_id: programId,
            status: "in_progress",
            content: progressContent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      // Update local state
      setProgressData(progressContent as ProgressData);

      // Show success message
      toast.success(
        progressContent.application_submitted
          ? "Application marked as submitted!"
          : "Application marked as not submitted"
      );
    } catch (error) {
      console.error("Error updating application status:", error);
      toast.error("Failed to update application status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmitApplication = () => {
    const isLorCompleted =
      progressData?.lor?.status === "completed" ||
      progressData?.lor?.status === "finished";
    const isCvCompleted = progressData?.cv?.status === "completed";
    const isSopCompleted = progressData?.sop?.status === "completed";
    return isLorCompleted && isCvCompleted && isSopCompleted;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <FileCheck size={16} className="text-success" />;
      case "finished":
        return <CheckCircle size={16} className="text-info" />;
      case "in_progress":
        return <Clock size={16} className="text-warning" />;
      case "not_started":
        return <AlertCircle size={16} className="text-waiting" />;
      default:
        return <AlertCircle size={16} className="text-waiting" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
      case "finished":
        return "bg-success/20 text-success border-success/30";
      case "in_progress":
        return "bg-warning/20 text-warning border-warning/30";
      case "not_started":
      default:
        return "bg-waiting/20 text-waiting border-waiting/30";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "finished":
        return "Sent to School";
      case "in_progress":
        return "In Progress";
      case "not_started":
        return "Not Started";
      default:
        return "Not Started";
    }
  };

  const renderDrawerContent = () => {
    const documentType =
      selectedDocumentType === "cv" ? "Resume" : "Statement of Purpose";

    return (
      <>
        <DrawerHeader className="flex items-center bg-sand">
          {selectionStep === 2 && !isAttaching && (
            <button
              onClick={goBackToDocuments}
              className="mr-2 p-1 rounded-full hover:bg-bronze/10"
            >
              <ArrowLeft size={18} className="text-bronze" />
            </button>
          )}
          <DrawerTitle className="text-black">
            {isAttaching
              ? "Attaching Document"
              : selectionStep === 1
                ? `Select ${documentType}`
                : `Select Version`}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-2 bg-sand">
          {isAttaching ? (
            <div className="flex flex-col items-center w-full py-2">
              <div className="h-2 w-full rounded-full bg-skyblue relative overflow-hidden">
                <div className="absolute inset-0 bg-skyblue/40 animate-pulse"></div>
              </div>
              <div className="mt-2 text-bronze/70 text-xs">
                {attachingProgress || "Processing..."}
              </div>
            </div>
          ) : (
            <div className="flex items-center w-full mb-6">
              <div className={`h-2 flex-1 rounded-full bg-skyblue`}></div>
              <div className="mx-2 text-bronze/70 text-xs">
                Step {selectionStep} of 2
              </div>
              <div
                className={`h-2 flex-1 rounded-full ${selectionStep === 2 ? `bg-skyblue` : "bg-bronze/20"}`}
              ></div>
            </div>
          )}
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto bg-sand">
          {isAttaching ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-skyblue mb-4" />
              <p className="text-bronze text-center">
                Attaching your {documentType.toLowerCase()} to the application...
              </p>
              <p className="text-xs text-bronze/70 mt-2 text-center">
                This may take a moment
              </p>
            </div>
          ) : isDocumentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-bronze" />
            </div>
          ) : selectionStep === 1 ? (
            documents.length === 0 ? (
              <div className="text-center py-8 text-bronze/70">
                <p>
                  You don't have any {documentType.toLowerCase()} documents yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <motion.div
                    key={doc.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 border border-bronze/20 rounded-lg cursor-pointer transition-colors hover:border-skyblue hover:bg-skyblue/10`}
                    onClick={() => fetchDocumentVersions(doc.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full bg-skyblue/20`}>
                          <FileText size={20} className={`text-skyblue`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-black">{doc.name}</h3>
                          <p className="text-xs text-bronze/70">
                            Last updated:{" "}
                            {new Date(doc.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-bronze/70" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            documentVersions.length > 0 && (
              <div className="space-y-3">
                {documentVersions.map((version) => (
                  <motion.button
                    key={version.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isAttaching}
                    onClick={() => attachDocumentToProgram(version.id)}
                    className={`w-full p-4 border border-bronze/20 rounded-lg flex items-center justify-between hover:bg-skyblue/10 hover:border-skyblue ${
                      isAttaching ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-medium text-black">
                        {version.name || `Version ${version.version_number}`}
                      </p>
                      <p className="text-xs text-bronze/70">
                        {new Date(version.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )
          )}
        </div>

        <DrawerFooter className="flex-row gap-3 justify-end bg-sand">
          {!isAttaching && (
            <DrawerClose asChild>
              <button className="px-4 py-2 text-sm font-medium text-bronze border border-bronze/20 rounded-lg hover:bg-bronze/10">
                Cancel
              </button>
            </DrawerClose>
          )}
        </DrawerFooter>
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-sand border border-bronze/20 rounded-xl p-4 md:p-5 shadow-sm">
        <div className="h-32 flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-bronze border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sand border border-bronze/20 rounded-xl p-4 md:p-5 shadow-sm">
      <h3 className="font-bold text-lg mb-4 text-black">
        Application Progress
      </h3>

      <div className="space-y-3">
        {/* Letter of Recommendation */}
        <div className="border border-bronze/20 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-skyblue" />
              <h5 className="font-medium text-black">
                Letter of Recommendation
              </h5>
            </div>
            <div
              className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusClass(
                progressData?.lor?.status || "not_started"
              )}`}
            >
              {getStatusIcon(progressData?.lor?.status || "not_started")}
              <span>
                {getStatusText(progressData?.lor?.status || "not_started")}
              </span>
            </div>
          </div>

          {progressData?.lor?.status === "finished" &&
            progressData.lor.mentor_name && (
              <div className="border-t border-bronze/20 px-3 py-2 bg-skyblue/10">
                <p className="text-xs text-skyblue">
                  Sent to school on{" "}
                  {new Date(
                    progressData.lor.sent_date || ""
                  ).toLocaleDateString()}{" "}
                  from {progressData.lor.mentor_name}
                </p>
              </div>
            )}

          {progressData?.lor?.status === "not_started" && (
            <div className="border-t border-bronze/20 px-3 py-2">
              <motion.a
                href="/tools/lor"
                whileTap={{ scale: 0.95 }}
                className="w-full py-2 text-sm font-medium bg-skyblue/10 text-skyblue rounded-md flex items-center justify-center gap-1"
              >
                <Upload size={14} />
                <span>Request Recommendation</span>
              </motion.a>
            </div>
          )}
        </div>

        {/* CV/Resume */}
        <div className="border border-bronze/20 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-skyblue" />
              <h5 className="font-medium text-black">CV/Resume</h5>
            </div>
            <div
              className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusClass(
                progressData?.cv?.status || "not_started"
              )}`}
            >
              {getStatusIcon(progressData?.cv?.status || "not_started")}
              <span>
                {getStatusText(progressData?.cv?.status || "not_started")}
              </span>
            </div>
          </div>

          {progressData?.cv?.status === "not_started" && (
            <div className="border-t border-bronze/20 px-3 py-2">
              <Drawer>
                <DrawerTrigger asChild>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fetchUserDocuments("cv")}
                    className="w-full py-2 text-sm font-medium bg-skyblue/10 text-skyblue rounded-md flex items-center justify-center gap-1"
                  >
                    <Upload size={14} />
                    <span>Upload Resume</span>
                  </motion.button>
                </DrawerTrigger>
                <DrawerContent className="bg-sand border-t border-bronze/20">
                  {renderDrawerContent()}
                </DrawerContent>
              </Drawer>
            </div>
          )}
        </div>

        {/* Statement of Purpose */}
        <div className="border border-bronze/20 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-skyblue" />
              <h5 className="font-medium text-black">Statement of Purpose</h5>
            </div>
            <div
              className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusClass(
                progressData?.sop?.status || "not_started"
              )}`}
            >
              {getStatusIcon(progressData?.sop?.status || "not_started")}
              <span>
                {getStatusText(progressData?.sop?.status || "not_started")}
              </span>
            </div>
          </div>

          {progressData?.sop?.status === "not_started" && (
            <div className="border-t border-bronze/20 px-3 py-2">
              <Drawer>
                <DrawerTrigger asChild>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fetchUserDocuments("sop")}
                    className="w-full py-2 text-sm font-medium bg-skyblue/10 text-skyblue rounded-md flex items-center justify-center gap-1"
                  >
                    <Upload size={14} />
                    <span>Upload Statement of Purpose</span>
                  </motion.button>
                </DrawerTrigger>
                <DrawerContent className="bg-sand border-t border-bronze/20">
                  {renderDrawerContent()}
                </DrawerContent>
              </Drawer>
            </div>
          )}
        </div>

        {/* Application Status */}
        <div className="border border-bronze/20 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-skyblue" />
              <h5 className="font-medium text-black">Application Submitted</h5>
            </div>
            <div
              className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                progressData?.application_submitted
                  ? "bg-success/20 text-success border-success/30"
                  : "bg-waiting/20 text-waiting border-waiting/30"
              }`}
            >
              <span>{progressData?.application_submitted ? "Yes" : "No"}</span>
            </div>
          </div>

          {!progressData?.application_submitted && (
            <div className="border-t border-bronze/20 px-3 py-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleApplicationSubmitted}
                disabled={isSubmitting || !canSubmitApplication()}
                className={`w-full py-2 text-sm font-medium rounded-md flex items-center justify-center gap-1
                  ${
                    canSubmitApplication()
                      ? "bg-waiting/20 text-waiting hover:bg-waiting/30"
                      : "bg-gray-500/20 text-gray-500 cursor-not-allowed"
                  }`}
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle size={14} />
                )}
                <span>Mark as Submitted</span>
              </motion.button>

              {!canSubmitApplication() && (
                <p className="mt-2 text-xs text-center text-bronze">
                  Complete all required documents to submit application
                </p>
              )}
            </div>
          )}

          {progressData?.application_submitted && (
            <div className="border-t border-bronze/20 px-3 py-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleApplicationSubmitted}
                disabled={isSubmitting}
                className="w-full py-2 text-sm font-medium bg-gray-500/20 text-gray-500  rounded-md flex items-center justify-center gap-1"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <AlertCircle size={14} />
                )}
                <span>Mark as Not Submitted</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
