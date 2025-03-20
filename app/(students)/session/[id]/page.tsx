"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import MultipleChoiceQuiz from "@/app/(students)/session/[id]/components/quizzes/MultipleChoiceQuiz";
import FillInTheBlankQuiz from "@/app/(students)/session/[id]/components/quizzes/FillInTheBlankQuiz";
import MatchingQuiz from "@/app/(students)/session/[id]/components/quizzes/MatchingQuiz";
import DialogueQuiz from "@/app/(students)/session/[id]/components/quizzes/DialogueQuiz";

interface Session {
  id: string;
  module_id: string;
  session_name: string;
  content: {
    type: string;
    content: any;
  };
}

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessionAndUser() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Get user's profile to get the actual user ID from the users table
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", user.id)
          .single();

        if (userData) {
          setUserId(userData.id);
        }

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
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSessionAndUser();
  }, [id, supabase, router]);

  const handleQuizComplete = async () => {
    if (!userId || !session) return;

    try {
      // Check if progress already exists
      const { data: existingProgress } = await supabase
        .from("session_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("session_id", session.id)
        .single();

      if (!existingProgress) {
        // Create new progress entry
        const { error } = await supabase
          .from("session_progress")
          .insert({
            user_id: userId,
            session_id: session.id,
            progress: 'completed',
            score: 0, // As requested, setting score to 0 for now
          });

        if (error) throw error;
      }

      // Navigate back to module page
      router.push(`/module/${session.module_id}`);
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session || !userId) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <p>Session not found or user not authenticated</p>
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
        return <MultipleChoiceQuiz data={session.content.content} {...commonProps} />;
      case "FILL_IN_THE_BLANK":
        return <FillInTheBlankQuiz data={session.content.content} {...commonProps} />;
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

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {renderQuiz()}
    </div>
  );
}