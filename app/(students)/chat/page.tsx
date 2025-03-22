"use client";

import { useState, useRef, useEffect } from "react";
import { processVectorChatStream } from "@/app/utils/streamUtils";
import { useUserStore } from "@/store/userStore";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChatHeader,
  ChatInput,
  ChatMessage,
  LoadingState,
  TypingIndicator,
  WelcomeScreen,
  chatPersons,
  type Message,
  type ChatPerson,
} from "./components";

export default function ChatPage() {
  const { user } = useUserStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingDots, setStreamingDots] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  // 找到指定的对话人，如果不存在，则使用默认的
  const getInitialPerson = () => {
    const personId = searchParams.get("person");
    if (personId) {
      const person = chatPersons
        .filter((p) => p.id !== "resume-editor")
        .find((p) => p.id === personId);
      if (person) {
        return person;
      }
    }
    return chatPersons[0]; // 默认使用第一个人物（现在是PhD Mentor）
  };

  const [selectedPerson, setSelectedPerson] =
    useState<ChatPerson>(getInitialPerson);

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

  // 当URL参数变化时更新对话人
  useEffect(() => {
    const personId = searchParams.get("person");
    if (personId) {
      const person = chatPersons
        .filter((p) => p.id !== "resume-editor")
        .find((p) => p.id === personId);
      if (person && person.id !== selectedPerson.id) {
        changePerson(person);
      }
    }
  }, [searchParams]);

  // 初始化，并处理初始提示
  useEffect(() => {
    if (hasInitializedRef.current) return;

    // 短暂显示加载状态
    setTimeout(() => {
      setIsLoading(false);

      // 处理初始提示
      const initialPrompt = getInitialPrompt();
      if (initialPrompt && selectedPerson) {
        hasInitializedRef.current = true;

        // 自动发送初始提示
        setTimeout(() => {
          handleSendMessage(initialPrompt);
        }, 500);
      }
    }, 500);
  }, [selectedPerson]);

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

  const clearChat = () => {
    hasInitializedRef.current = false;
    setMessages([]);
  };

  // 统一处理人物切换逻辑
  const changePerson = (person: ChatPerson) => {
    setSelectedPerson(person);
    setIsLoading(true);
    setMessages([]);
    hasInitializedRef.current = false;

    // 短暂延迟后关闭加载状态
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleChangePerson = (person: ChatPerson) => {
    if (person.id !== selectedPerson.id) {
      changePerson(person);

      // 更新URL以反映选择的对话人
      router.push(`/chat?person=${person.id}`, { scroll: false });
    }
  };

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
      <ChatHeader
        selectedPerson={selectedPerson}
        onPersonChange={handleChangePerson}
        onClearChat={clearChat}
        messagesCount={messages.length}
      />

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
              />
            ))}
          </div>
        )}

        {isStreaming && <TypingIndicator streamingDots={streamingDots} />}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        selectedPerson={selectedPerson}
        isStreaming={isStreaming}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
