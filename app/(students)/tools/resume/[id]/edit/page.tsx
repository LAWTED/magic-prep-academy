"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { processVectorChatStream } from "@/app/utils/streamUtils";
import { useUserStore } from "@/store/userStore";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import {
  ChatInput,
  ChatMessage,
  LoadingState,
  TypingIndicator,
  WelcomeScreen,
  resumeEditor,
  type Message,
  type ChatPerson,
} from "@/app/(students)/chat/components";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function ResumeEdit() {
  const { user } = useUserStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const documentId = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingDots, setStreamingDots] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  // 固定使用 resume-editor 角色
  const [selectedPerson] = useState<ChatPerson>(resumeEditor);

  // 检查URL中是否有初始提示
  const getInitialPrompt = () => {
    // 检查URL中的has_resume标记
    const hasResume = searchParams.get("has_resume");

    if (hasResume === "true") {
      // 从sessionStorage读取简历内容
      try {
        const resumePrompt = sessionStorage.getItem("resume_review_prompt");
        if (resumePrompt) {
          // 清除sessionStorage中的数据，避免重复使用
          sessionStorage.removeItem("resume_review_prompt");
          return resumePrompt;
        }
      } catch (e) {
        console.error("Failed to read resume from sessionStorage:", e);
      }
    }

    // 回退到直接从URL参数获取
    const initialPromptParam = searchParams.get("initialPrompt");
    if (initialPromptParam) {
      try {
        return decodeURIComponent(initialPromptParam);
      } catch (e) {
        console.error("Failed to decode initial prompt:", e);
      }
    }

    return null;
  };

  // 初始化，并处理初始提示
  useEffect(() => {
    if (hasInitializedRef.current) return;

    // 短暂显示加载状态
    setTimeout(() => {
      setIsLoading(false);

      // 处理初始提示
      const initialPrompt = getInitialPrompt();
      if (initialPrompt) {
        hasInitializedRef.current = true;

        // 自动发送初始提示
        setTimeout(() => {
          handleSendMessage(initialPrompt);
        }, 500);
      }
    }, 500);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Streaming dots animation
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setStreamingDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const handleSendMessage = async (inputValue: string) => {
    if (!inputValue.trim() || isStreaming) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);

    try {
      // Create temporary assistant message for streaming
      const assistantMessageId = (Date.now() + 1).toString();
      const tempAssistantMessage: Message = {
        id: assistantMessageId,
        content: "",
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, tempAssistantMessage]);

      // Format conversation history for the API
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the current user message
      conversationHistory.push({
        role: "user",
        content: inputValue,
      });

      // Call the streaming API
      const response = await fetch("/api/chat-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: inputValue,
          messages: conversationHistory,
          system_prompt: selectedPerson.systemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      let accumulatedText = "";
      let lastProcessedText = "";

      await processVectorChatStream<string>(response, (chunk) => {
        // Update with streaming content
        if (typeof chunk.chunk === "object" && chunk.chunk !== null) {
          // Extract text from the chunk based on the available properties
          let chunkText = "";
          if (
            "output_text" in chunk.chunk &&
            typeof chunk.chunk.output_text === "string"
          ) {
            chunkText = chunk.chunk.output_text;
          } else if (
            "text" in chunk.chunk &&
            typeof chunk.chunk.text === "string"
          ) {
            chunkText = chunk.chunk.text;
          } else if (
            "delta" in chunk.chunk &&
            chunk.chunk.delta &&
            typeof chunk.chunk.delta === "string"
          ) {
            chunkText = chunk.chunk.delta;
          }

          if (chunkText) {
            // Check if this is a delta or a full replacement
            if ("delta" in chunk.chunk) {
              // For delta updates, just append the new text
              accumulatedText += chunkText;
            } else {
              // For full content updates, replace the entire text
              // This prevents duplication when the API sends complete content
              accumulatedText = chunkText;
            }

            // Only update if the content has actually changed
            if (accumulatedText !== lastProcessedText) {
              lastProcessedText = accumulatedText;

              // Update the message with accumulated text
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedText }
                    : msg
                )
              );
            }
          }
        }
      });
    } catch (error) {
      console.error("Error in chat:", error);

      // Add error message if the stream failed
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "Sorry, I encountered an error. Please try again.",
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* 自定义简单的头部，带返回按钮 */}
      <div className="flex items-center px-4 py-3 border-b">
        <Link href={`/tools/resume/${documentId}`}>
          <button className="mr-3 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <h1 className="font-medium text-lg">Resume Editor</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {messages.length === 0 ? (
          <WelcomeScreen selectedPerson={selectedPerson} />
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                selectedPerson={selectedPerson}
                documentId={documentId}
              />
            ))}
          </div>
        )}

        {isStreaming && (
          <TypingIndicator
            selectedPerson={selectedPerson}
            dots={streamingDots}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {!isLoading && (
        <div className="sticky bottom-0 w-full bg-white border-t p-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              isDisabled={isStreaming}
              placeholder={`发送消息给${selectedPerson.name}...`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResumeEditPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ResumeEdit />
    </Suspense>
  );
}
