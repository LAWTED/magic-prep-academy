"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Plus,
  Check,
  X,
  Command,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

// Types
export type FeedbackItem = {
  id: string;
  text: string;
  selectedText: string;
  timestamp: Date;
  type: "comment" | "suggestion";
  mentorId?: string;
  documentVersionId?: string; // Added for database integration
  status?: string; // Added for database integration
};

export type FeedbackHighlight = {
  highlight: string;
  className: string;
};

interface MentorFeedbackProps {
  feedbacks: FeedbackItem[];
  setFeedbacks: (feedbacks: FeedbackItem[]) => void;
  selectedText: string;
  setSelectedText: (text: string) => void;
  activeCommentId: string | null;
  setActiveCommentId: (id: string | null) => void;
  mentorId?: string;
  onApplySuggestion?: (originalText: string, newText: string) => void;
  commonSuggestions?: string[];
  documentVersionId?: string; // Added for database integration
  studentId?: string; // Added for database integration
}

export default function MentorFeedback({
  feedbacks,
  setFeedbacks,
  selectedText,
  setSelectedText,
  activeCommentId,
  setActiveCommentId,
  mentorId = "mentor-123", // Default mentor ID
  onApplySuggestion,
  commonSuggestions = [
    "Consider revising this sentence for clarity",
    "This paragraph could be more concise",
    "Add more specific examples here",
    "Strengthen this argument with evidence",
    "Check grammar and sentence structure",
  ],
  documentVersionId, // For database integration
  studentId, // For database integration
}: MentorFeedbackProps) {
  const [newComment, setNewComment] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [feedbackType, setFeedbackType] = useState<"comment" | "suggestion">("comment");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Fetch feedback from database on component mount
  useEffect(() => {
    if (documentVersionId && mentorId && mentorId !== "mentor-123" && mentorId !== "ai") {
      fetchFeedbackFromDatabase();
    }
  }, [documentVersionId, mentorId]);

  // Fetch feedback from database
  const fetchFeedbackFromDatabase = async () => {
    if (!documentVersionId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_feedback')
        .select('*')
        .eq('document_version_id', documentVersionId)
        .eq('mentor_id', mentorId);

      if (error) {
        console.error('Error fetching feedback:', error);
        toast.error('Failed to load feedback');
        return;
      }

      if (data && data.length > 0) {
        // Convert database feedback to FeedbackItem format
        const dbFeedbacks = data.map(item => {
          const content = item.content;
          return {
            id: item.id,
            text: content.text,
            selectedText: content.selectedText,
            timestamp: new Date(item.created_at),
            type: content.type,
            mentorId: item.mentor_id,
            documentVersionId: item.document_version_id,
            status: item.status
          };
        });

        // Keep AI feedback and add database feedback
        const aiFeedback = feedbacks.filter(f => f.mentorId === "ai");
        setFeedbacks([...dbFeedbacks, ...aiFeedback]);
      } else {
        // If no database feedback, keep only AI feedback
        const aiFeedback = feedbacks.filter(f => f.mentorId === "ai");
        setFeedbacks(aiFeedback);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  // Save feedback to database
  const saveFeedbackToDatabase = async (feedback: FeedbackItem) => {
    if (!documentVersionId || !mentorId || feedback.mentorId === "ai") return;

    try {
      const { data, error } = await supabase
        .from('document_feedback')
        .insert({
          document_version_id: documentVersionId,
          user_id: studentId,
          mentor_id: mentorId,
          content: {
            text: feedback.text,
            selectedText: feedback.selectedText,
            type: feedback.type
          },
          metadata: {},
          status: 'active'
        })
        .select();

      if (error) {
        console.error('Error saving feedback:', error);
        toast.error('Failed to save feedback');
        return false;
      }

      // Return the database ID if available
      return data && data.length > 0 ? data[0].id : true;
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save feedback');
      return false;
    }
  };

  // Delete feedback from database
  const deleteFeedbackFromDatabase = async (id: string) => {
    if (!documentVersionId || !mentorId) return false;

    try {
      const { error } = await supabase
        .from('document_feedback')
        .delete()
        .eq('id', id)
        .eq('mentor_id', mentorId);

      if (error) {
        console.error('Error deleting feedback:', error);
        toast.error('Failed to delete feedback');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback');
      return false;
    }
  };

  // Generate highlights for all comments and current selection
  const generateHighlights = (): FeedbackHighlight[] => {
    const feedbackHighlights = feedbacks.map(feedback => {
      const isActive = feedback.id === activeCommentId;
      const isSuggestion = feedback.type === "suggestion";
      const isAI = feedback.mentorId === "ai";

      if (isActive) {
        return {
          highlight: feedback.selectedText,
          className: 'bg-blue-200/70'
        };
      } else if (isSuggestion) {
        return {
          highlight: feedback.selectedText,
          className: isAI ? 'bg-emerald-100/60' : 'bg-violet-100/60'
        };
      } else {
        return {
          highlight: feedback.selectedText,
          className: isAI ? 'bg-emerald-100/50' : 'bg-amber-100/50'
        };
      }
    });

    const currentSelectionHighlight = selectedText && !activeCommentId ?
      [{ highlight: selectedText, className: 'bg-blue-100/50' }] :
      [];

    return [...feedbackHighlights, ...currentSelectionHighlight];
  };

  // Handle clicking on a comment
  const handleFeedbackClick = (feedback: FeedbackItem) => {
    setSelectedText(feedback.selectedText);
    setActiveCommentId(feedback.id);
  };

  // Clear active comment when selecting new text
  useEffect(() => {
    if (selectedText) {
      // Only clear active comment if this is a new selection, not when setting
      // selectedText programmatically via handleFeedbackClick
      const matchingFeedback = feedbacks.find(c => c.selectedText === selectedText && c.id === activeCommentId);
      if (!matchingFeedback) {
        setActiveCommentId(null);
      }
    }
  }, [selectedText, feedbacks, activeCommentId, setActiveCommentId]);

  // Add a new comment - now saves to database if not AI
  const addFeedback = async () => {
    if (!newComment.trim()) return;

    setIsLoading(true);

    const newFeedback: FeedbackItem = {
      id: Date.now().toString(), // Temporary ID that will be replaced after database save
      text: newComment,
      selectedText: selectedText,
      timestamp: new Date(),
      type: feedbackType,
      mentorId: mentorId,
      documentVersionId
    };

    // If we have database integration, save to database
    if (documentVersionId && mentorId !== "ai") {
      const savedId = await saveFeedbackToDatabase(newFeedback);
      if (!savedId) {
        setIsLoading(false);
        return; // Don't add to state if failed to save
      }

      // If we got a database ID back, use it to refresh the feedback list
      if (typeof savedId === 'string') {
        // Create a new feedback item with the database ID
        const dbFeedback: FeedbackItem = {
          ...newFeedback,
          id: savedId
        };
        setFeedbacks([...feedbacks, dbFeedback]);
      } else {
        // Otherwise just refresh from the database
        await fetchFeedbackFromDatabase();
      }
    } else {
      // Just add to local state if no database or if it's AI feedback
      setFeedbacks([...feedbacks, newFeedback]);
    }

    setNewComment("");
    setSelectedText("");
    setActiveCommentId(null);
    setIsLoading(false);
  };

  // Remove a comment - now also deletes from database if applicable
  const removeFeedback = async (id: string) => {
    // Check if this is an AI feedback item
    const feedbackItem = feedbacks.find(f => f.id === id);
    if (!feedbackItem) return;

    if (feedbackItem.mentorId === "ai") {
      // For AI feedback, just remove from UI state
      setFeedbacks(feedbacks.filter((feedback) => feedback.id !== id));
    } else {
      // For mentor feedback, try to delete from database if it's a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      if (isUUID && documentVersionId) {
        // It's a database item, delete from the database
        const success = await deleteFeedbackFromDatabase(id);
        if (!success) {
          // If deletion failed, keep the item in the UI
          return;
        }
      }

      // Always update local state
      setFeedbacks(feedbacks.filter((feedback) => feedback.id !== id));
    }

    if (activeCommentId === id) {
      setActiveCommentId(null);
      setSelectedText("");
    }
  };

  // Short labels for common suggestions tags
  const suggestionTags = [
    "Clarity",
    "Concise",
    "Examples",
    "Evidence",
    "Grammar"
  ];

  // Add a new suggestion
  const addSuggestion = (suggestion: string) => {
    setNewComment(suggestion);
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Check for CMD+Enter (Mac) or Ctrl+Enter (Windows)
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault(); // Prevent default behavior
      if (newComment.trim()) {
        addFeedback();
      }
    }
  };

  // Find active comment
  const activeFeedback = activeCommentId ? feedbacks.find(c => c.id === activeCommentId) : null;

  // Apply AI suggestion - Now converts to a mentor suggestion
  const applyAISuggestion = async (feedback: FeedbackItem) => {
    if (feedback.type !== "suggestion" || feedback.mentorId !== "ai") return;

    setIsLoading(true);

    // Get the suggested text
    const suggestedText = feedback.text;
    const originalText = feedback.selectedText;

    // Call the handler if provided
    if (onApplySuggestion) {
      onApplySuggestion(originalText, suggestedText);
    }

    // Create a mentor suggestion (now from the mentor, not AI)
    const mentorSuggestion: FeedbackItem = {
      id: Date.now().toString(), // Temporary ID
      text: suggestedText,
      selectedText: originalText,
      timestamp: new Date(),
      type: "suggestion",
      mentorId: mentorId, // Use mentor's ID instead of AI
      documentVersionId
    };

    // Save to database if we have integration
    if (documentVersionId && mentorId !== "ai") {
      const savedId = await saveFeedbackToDatabase(mentorSuggestion);
      if (!savedId) {
        setIsLoading(false);
        return; // Don't add to state if failed to save
      }

      // Filter out the AI suggestion
      const updatedFeedbacks = feedbacks.filter(c => c.id !== feedback.id);

      // If we got a database ID back, use it
      if (typeof savedId === 'string') {
        // Create a new feedback item with the database ID
        const dbFeedback: FeedbackItem = {
          ...mentorSuggestion,
          id: savedId
        };
        setFeedbacks([...updatedFeedbacks, dbFeedback]);
      } else {
        // Otherwise just refresh from the database
        await fetchFeedbackFromDatabase();
      }
    } else {
      // Remove the original AI suggestion
      const updatedFeedbacks = feedbacks.filter(c => c.id !== feedback.id);
      // Add the new mentor suggestion
      setFeedbacks([...updatedFeedbacks, mentorSuggestion]);
    }

    // Clear active comment
    setActiveCommentId(null);
    setIsLoading(false);
  };

  // Accept AI comment - Converts to a mentor comment
  const acceptAIComment = async (feedback: FeedbackItem) => {
    if (feedback.type !== "comment" || feedback.mentorId !== "ai") return;

    setIsLoading(true);

    // Create a mentor comment (now from the mentor, not AI)
    const mentorComment: FeedbackItem = {
      id: Date.now().toString(), // Temporary ID
      text: feedback.text,
      selectedText: feedback.selectedText,
      timestamp: new Date(),
      type: "comment",
      mentorId: mentorId, // Use mentor's ID instead of AI
      documentVersionId
    };

    // Save to database if we have integration
    if (documentVersionId && mentorId !== "ai") {
      const savedId = await saveFeedbackToDatabase(mentorComment);
      if (!savedId) {
        setIsLoading(false);
        return; // Don't add to state if failed to save
      }

      // Filter out the AI comment
      const updatedFeedbacks = feedbacks.filter(c => c.id !== feedback.id);

      // If we got a database ID back, use it
      if (typeof savedId === 'string') {
        // Create a new feedback item with the database ID
        const dbFeedback: FeedbackItem = {
          ...mentorComment,
          id: savedId
        };
        setFeedbacks([...updatedFeedbacks, dbFeedback]);
      } else {
        // Otherwise just refresh from the database
        await fetchFeedbackFromDatabase();
      }
    } else {
      // Remove the original AI comment
      const updatedFeedbacks = feedbacks.filter(c => c.id !== feedback.id);
      // Add the new mentor comment
      setFeedbacks([...updatedFeedbacks, mentorComment]);
    }

    // Clear active comment
    setActiveCommentId(null);
    setIsLoading(false);
  };

  // Reject any AI feedback (comment or suggestion) - deletes the feedback
  const rejectAIFeedback = (feedback: FeedbackItem) => {
    if (feedback.mentorId !== "ai") return;
    removeFeedback(feedback.id);
  };

  // Mark a comment as read - deletes the comment (now only for mentor comments)
  const markAsRead = async (feedback: FeedbackItem) => {
    if (feedback.type !== "comment") return;

    setIsLoading(true);
    await removeFeedback(feedback.id);
    setIsLoading(false);
  };

  // Apply mentor suggestion (user created suggestion)
  const applyMentorSuggestion = async (feedback: FeedbackItem) => {
    if (feedback.type !== "suggestion" || feedback.mentorId === "ai") return;

    setIsLoading(true);

    // Get the suggested text
    const suggestedText = feedback.text;
    const originalText = feedback.selectedText;

    // Call the handler if provided
    if (onApplySuggestion) {
      onApplySuggestion(originalText, suggestedText);
    }

    // Create a confirmation comment
    const confirmFeedback: FeedbackItem = {
      id: Date.now().toString(),
      text: `Applied suggestion: Changed "${feedback.selectedText}" to "${suggestedText}"`,
      selectedText: suggestedText,
      timestamp: new Date(),
      type: "comment",
      mentorId: mentorId,
      documentVersionId
    };

    // Remove the original suggestion
    await removeFeedback(feedback.id);

    // Save to database if we have integration
    if (documentVersionId && mentorId !== "ai") {
      const savedId = await saveFeedbackToDatabase(confirmFeedback);
      if (!savedId) {
        setIsLoading(false);
        return; // Don't add to state if failed to save
      }

      // If we got a database ID back, use it
      if (typeof savedId === 'string') {
        // Create a new feedback item with the database ID
        const dbFeedback: FeedbackItem = {
          ...confirmFeedback,
          id: savedId
        };
        setFeedbacks([...feedbacks.filter(c => c.id !== feedback.id), dbFeedback]);
      } else {
        // Otherwise just refresh from the database
        await fetchFeedbackFromDatabase();
      }
    } else {
      // Just update local state if no database
      setFeedbacks([...feedbacks.filter(c => c.id !== feedback.id), confirmFeedback]);
    }

    // Clear active comment
    setActiveCommentId(null);
    setIsLoading(false);
  };

  // Reject a mentor suggestion
  const rejectSuggestion = async (feedback: FeedbackItem) => {
    if (feedback.type !== "suggestion" || feedback.mentorId === "ai") return;

    setIsLoading(true);
    await removeFeedback(feedback.id);
    setIsLoading(false);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* Middle Column - Feedback Input and Suggestions */}
      <div className="w-full lg:w-[325px] lg:flex-shrink-0 flex flex-col gap-4 overflow-hidden">
        {/* Add Feedback Section */}
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden shrink-0 flex-1">
          <div className="p-4 border-b flex items-center">
            <MessageSquare className="text-primary mr-3" size={18} />
            <h2 className="font-medium">Add Feedback</h2>
            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
              <Command size={12} />
              <span>+</span>
              <span>Enter</span>
            </span>
          </div>
          <div className="p-4 flex flex-col h-[calc(100%-56px)]">
            {/* Feedback Type Selection */}
            <div className="flex mb-4 bg-muted/30 p-1 rounded-md border">
              <button
                onClick={() => setFeedbackType("comment")}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                  feedbackType === "comment"
                    ? "bg-white border border-border shadow-sm"
                    : "text-muted-foreground hover:bg-gray-100"
                }`}
              >
                Comment
              </button>
              <button
                onClick={() => setFeedbackType("suggestion")}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                  feedbackType === "suggestion"
                    ? "bg-white border border-border shadow-sm text-violet-600"
                    : "text-muted-foreground hover:bg-gray-100"
                }`}
              >
                Suggestion
              </button>
            </div>

            {/* Main content area with even split between selection and textarea */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              {/* Show a message when viewing an active comment - with scrollable area */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {activeCommentId && (
                  <div className="p-3 bg-blue-100/50 rounded-md border border-blue-200 text-sm relative h-full">
                    <p className="font-semibold text-xs mb-1 text-blue-800/70">
                      Viewing feedback highlight:
                    </p>
                    <div className="overflow-y-auto pr-6 h-[calc(100%-25px)]">
                      <p className="italic">"{activeFeedback?.selectedText}"</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveCommentId(null);
                        setSelectedText("");
                      }}
                      className="absolute top-2 right-2 text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors"
                      aria-label="Clear feedback selection"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {selectedText && !activeCommentId && (
                  <div className="p-3 bg-muted/50 rounded-md border text-sm relative h-full">
                    <p className="font-semibold text-xs mb-1 text-muted-foreground">
                      Selected Text:
                    </p>
                    <div className="overflow-y-auto pr-6 h-[calc(100%-25px)]">
                      <p className="italic">"{selectedText}"</p>
                    </div>
                    <button
                      onClick={() => setSelectedText("")}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
                      aria-label="Clear selection"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {!selectedText && !activeCommentId && (
                  <div className="p-3 bg-muted/30 rounded-md border border-dashed text-sm flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-center flex flex-col items-center gap-2">
                      <MessageSquare size={20} className="text-muted-foreground/70" />
                      <span>Select text from the document to add feedback</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Input text area with placeholder based on feedback type */}
              <div className="flex-1 min-h-0 flex flex-col">
                <textarea
                  ref={textAreaRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={feedbackType === "comment"
                    ? "Add your comment here..."
                    : "Add your suggested replacement text..."}
                  className={`w-full p-3 border rounded-md flex-1 resize-none focus:outline-none focus:ring-1 ${
                    feedbackType === "suggestion"
                      ? "focus:ring-violet-400 border-violet-200"
                      : "focus:ring-primary"
                  }`}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Common suggestions and Submit button */}
            <div className="mt-2 space-y-2 shrink-0">
              {/* Common Suggestions as tags */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {commonSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => addSuggestion(suggestion)}
                    className="py-0.5 px-2 text-xs rounded-full bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 flex items-center gap-1 transition-colors whitespace-nowrap"
                    disabled={isLoading}
                  >
                    <span>{suggestionTags[index] || `Tip ${index + 1}`}</span>
                    <Plus size={10} className="text-violet-500" />
                  </button>
                ))}
              </div>

              {/* Submit button */}
              <div className="flex justify-end">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={addFeedback}
                  disabled={!newComment.trim() || !selectedText || isLoading}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${
                    feedbackType === "suggestion"
                      ? "bg-violet-600 text-white"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  Add {feedbackType === "suggestion" ? "Suggestion" : "Comment"}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Feedback List */}
      <div className="w-full lg:w-[325px] lg:flex-shrink-0 flex flex-col bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center shrink-0">
          <MessageSquare className="text-primary mr-3" size={18} />
          <h2 className="font-medium">Feedback</h2>
          <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
            {feedbacks.length}
          </span>
        </div>
        <div className="p-2 overflow-y-auto flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          )}

          {feedbacks.length > 0 ? (
            <ul className="divide-y">
              {[...feedbacks].sort((a, b) => {
                // Sort AI comments first
                if (a.mentorId === "ai" && b.mentorId !== "ai") return -1;
                if (a.mentorId !== "ai" && b.mentorId === "ai") return 1;
                // Then sort by timestamp (newest first)
                return b.timestamp.getTime() - a.timestamp.getTime();
              }).map((feedback) => (
                <li
                  key={feedback.id}
                  className={`py-3 px-4 ${
                    feedback.id === activeCommentId
                      ? 'bg-blue-50 border border-blue-200 rounded-md'
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {feedback.timestamp.toLocaleString()}
                      </span>
                      {feedback.mentorId === "ai" && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm font-medium">
                          AI
                        </span>
                      )}
                      {feedback.type === "suggestion" && (
                        <span className="text-xs bg-violet-100 text-violet-800 px-1.5 py-0.5 rounded-sm font-medium">
                          Suggestion
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeFeedback(feedback.id)}
                      className="text-muted-foreground hover:text-red-500 p-1"
                      disabled={isLoading}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {feedback.selectedText && (
                    <div
                      className={`mb-2 p-2 ${
                        feedback.id === activeCommentId
                          ? 'bg-blue-100/70'
                          : feedback.type === "suggestion"
                            ? feedback.mentorId === "ai"
                              ? 'bg-emerald-50 border border-emerald-100'
                              : 'bg-violet-50 border border-violet-100'
                            : feedback.mentorId === "ai"
                              ? 'bg-emerald-50/30 border border-emerald-100'
                              : 'bg-muted/30'
                      } rounded text-xs italic cursor-pointer hover:bg-blue-50`}
                      onClick={() => handleFeedbackClick(feedback)}
                    >
                      "{feedback.selectedText}"
                    </div>
                  )}
                  <p className={`text-sm ${
                    feedback.type === "suggestion"
                      ? feedback.mentorId === "ai" ? 'text-emerald-900' : 'text-violet-900'
                      : feedback.mentorId === "ai" ? 'text-emerald-800' : ''
                  }`}>
                    {feedback.type === "suggestion" ? (
                      <>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium ml-1.5">{feedback.text}</span>
                      </>
                    ) : (
                      feedback.text
                    )}
                  </p>

                  {/* AI Feedback Actions - Both comment and suggestion types get Accept/Reject */}
                  {feedback.mentorId === "ai" && (
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => rejectAIFeedback(feedback)}
                        className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 py-1 px-2 rounded-full bg-red-50 hover:bg-red-100"
                        disabled={isLoading}
                      >
                        <X size={12} />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => feedback.type === "suggestion"
                          ? applyAISuggestion(feedback)
                          : acceptAIComment(feedback)}
                        className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 py-1 px-2 rounded-full bg-emerald-50 hover:bg-emerald-100"
                        disabled={isLoading}
                      >
                        <Check size={12} />
                        <span>Accept</span>
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No feedback yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}