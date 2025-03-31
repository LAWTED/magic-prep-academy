import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatPerson, Message } from "@/app/(students)/chat/components/types";
import { useMessageContentParser } from "@/app/(students)/chat/components/content-parsers";
import {
  ResumePreview,
  SOPPreview,
  LoRRequestPreview,
  FeedbackPreview,
} from "@/app/mentor/chat/components/previews";
import { usePathname } from "next/navigation";

interface ChatMessageProps {
  message: Message;
  selectedPerson: ChatPerson;
  renderCustomContent?: (message: Message) => React.ReactNode | null;
  documentId?: string | null;
}

export function ChatMessage({
  message,
  selectedPerson,
  renderCustomContent,
  documentId = null,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const { cleanContent, resumeData, sopContent, lorRequestInfo, sopFeedback } =
    useMessageContentParser(message);
  const pathname = usePathname();

  // Determine if we're in mentor view
  const isMentorView = pathname?.startsWith("/mentor") ?? false;

  // In student view: user messages are from the student ("You")
  // In mentor view: user messages are from the student (show student name)
  const isUserMessage = message.role === "user";

  // In student view: align user messages right, others left
  // In mentor view: align mentor messages right, student messages left
  const isCurrentUserMessage = isMentorView
    ? message.role === "assistant" && message.sender_id // Mentor's messages in mentor view
    : isUserMessage; // Student's messages in student view

  // Check if this is a message from a real person (mentor)
  const isRealMentor =
    selectedPerson.isRealPerson &&
    message.role === "assistant" &&
    message.sender_id;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get the name to display
  const getSenderName = () => {
    if (isMentorView) {
      // In mentor view
      return isUserMessage
        ? message.sender_name || selectedPerson.name // Student name for student messages
        : "You"; // "You" for mentor's own messages
    } else {
      // In student view (original behavior)
      return isUserMessage
        ? "You"
        : isRealMentor
          ? message.sender_name
          : selectedPerson.name;
    }
  };

  return (
    <div
      className={`flex flex-col mb-4 ${isCurrentUserMessage ? "items-end" : "items-start"}`}
    >
      <div
        className={`max-w-[90%] md:max-w-[80%] px-4 py-3 rounded-xl ${
          isCurrentUserMessage
            ? "bg-blue-100 text-blue-900"
            : "bg-white border border-gray-200 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{getSenderName()}</span>
          {!isCurrentUserMessage && (
            <button
              onClick={copyToClipboard}
              className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-500"
            >
              {copied ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          )}
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            components={{
              pre: ({ node, ...props }) => (
                <pre className="overflow-auto max-w-full" {...props} />
              ),
              code: ({ node, ...props }) => (
                <code className="whitespace-pre" {...props} />
              ),
            }}
          >
            {cleanContent}
          </ReactMarkdown>

          {/* Resume Preview */}
          {resumeData && (
            <ResumePreview resumeData={resumeData} documentId={documentId} />
          )}

          {/* SOP Preview */}
          {sopContent && <SOPPreview content={sopContent} />}

          {/* LoR Request Preview */}
          {lorRequestInfo && (
            <LoRRequestPreview
              requestId={lorRequestInfo.requestId}
              programName={lorRequestInfo.programName}
              schoolName={lorRequestInfo.schoolName}
            />
          )}

          {/* Feedback Preview */}
          {sopFeedback && (
            <FeedbackPreview
              sopId={sopFeedback.sopId}
              studentId={selectedPerson.id}
              documentName={sopFeedback.documentName}
              feedbackCount={sopFeedback.feedbackCount}
              mentorName={sopFeedback.mentorName}
              commentsCount={sopFeedback.commentsCount}
              suggestionsCount={sopFeedback.suggestionsCount}
            />
          )}

          {/* Render custom content if provided */}
          {renderCustomContent && renderCustomContent(message)}
        </div>
      </div>
    </div>
  );
}
