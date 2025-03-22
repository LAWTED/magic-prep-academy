import { useState, useEffect } from "react";
import Image from "next/image";
import { Copy, Check, MessageSquare, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatPerson, Message } from "./types";
import APAPreview from "../../tools/resume/components/APAPreview";

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
  documentId = null
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);

  const isUser = message.role === "user";

  useEffect(() => {
    // Try to detect and parse resume metadata from the message content
    if (message.content) {
      try {
        // Look for JSON content in the message (could be in code blocks or directly in message)
        let jsonContent;

        // First try to match content between ```json and ``` tags
        const codeBlockMatch = message.content.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          jsonContent = JSON.parse(codeBlockMatch[1]);
        } else {
          // Otherwise try to match any JSON-like object
          const jsonMatches = message.content.match(/\{[\s\S]*\}/);
          if (jsonMatches) {
            jsonContent = JSON.parse(jsonMatches[0]);
          }
        }

        // Check if this looks like resume data in APA format
        if (jsonContent) {
          // Direct APA format: Contains personalInfo section (main indicator of APA format)
          if (jsonContent.personalInfo) {
            setResumeData({
              format: "APA",
              content: jsonContent
            });
          }
          // Wrapped format: Content inside a container with format specified
          else if (jsonContent.format?.toLowerCase() === "apa" && jsonContent.content) {
            setResumeData(jsonContent);
          }
        }
      } catch (error) {
        // Silent fail - not all messages will contain valid JSON
        console.log("No valid resume data found in message");
      }
    }
  }, [message.content]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Function to render message content without JSON metadata
  const renderMessageContent = () => {
    if (resumeData) {
      // If we found resume data, render the message without the JSON part
      let cleanContent = message.content;

      // Remove JSON code blocks
      cleanContent = cleanContent.replace(/```json\s*([\s\S]*?)\s*```/g, "");

      // Remove raw JSON objects
      cleanContent = cleanContent.replace(/\{[\s\S]*\}/, "");

      // Clean up any excessive newlines that may have been left
      cleanContent = cleanContent.replace(/\n{3,}/g, "\n\n");

      return cleanContent.trim();
    }
    return message.content;
  };

  // Function to determine if we should render the APA preview
  const shouldRenderApaPreview = () => {
    return resumeData !== null;
  };

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            {selectedPerson.avatar ? (
              <Image
                src={selectedPerson.avatar}
                alt={selectedPerson.name}
                width={32}
                height={32}
                className="object-cover"
              />
            ) : (
              <MessageSquare size={16} className="text-white" />
            )}
          </div>
        </div>
      )}

      <div
        className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-xl ${
          isUser
            ? "bg-blue-100 text-blue-900"
            : "bg-white border border-gray-200 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {isUser ? "You" : selectedPerson.name}
          </span>
          {!isUser && (
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
              )
            }}
          >
            {renderMessageContent()}
          </ReactMarkdown>

          {/* Render APA Preview if we detected resume data */}
          {shouldRenderApaPreview() && (
            <div className="mt-4 border-t pt-4">
              <APAPreview
                resumeData={resumeData.content || resumeData}
                fileName={isUser ? "Your Resume" : "Edited Resume"}
                defaultExpanded={false}
                documentId={documentId}
              />
            </div>
          )}

          {/* Render custom content if provided */}
          {renderCustomContent && renderCustomContent(message)}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 overflow-hidden rounded-full bg-blue-100 flex items-center justify-center">
            <User size={16} className="text-blue-600" />
          </div>
        </div>
      )}
    </div>
  );
}