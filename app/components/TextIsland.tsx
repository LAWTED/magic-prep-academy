"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Save, CheckCircle, Loader2, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useEditorStore } from "../(students)/tools/store/editorStore";
import { ReactNode, useState } from "react";
import { type FeedbackItem } from "./MentorFeedback";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface TextIslandProps {
  onSave: () => void;
  feedbackCount?: number;
  customContent?: ReactNode;
  feedbacks?: FeedbackItem[];
  onFeedbackClick?: (feedback: FeedbackItem) => void;
  onApplyFeedback?: (feedback: FeedbackItem) => void;
  onRejectFeedback?: (feedback: FeedbackItem) => void;
  onMarkAsRead?: (feedback: FeedbackItem) => void;
  onFeedbackRemoved?: (feedbackId: string) => void;
}

export default function TextIsland({
  onSave,
  feedbackCount = 0,
  customContent,
  feedbacks = [],
  onFeedbackClick,
  onApplyFeedback,
  onRejectFeedback,
  onMarkAsRead,
  onFeedbackRemoved,
}: TextIslandProps) {
  const {
    isSaving,
    isDirty,
    lastSaved,
    showDynamicIsland,
    setShowDynamicIsland,
    content,
    setContent,
  } = useEditorStore();

  const [currentIndex, setCurrentIndex] = useState(-1); // -1 represents save button, 0+ represents feedback
  const supabase = createClient();

  const handleHover = () => {
    // Clear any existing timeout when user hovers
    const timer = useEditorStore.getState().dynamicIslandTimeoutRef;
    if (timer) {
      clearTimeout(timer);
    }
    setShowDynamicIsland(true);
  };

  const handleMouseLeave = () => {
    // Set timeout to hide the island
    const timer = setTimeout(() => {
      setShowDynamicIsland(false);
    }, 2000);

    // Store the timer reference
    useEditorStore.getState().dynamicIslandTimeoutRef = timer;
  };

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev > -1 ? prev - 1 : feedbacks.length - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev < feedbacks.length - 1 ? prev + 1 : -1
    );
  };

  const handleDeleteFeedback = async (feedback: FeedbackItem) => {
    try {
      const { error } = await supabase
        .from("document_feedback")
        .delete()
        .eq("id", feedback.id);

      if (error) {
        throw error;
      }

      // Notify parent to remove the feedback from the list
      onFeedbackRemoved?.(feedback.id);

      // Move to the previous feedback or save button if this was the last one
      setCurrentIndex(prev =>
        prev > 0 ? prev - 1 : (feedbacks.length > 1 ? 0 : -1)
      );

      // Update local state through callbacks
      if (feedback.type === "suggestion") {
        onApplyFeedback?.(feedback);
      } else {
        onMarkAsRead?.(feedback);
      }

      toast.success("Feedback processed successfully");
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error("Failed to process feedback");
    }
  };

  const handleApplySuggestion = async (feedback: FeedbackItem) => {
    // Replace the selected text with the suggested text
    const newContent = content.replace(feedback.selectedText, feedback.text);
    setContent(newContent);

    // Delete the feedback from database
    await handleDeleteFeedback(feedback);
  };

  const handleRejectFeedback = async (feedback: FeedbackItem) => {
    await handleDeleteFeedback(feedback);
    onRejectFeedback?.(feedback);
  };

  const handleMarkAsRead = async (feedback: FeedbackItem) => {
    await handleDeleteFeedback(feedback);
    onMarkAsRead?.(feedback);
  };

  const renderContent = () => {
    // Show save button content
    if (currentIndex === -1) {
      return (
        <motion.div
          key="save"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex flex-col items-center gap-2 px-2 min-w-[300px]"
        >
          <div className="flex-1 flex items-center justify-center w-full">
            {isSaving ? (
              <div className="flex items-center">
                <Loader2 size={16} className="text-blue-400 animate-spin mr-2" />
                <span className="text-sm">Saving...</span>
              </div>
            ) : lastSaved && !isDirty ? (
              <div className="flex items-center">
                <CheckCircle size={16} className="text-green-400 mr-2" />
                <span className="text-sm">
                  Saved at {lastSaved.toLocaleTimeString()}
                </span>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSave}
                disabled={isSaving || !isDirty}
                className={`flex items-center justify-center w-full px-3 py-1.5 rounded-lg text-sm ${
                  !isDirty
                    ? "text-gray-400 cursor-not-allowed bg-gray-800/50"
                    : "text-white cursor-pointer bg-blue-500/20 hover:bg-blue-500/30"
                }`}
              >
                <Save
                  size={16}
                  className={`mr-1.5 ${!isDirty ? "text-gray-500" : "text-blue-400"}`}
                />
                <span>Save</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      );
    }

    // Show feedback content
    const feedback = feedbacks[currentIndex];
    return (
      <motion.div
        key={feedback.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col px-4 min-w-[300px]"
      >
        <div
          className="flex-1 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onFeedbackClick?.(feedback)}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            {feedback.type === "suggestion" ? (
              <span className="text-[10px] bg-violet-400/20 text-violet-300 px-1.5 rounded-sm font-medium">
                Suggestion
              </span>
            ) : (
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 rounded-sm font-medium">
                Comment
              </span>
            )}
            {feedback.status === "accepted" && (
              <span className="text-[10px] bg-green-400/20 text-green-300 px-1.5 rounded-sm font-medium">
                Accepted
              </span>
            )}
            {feedback.status === "thanked" && (
              <span className="text-[10px] bg-blue-400/20 text-blue-300 px-1.5 rounded-sm font-medium">
                Thanked
              </span>
            )}
          </div>
          <div className="text-[10px] mb-1 line-clamp-1 px-1.5 py-0.5 bg-gray-800/50 rounded text-gray-300 font-light">
            "{feedback.selectedText}"
          </div>
          <div className="text-xs line-clamp-2 px-0.5">
            {feedback.type === "suggestion" ? (
              <>
                <span className="text-gray-400">→</span>
                <span className="text-violet-300 ml-1 font-medium">
                  {feedback.text}
                </span>
              </>
            ) : (
              <span className="text-amber-300">{feedback.text}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full gap-2 mt-3">
          {feedback.type === "suggestion" ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplySuggestion(feedback);
                }}
                className="flex-1 text-xs bg-violet-400/20 text-violet-300 py-1.5 rounded-lg hover:bg-violet-400/30 transition-colors"
              >
                Apply
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRejectFeedback(feedback);
                }}
                className="flex-1 text-xs bg-red-400/20 text-red-300 py-1.5 rounded-lg hover:bg-red-400/30 transition-colors"
              >
                Reject
              </button>
            </>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsRead(feedback);
              }}
              className="w-full text-xs bg-emerald-400/20 text-emerald-300 py-1.5 rounded-lg hover:bg-emerald-400/30 transition-colors"
            >
              Mark as Read
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  const renderDotIndicators = () => {
    const totalDots = feedbacks.length + 1; // +1 for save button
    if (totalDots <= 1) return null;

    return (
      <div className="flex justify-center gap-1.5 mt-2">
        {/* Save button dot */}
        <button
          onClick={() => setCurrentIndex(-1)}
          className={`w-1.5 h-1.5 rounded-full transition-all ${
            currentIndex === -1
              ? isDirty
                ? "bg-blue-400 w-3"
                : "bg-green-400 w-3"
              : "bg-gray-600 hover:bg-gray-500"
          }`}
        />
        {/* Feedback dots */}
        {feedbacks.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              index === currentIndex
                ? "bg-blue-400 w-3"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {showDynamicIsland && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 inset-x-0 flex justify-center z-50 safe-bottom"
          onMouseEnter={handleHover}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            className="bg-gray-900 text-white rounded-[32px] shadow-lg py-2 px-4 inline-flex flex-col items-center"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.x < -50) {
                handleNext();
              } else if (offset.x > 50) {
                handlePrev();
              }
            }}
          >
            {customContent ? (
              customContent
            ) : (
              <>
                {renderContent()}
                {renderDotIndicators()}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
