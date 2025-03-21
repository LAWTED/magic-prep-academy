"use client";

import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, BookOpen, School } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Program {
  id: string;
  school_id: string;
  subject_id: string;
  name: string;
  content: string | null;
  application_deadline: string | null;
}

interface School {
  id: string;
  name: string;
  location: string;
}

interface Subject {
  id: string;
  subject_name: string;
}

export default function ProgramDetailPage({
  params,
}: {
  params: { programId: string };
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<Program | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Fetch program details
        const { data: programData, error: programError } = await supabase
          .from("programs")
          .select("*")
          .eq("id", params.programId)
          .single();

        if (programError || !programData) {
          console.error("Error fetching program:", programError);
          router.push("/school");
          return;
        }

        setProgram(programData);

        // Fetch school details
        const { data: schoolData, error: schoolError } = await supabase
          .from("schools")
          .select("*")
          .eq("id", programData.school_id)
          .single();

        if (schoolError || !schoolData) {
          console.error("Error fetching school:", schoolError);
        } else {
          setSchool(schoolData);
        }

        // Fetch subject details
        const { data: subjectData, error: subjectError } = await supabase
          .from("subjects")
          .select("*")
          .eq("id", programData.subject_id)
          .single();

        if (subjectError || !subjectData) {
          console.error("Error fetching subject:", subjectError);
        } else {
          setSubject(subjectData);
        }
      } catch (error) {
        console.error("Error loading program data:", error);
        router.push("/school");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.programId, router, supabase]);

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-center h-[calc(100vh-180px)]">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-center h-[calc(100vh-180px)]">
          <p>Program not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <button
        onClick={() => router.push("/school")}
        className="flex items-center text-gray-600 mb-4 active:scale-95 transition-transform"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Schools
      </button>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">{program.name}</h1>

        {school && (
          <div className="flex items-center gap-1 text-gray-600 mb-4">
            <School className="w-4 h-4" />
            <span>{school.name}, {school.location}</span>
          </div>
        )}

        {subject && (
          <div className="mb-4">
            <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1 w-fit">
              <BookOpen className="w-3 h-3" />
              {subject.subject_name}
            </span>
          </div>
        )}

        {program.application_deadline && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Application Deadline</h3>
            <p>{new Date(program.application_deadline).toLocaleDateString()}</p>
          </div>
        )}

        {program.content && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">About the Program</h3>
            <div className="prose prose-sm max-w-none">
              {program.content}
            </div>
          </div>
        )}

        {!program.content && (
          <div className="text-gray-500 italic">
            No additional information available about this program.
          </div>
        )}
      </div>
    </div>
  );
}