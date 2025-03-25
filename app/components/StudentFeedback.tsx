"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Check,
  X,
  Loader2,
  ThumbsUp,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type FeedbackItem, type FeedbackHighlight } from "./MentorFeedback";

interface StudentFeedbackProps {
  documentId: string;
  userId: string;
  selectedText: string;
  setSelectedText: (text: string) => void;
  activeCommentId: string | null;
  setActiveCommentId: (id: string | null) => void;
  onHighlightFeedback: (highlights: FeedbackHighlight[]) => void;
}

export default function StudentFeedback({
  documentId,
  userId,
  selectedText,
  setSelectedText,
  activeCommentId,
  setActiveCommentId,
  onHighlightFeedback,
}: StudentFeedbackProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Fetch feedback from database on component mount
  useEffect(() => {
    if (documentId && userId) {
      fetchFeedbackFromDatabase();
    }
  }, [documentId, userId]);

  // Generate highlights for all comments and current selection
  useEffect(() => {
    const highlights = generateHighlights();
    onHighlightFeedback(highlights);
  }, [feedbacks, activeCommentId, selectedText]);

  // Fetch feedback from database
  const fetchFeedbackFromDatabase = async () => {
    if (!documentId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("document_feedback")
        .select("*")
        .eq("document_id", documentId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching feedback:", error);
        toast.error("Failed to load feedback");
        return;
      }

      if (data && data.length > 0) {
        // Convert database feedback to FeedbackItem format
        const dbFeedbacks = data.map((item) => {
          const content = item.content;
          return {
            id: item.id,
            text: content.text,
            selectedText: content.selectedText,
            timestamp: new Date(item.created_at),
            type: content.type,
            mentorId: item.mentor_id,
            documentId: item.document_id,
            status: item.status,
          };
        });

        setFeedbacks(dbFeedbacks);
      } else {
        setFeedbacks([]);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to load feedback");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate highlights for all comments and current selection
  const generateHighlights = (): FeedbackHighlight[] => {
    const feedbackHighlights = feedbacks.map((feedback) => {
      const isActive = feedback.id === activeCommentId;
      const isSuggestion = feedback.type === "suggestion";

      if (isActive) {
        return {
          highlight: feedback.selectedText,
          className: "bg-blue-200/70",
        };
      } else if (isSuggestion) {
        return {
          highlight: feedback.selectedText,
          className: "bg-violet-100/60",
        };
      } else {
        return {
          highlight: feedback.selectedText,
          className: "bg-amber-100/50",
        };
      }
    });

    return feedbackHighlights;
  };

  // Handle clicking on a comment
  const handleFeedbackClick = (feedback: FeedbackItem) => {
    setSelectedText(feedback.selectedText);
    setActiveCommentId(feedback.id);
  };

  // Clear active comment when clicking elsewhere
  const clearActiveComment = () => {
    setActiveCommentId(null);
    setSelectedText("");
  };

  // Accept a suggestion
  const acceptSuggestion = async (feedback: FeedbackItem) => {
    if (feedback.type !== "suggestion") return;

    try {
      setIsLoading(true);

      // Update feedback status to "accepted" in database
      const { error } = await supabase
        .from("document_feedback")
        .update({ status: "accepted" })
        .eq("id", feedback.id);

      if (error) {
        console.error("Error accepting suggestion:", error);
        toast.error("Failed to accept suggestion");
        return;
      }

      // Update local state
      setFeedbacks(
        feedbacks.map((item) =>
          item.id === feedback.id ? { ...item, status: "accepted" } : item,
        ),
      );

      toast.success("Suggestion accepted");
      setActiveCommentId(null);
    } catch (error) {
      console.error("Error accepting suggestion:", error);
      toast.error("Failed to accept suggestion");
    } finally {
      setIsLoading(false);
    }
  };

  // Mark feedback as thanked
  const thankFeedback = async (feedback: FeedbackItem) => {
    try {
      setIsLoading(true);

      // Update feedback status to "thanked" in database
      const { error } = await supabase
        .from("document_feedback")
        .update({ status: "thanked" })
        .eq("id", feedback.id);

      if (error) {
        console.error("Error thanking feedback:", error);
        toast.error("Failed to thank for feedback");
        return;
      }

      // Update local state
      setFeedbacks(
        feedbacks.map((item) =>
          item.id === feedback.id ? { ...item, status: "thanked" } : item,
        ),
      );

      toast.success("Thanked mentor for feedback");
      setActiveCommentId(null);
    } catch (error) {
      console.error("Error thanking feedback:", error);
      toast.error("Failed to thank for feedback");
    } finally {
      setIsLoading(false);
    }
  };

  // Find active comment
  const activeFeedback = activeCommentId
    ? feedbacks.find((c) => c.id === activeCommentId)
    : null;

  return (
    <div className="w-full">
      {/* Feedback List */}
      <div className="w-full bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-primary mr-3" />
            <h2 className="font-medium">Mentor Feedback</h2>
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {feedbacks.length}
            </span>
          </div>
        </div>
        <div className="p-2 overflow-y-auto max-h-[400px] relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">
                  Loading feedback...
                </p>
              </div>
            </div>
          )}

          {feedbacks.length > 0 ? (
            <ul className="divide-y">
              {[...feedbacks]
                .sort((a, b) => {
                  // Sort by timestamp (newest first)
                  return b.timestamp.getTime() - a.timestamp.getTime();
                })
                .map((feedback) => (
                  <li
                    key={feedback.id}
                    className={`py-3 px-4 ${
                      feedback.id === activeCommentId
                        ? "bg-blue-50 border border-blue-200 rounded-md"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          {feedback.timestamp.toLocaleString()}
                        </span>
                        {feedback.type === "suggestion" && (
                          <span className="text-xs bg-violet-100 text-violet-800 px-1.5 py-0.5 rounded-sm font-medium">
                            Suggestion
                          </span>
                        )}
                        {feedback.status === "accepted" && (
                          <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-sm font-medium">
                            Accepted
                          </span>
                        )}
                        {feedback.status === "thanked" && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-sm font-medium">
                            Thanked
                          </span>
                        )}
                      </div>
                    </div>
                    {feedback.selectedText && (
                      <div
                        className={`mb-2 p-2 ${
                          feedback.id === activeCommentId
                            ? "bg-blue-100/70"
                            : feedback.type === "suggestion"
                              ? "bg-violet-50 border border-violet-100"
                              : "bg-muted/30"
                        } rounded text-xs italic cursor-pointer hover:bg-blue-50`}
                        onClick={() => handleFeedbackClick(feedback)}
                      >
                        "{feedback.selectedText}"
                      </div>
                    )}
                    <p
                      className={`text-sm ${
                        feedback.type === "suggestion" ? "text-violet-900" : ""
                      }`}
                    >
                      {feedback.type === "suggestion" ? (
                        <>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium ml-1.5">
                            {feedback.text}
                          </span>
                        </>
                      ) : (
                        feedback.text
                      )}
                    </p>

                    {/* Student actions - accept suggestion or thank for comment */}
                    {feedback.status !== "accepted" &&
                      feedback.status !== "thanked" && (
                        <div className="flex justify-end gap-2 mt-2">
                          {feedback.type === "suggestion" ? (
                            <button
                              onClick={() => acceptSuggestion(feedback)}
                              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 py-1 px-2 rounded-full bg-emerald-50 hover:bg-emerald-100"
                              disabled={isLoading}
                            >
                              <Check size={12} />
                              <span>Apply Suggestion</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => thankFeedback(feedback)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 py-1 px-2 rounded-full bg-blue-50 hover:bg-blue-100"
                              disabled={isLoading}
                            >
                              <ThumbsUp size={12} />
                              <span>Thanks for feedback!</span>
                            </button>
                          )}
                        </div>
                      )}
                  </li>
                ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No feedback yet</p>
              <p className="text-xs text-muted-foreground mt-2">
                Your mentor will provide feedback soon
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
