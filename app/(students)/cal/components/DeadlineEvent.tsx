"use client";

import { Globe } from "lucide-react";
import { motion } from "framer-motion";
import { themeConfig } from "@/app/config/themeConfig";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface DeadlineEventProps {
  event: {
    id: string;
    title: string;
    description: string;
    start_date: string;
    program_id: string;
  };
}

// Skeleton loading component
function ProgramInfoSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-40 bg-gray-200 rounded"></div>
    </div>
  );
}

// 根据项目ID获取项目和学校信息
function ProgramInfo({ programId }: { programId: string }) {
  const [programName, setProgramName] = useState<string>("");
  const [schoolName, setSchoolName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProgramInfo() {
      try {
        // 获取项目信息
        const { data: programData, error: programError } = await supabase
          .from('programs')
          .select('name, content, school_id')
          .eq('id', programId)
          .single();

        if (programError || !programData) {
          console.error("Error fetching program:", programError);
          return;
        }

        // 设置项目名称
        const displayName = programData.name ||
                           (programData.content?.name ? programData.content.name : "Program");
        setProgramName(displayName);

        // 获取学校信息
        if (programData.school_id) {
          const { data: schoolData, error: schoolError } = await supabase
            .from('schools')
            .select('name')
            .eq('id', programData.school_id)
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
    <span className="text-xs text-gray-500 block">
      {schoolName && `${schoolName} - `}{programName}
    </span>
  );
}

export default function DeadlineEvent({ event }: DeadlineEventProps) {
  // 计算截止时间是否已过
  const isPastDeadline = new Date(event.start_date) < new Date();

  return (
    <motion.div
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`p-3 rounded-lg hover:bg-gray-50 transition-colors border-l-4 border-red-500 ${isPastDeadline ? 'opacity-60' : ''}`}
    >
      <div className="flex-1">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{event.title}</h3>
            {isPastDeadline && (
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                Past Due
              </span>
            )}
          </div>

          {event.program_id && (
            <ProgramInfo programId={event.program_id} />
          )}

          {event.description && (
            <p className="mt-2 text-sm text-gray-600">{event.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}