"use client";

import { Mail } from "lucide-react";
import { motion } from "framer-motion";
import { themeConfig } from "@/app/config/themeConfig";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface LORMilestoneProps {
  event: {
    id: string;
    title: string;
    description: string;
    start_date: string;
    program_id: string;
    content?: {
      mentor_name?: string;
      school_name?: string;
      program_name?: string;
      document_id?: string;
      [key: string]: any;
    };
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

export default function LORMilestone({ event }: LORMilestoneProps) {
  // 尝试从描述中解析内容
  const content = event.content || {};

  return (
    <motion.div
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="p-3 rounded-lg hover:bg-gray-50 transition-colors border-l-4 border-emerald-500"
    >
      <div className="flex-1">
        <div>
          <h3 className="font-semibold">{event.title}</h3>

          {/* 显示项目信息 - 优先使用数据库查询 */}
          {event.program_id && (
            <ProgramInfo programId={event.program_id} />
          )}
          {/* 如果没有项目ID但内容中有项目名称和学校名称，则直接显示 */}
          {!event.program_id && content.program_name && content.school_name && (
            <span className="text-xs text-gray-500 block">
              {content.school_name} - {content.program_name}
            </span>
          )}

          <div className="mt-2 text-sm text-gray-600 space-y-1">
            {/* 推荐信特有信息 */}
            {content.mentor_name && (
              <p>Mentor: {content.mentor_name}</p>
            )}
            {content.school_name && (
              <p>School: {content.school_name}</p>
            )}
            {content.program_name && (
              <p>Program: {content.program_name}</p>
            )}

            {/* 如果没有解析到结构化内容，显示原始描述 */}
            {!content.mentor_name && !content.school_name && event.description && (
              <p>{event.description}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}