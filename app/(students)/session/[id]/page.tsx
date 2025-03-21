"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import MultipleChoiceQuiz from "@/app/(students)/session/[id]/components/quizzes/MultipleChoiceQuiz";
import FillInTheBlankQuiz from "@/app/(students)/session/[id]/components/quizzes/FillInTheBlankQuiz";
import MatchingQuiz from "@/app/(students)/session/[id]/components/quizzes/MatchingQuiz";
import DialogueQuiz from "@/app/(students)/session/[id]/components/quizzes/DialogueQuiz";
import { useUserStore } from "@/store/userStore";

interface Session {
  id: string;
  module_id: string;
  session_name: string;
  content: {
    type: string;
    content: any;
  };
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { user, isLoading: userLoading } = useUserStore();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        if (!user) return;

        // Fetch session data
        const { data: sessionData } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", id)
          .single();

        if (sessionData) {
          setSession(sessionData);
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading) {
      fetchSession();
    }
  }, [id, supabase, userLoading, user]);

  const handleQuizComplete = async () => {
    if (!user?.id || !session) return;

    try {
      // Update session progress
      await supabase.from("session_progress").upsert({
        user_id: user.id,
        session_id: id,
        progress: "completed",
        score: 100, // In a real app, this would be the actual score
        updated_at: new Date().toISOString(),
      });

      // Award XP
      const { data: userXP } = await supabase
        .from("user_xp")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (userXP) {
        const newXP = userXP.current_xp + 50; // 50 XP per session
        const newLevel = Math.floor(newXP / 100) + 1;

        await supabase
          .from("user_xp")
          .update({
            current_xp: newXP,
            level: newLevel,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      }

      // Navigate back to module page
      router.push(`/module/${session.module_id}`);
    } catch (error) {
      console.error("Error completing session:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <p>Session not found</p>
      </div>
    );
  }

  // Render the appropriate quiz component based on session type
  const renderQuiz = () => {
    const commonProps = {
      onComplete: handleQuizComplete,
    };

    switch (session.content.type) {
      case "MULTIPLE_CHOICE":
        return (
          <MultipleChoiceQuiz data={session.content.content} {...commonProps} />
        );
      case "FILL_IN_THE_BLANK":
        return (
          <FillInTheBlankQuiz data={session.content.content} {...commonProps} />
        );
      case "MATCHING":
        return <MatchingQuiz data={session.content.content} {...commonProps} />;
      case "DIALOGUE":
        return <DialogueQuiz data={session.content.content} {...commonProps} />;
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Unsupported session type: {session.content.type}
            </p>
          </div>
        );
    }
  };

  return <div className="min-h-[100dvh] bg-gray-50">{renderQuiz()}</div>;
}
