"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, FileText, X } from "lucide-react";
import TextEditor from "@/app/components/TextEditor";
import MentorFeedback, {
  FeedbackItem,
  FeedbackHighlight,
} from "@/app/components/MentorFeedback";
import { toast } from "sonner";

export default function SOPFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const studentId = params?.id as string;
  const sopId = params?.sopId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sopContent, setSOPContent] = useState<string>("");
  const [documentName, setDocumentName] = useState<string>("");
  const [versionNumber, setVersionNumber] = useState<number | null>(null);
  const [versionName, setVersionName] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<string>("");
  const [student, setStudent] = useState<any | null>(null);
  const [mentorId, setMentorId] = useState<string>("mentor-123"); // Default mentor ID
  const [isGenerating, setIsGenerating] = useState(false);

  // Feedback state - using frontend state only
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  // Common suggestions
  const commonSuggestions = [
    "Consider revising this sentence for clarity",
    "This paragraph could be more concise",
    "Add more specific examples here",
    "Strengthen this argument with evidence",
    "Check grammar and sentence structure",
  ];

  useEffect(() => {
    if (studentId && sopId) {
      fetchData();
      fetchCurrentUser();
    }
  }, [studentId, sopId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch student info
      const { data: studentData, error: studentError } = await supabase
        .from("users")
        .select("*")
        .eq("id", studentId)
        .single();

      if (studentError || !studentData) {
        setError("Student not found");
        setLoading(false);
        return;
      }

      setStudent(studentData);

      // Fetch document name
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .select("name")
        .eq("id", sopId)
        .eq("user_id", studentId)
        .single();

      if (documentError) {
        setError("Document not found");
        setLoading(false);
        return;
      }

      setDocumentName(documentData.name);

      // Fetch latest version
      const { data: latestVersionData, error: latestVersionError } = await supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", sopId)
        .order("version_number", { ascending: false })
        .limit(1)
        .single();

      if (latestVersionError) {
        setError("No versions found");
        setLoading(false);
        return;
      }

      setVersionId(latestVersionData.id);
      setVersionNumber(latestVersionData.version_number);
      setVersionName(latestVersionData.name);

      // Set SOP content
      const content = latestVersionData.metadata?.content || "";
      setSOPContent(content);

      // Comments are now in local state, no need to fetch from database
    } catch (error) {
      console.error("Error fetching SOP version:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load SOP version"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user (mentor)
  const fetchCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Get the mentor record that corresponds to this auth user
        const { data: mentorData, error: mentorError } = await supabase
          .from("mentors")
          .select("id")
          .eq("auth_id", user.id)
          .single();

        if (mentorError || !mentorData) {
          console.error("Error fetching mentor record:", mentorError);
          return;
        }

        // Use the mentor ID from the mentors table
        setMentorId(mentorData.id);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const handleBack = async () => {
    if (feedbacks.length > 0) {
      try {
        // Count comments and suggestions
        const commentsCount = feedbacks.filter(f => f.type !== "suggestion").length;
        const suggestionsCount = feedbacks.filter(f => f.type === "suggestion").length;

        // Create message content with JSON structure
        const messageContent = {
          type: "sop_feedback",
          sopContent: {
            sopId: sopId,
            documentName: documentName,
            feedbackCount: feedbacks.length,
            mentorName: "Your Mentor",
            commentsCount,
            suggestionsCount
          }
        };

        // Create the message with both friendly text and structured data
        const newMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: `I've reviewed your ${documentName} and added ${commentsCount} comment${commentsCount > 1 ? 's' : ''} and ${suggestionsCount} suggestion${suggestionsCount > 1 ? 's' : ''}. Please check them out!\n\n${JSON.stringify(messageContent)}`,
          createdAt: new Date().toISOString(),
          sender_id: mentorId,
          sender_name: "Your Mentor",
        };

        // Check if a chat interaction already exists with this student
        const { data: existingChat, error: chatQueryError } = await supabase
          .from('mentor_student_interactions')
          .select('*')
          .eq('student_id', studentId)
          .eq('mentor_id', mentorId)
          .eq('type', 'chat')
          .maybeSingle();

        if (existingChat) {
          // Add message to existing chat
          const existingMessages = existingChat.metadata?.messages || [];
          const updatedMessages = [...existingMessages, newMessage];

          await supabase
            .from('mentor_student_interactions')
            .update({
              metadata: {
                ...existingChat.metadata,
                messages: updatedMessages
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', existingChat.id);
        } else {
          // Create a new chat interaction with the message
          await supabase
            .from('mentor_student_interactions')
            .insert({
              student_id: studentId,
              mentor_id: mentorId,
              type: 'chat',
              status: 'active',
              metadata: {
                messages: [newMessage]
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      } catch (error) {
        console.error('Error sending feedback notification:', error);
        toast.error('Failed to send feedback notification');
      }
    }
    router.back();
  };

  // Generate highlights for content from feedback component
  const generateHighlights = () => {
    // Find active feedback
    const activeFeedback = activeCommentId
      ? feedbacks.find((c) => c.id === activeCommentId)
      : null;

    const feedbackHighlights = feedbacks.map((feedback) => {
      const isActive = feedback.id === activeCommentId;
      const isSuggestion = feedback.type === "suggestion";
      const isAI = feedback.mentorId === "ai";

      if (isActive) {
        return {
          highlight: feedback.selectedText,
          className: "bg-blue-200/70",
        };
      } else if (isSuggestion) {
        return {
          highlight: feedback.selectedText,
          className: isAI ? "bg-emerald-100/60" : "bg-violet-100/60",
        };
      } else {
        return {
          highlight: feedback.selectedText,
          className: isAI ? "bg-emerald-100/50" : "bg-amber-100/50",
        };
      }
    });

    const currentSelectionHighlight =
      selectedText && !activeCommentId
        ? [{ highlight: selectedText, className: "bg-blue-100/50" }]
        : [];

    return [...feedbackHighlights, ...currentSelectionHighlight];
  };

  // Handle applying a suggestion to the text content
  const handleApplySuggestion = (originalText: string, newText: string) => {
    const updatedContent = sopContent.replace(originalText, newText);
    setSOPContent(updatedContent);
  };

  // Generate AI feedback based on current document content
  const handleGenerateAIFeedback = () => {
    if (!sopContent) {
      toast.error("Document content is required for AI feedback");
      return;
    }

    setIsGenerating(true);

    // Call the feedback API to generate AI feedback
    fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: sopContent,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.feedback) {
          // Convert timestamp strings to Date objects if needed
          const aiFeedback = data.feedback.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }));

          // Filter out any existing AI feedback
          const existingFeedback = feedbacks.filter((f) => f.mentorId !== "ai");

          // Add the new AI feedback
          setFeedbacks([...existingFeedback, ...aiFeedback]);
          toast.success("AI feedback generated successfully");
        } else {
          throw new Error(data.error || "Failed to generate AI feedback");
        }
      })
      .catch((error) => {
        console.error("Error generating AI feedback:", error);
        toast.error(
          `Failed to generate AI feedback: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      })
      .finally(() => {
        setIsGenerating(false);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading SOP...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl text-red-700 font-medium mb-2">
            Error Loading SOP
          </h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex w-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="w-full p-6 flex items-center gap-4 border-b bg-card shrink-0">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="text-primary"
        >
          <ArrowLeft size={24} />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{documentName}</h1>
          <p className="text-sm text-muted-foreground">
            Viewing {student?.name}'s SOP{" "}
            {versionName || `Version ${versionNumber}`}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* SOP Content - Left Column */}
        <div className="w-full lg:w-[calc(100%-650px)] lg:min-w-[500px] flex flex-col bg-card rounded-lg border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center shrink-0">
            <FileText className="text-primary mr-3" size={18} />
            <h2 className="font-medium">SOP Content</h2>

            <div className="ml-auto flex items-center gap-2">
              {activeCommentId && (
                <button
                  onClick={() => {
                    setActiveCommentId(null);
                    setSelectedText("");
                  }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 py-1 px-2 rounded-full bg-blue-50 hover:bg-blue-100"
                >
                  <X size={14} />
                  <span>Clear Highlight</span>
                </button>
              )}
              <p className="text-xs text-muted-foreground">
                Select text to comment
              </p>
            </div>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="prose max-w-none">
              {sopContent ? (
                <TextEditor
                  initialContent={sopContent}
                  onSave={async (content: string) => {
                    setSOPContent(content);
                    return Promise.resolve();
                  }}
                  showIsland={false}
                  highlights={generateHighlights()}
                  onSelectionChange={setSelectedText}
                  readOnly={true}
                  activeHighlight={
                    activeCommentId
                      ? feedbacks.find((f) => f.id === activeCommentId)
                          ?.selectedText
                      : undefined
                  }
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No content available for this version
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Component */}
        <MentorFeedback
          feedbacks={feedbacks}
          setFeedbacks={setFeedbacks}
          selectedText={selectedText}
          setSelectedText={setSelectedText}
          activeCommentId={activeCommentId}
          setActiveCommentId={setActiveCommentId}
          mentorId={mentorId}
          onApplySuggestion={handleApplySuggestion}
          commonSuggestions={commonSuggestions}
          documentId={sopId}
          studentId={studentId}
          onGenerateAIFeedback={() => handleGenerateAIFeedback()}
          isGenerating={isGenerating}
        />
      </main>
    </div>
  );
}