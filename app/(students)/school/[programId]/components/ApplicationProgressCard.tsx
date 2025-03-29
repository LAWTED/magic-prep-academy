"use client";

import { useEffect, useState } from "react";
import { FileText, CheckCircle, Clock, AlertCircle, FileCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useUserStore } from "@/store/userStore";
import { createClient } from "@/utils/supabase/client";

interface ApplicationProgressCardProps {
  programId: string;
}

interface ProgressData {
  cv: { status: string };
  lor: {
    status: string;
    document_id?: string;
    sent_to_school?: boolean;
    sent_date?: string;
    mentor_name?: string;
    school_name?: string;
  };
  sop: { status: string };
  wes: { status: string };
  toefl: { status: string };
  application_submitted: boolean;
}

export default function ApplicationProgressCard({ programId }: ApplicationProgressCardProps) {
  const { user } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const supabase = createClient();

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <FileCheck size={16} className="text-green-600" />;
      case "finished":
        return <CheckCircle size={16} className="text-blue-600" />;
      case "in_progress":
        return <Clock size={16} className="text-yellow-600" />;
      case "not_started":
        return <AlertCircle size={16} className="text-gray-400" />;
      default:
        return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
      case "finished":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "not_started":
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
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

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
        <div className="h-32 flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
      <h3 className="font-bold text-lg mb-4">Application Progress</h3>

      <div className="space-y-3">
        {/* Letter of Recommendation */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-purple-600" />
              <h5 className="font-medium">Letter of Recommendation</h5>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
              getStatusClass(progressData?.lor?.status || "not_started")
            }`}>
              {getStatusIcon(progressData?.lor?.status || "not_started")}
              <span>{getStatusText(progressData?.lor?.status || "not_started")}</span>
            </div>
          </div>

          {progressData?.lor?.status === "finished" && progressData.lor.mentor_name && (
            <div className="border-t px-3 py-2 bg-blue-50">
              <p className="text-xs text-blue-700">
                Sent to school on {new Date(progressData.lor.sent_date || "").toLocaleDateString()} from {progressData.lor.mentor_name}
              </p>
            </div>
          )}
        </div>

        {/* CV/Resume */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              <h5 className="font-medium">CV/Resume</h5>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
              getStatusClass(progressData?.cv?.status || "not_started")
            }`}>
              {getStatusIcon(progressData?.cv?.status || "not_started")}
              <span>{getStatusText(progressData?.cv?.status || "not_started")}</span>
            </div>
          </div>
        </div>

        {/* Statement of Purpose */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-green-600" />
              <h5 className="font-medium">Statement of Purpose</h5>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
              getStatusClass(progressData?.sop?.status || "not_started")
            }`}>
              {getStatusIcon(progressData?.sop?.status || "not_started")}
              <span>{getStatusText(progressData?.sop?.status || "not_started")}</span>
            </div>
          </div>
        </div>

        {/* Application Status */}
        <div className="mt-6 border-t pt-4">
          <motion.div
            className={`flex items-center justify-between p-3 rounded-lg ${
              progressData?.application_submitted
                ? "bg-green-100"
                : "bg-gray-100"
            }`}
          >
            <h5 className="font-medium">Application Submitted</h5>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              progressData?.application_submitted
                ? "bg-green-600 text-white"
                : "bg-gray-300 text-gray-600"
            }`}>
              {progressData?.application_submitted ? "Yes" : "No"}
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}