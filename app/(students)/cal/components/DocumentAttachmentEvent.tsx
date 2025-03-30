"use client";

import { FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ProgramInfoSkeleton } from "./DeadlineEvent";

interface DocumentAttachmentEventProps {
  event: {
    id: string;
    title: string;
    description: string;
    start_date: string;
    program_id: string;
    action_type: string; // "cv_attached" or "sop_attached"
    content?: {
      document_id?: string;
      document_version_id?: string;
      document_name?: string;
      document_type?: string;
      version_name?: string;
      program_name?: string;
      school_name?: string;
      [key: string]: any;
    };
  };
}

// Program info component (reused from LORMilestone)
function ProgramInfo({ programId }: { programId: string }) {
  const [programName, setProgramName] = useState<string>("");
  const [schoolName, setSchoolName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProgramInfo() {
      try {
        // Get program info
        const { data: programData, error: programError } = await supabase
          .from("programs")
          .select("name, content, school_id")
          .eq("id", programId)
          .single();

        if (programError || !programData) {
          console.error("Error fetching program:", programError);
          return;
        }

        // Set program name
        const displayName =
          programData.name ||
          (programData.content?.name ? programData.content.name : "Program");
        setProgramName(displayName);

        // Get school info
        if (programData.school_id) {
          const { data: schoolData, error: schoolError } = await supabase
            .from("schools")
            .select("name")
            .eq("id", programData.school_id)
            .single();

          if (!schoolError && schoolData) {
            setSchoolName(schoolData.name);
          }
        }
      } catch (error) {
        console.error("Error in fetchProgramInfo:", error);
      } finally {
        setLoading(false);
      }
    }

    if (programId) {
      fetchProgramInfo();
    }
  }, [programId, supabase]);

  if (loading) {
    return <ProgramInfoSkeleton />;
  }

  return (
    <span className="text-xs text-bronze/70 block">
      {schoolName && `${schoolName} - `}
      {programName}
    </span>
  );
}

export default function DocumentAttachmentEvent({
  event,
}: DocumentAttachmentEventProps) {
  const content = event.content || {};
  const isCV = event.action_type === "cv_attached";

  return (
    <motion.div
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="p-3 rounded-lg hover:bg-sand/80 transition-colors border-l-4 border-skyblue bg-sand"
    >
      <div className="flex-1">
        <h3 className="font-semibold text-black">
          {event.title ||
            (isCV ? "Resume Attached" : "Statement of Purpose Attached")}
        </h3>

        <div className="text-sm text-bronze/80 space-y-1">
          {/* Document specific info */}
          {content.document_name && <p>Document: {content.document_name}</p>}
          {content.version_name && <p>Version: {content.version_name}</p>}

          {/* If no structured content, show original description */}
          {!content.document_name && event.description && (
            <p>{event.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
