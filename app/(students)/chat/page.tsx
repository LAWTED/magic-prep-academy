"use client";

import { useState, useRef, useEffect, Suspense } from "react";
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
  createMentorChatPerson,
  type Message,
  type ChatPerson,
} from "./components";
import { createClient } from "@/utils/supabase/client";
import { UserCheck } from "lucide-react";
import Image from "next/image";
import useFcmToken from "@/hooks/useFcmToken";

function Chat() {
  const { user } = useUserStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingDots, setStreamingDots] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  const supabase = createClient();
  const { token: userFcmToken, notificationPermissionStatus } = useFcmToken();

  // State for real mentor chat
  const [availableMentors, setAvailableMentors] = useState<any[]>([]);
  const [allChatPersons, setAllChatPersons] =
    useState<ChatPerson[]>(chatPersons);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [mentorFcmToken, setMentorFcmToken] = useState<string | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // Fetch available mentors from the database
  useEffect(() => {
    async function fetchMentors() {
      try {
        const { data, error } = await supabase
          .from("mentors")
          .select("*")
          .is("deleted_at", null);

        if (error) {
          console.error("Error fetching mentors:", error);
          return;
        }

        if (data) {
          // Convert mentors to chat persons and add to all chat persons
          const mentorChatPersons = data.map((mentor) =>
            createMentorChatPerson(mentor)
          );
          setAvailableMentors(data);
          setAllChatPersons([...chatPersons, ...mentorChatPersons]);
        }
      } catch (error) {
        console.error("Error fetching mentors:", error);
      }
    }

    fetchMentors();
  }, [supabase]);

  // 找到指定的对话人，如果不存在，则使用默认的
  const getInitialPerson = () => {
    const personId = searchParams?.get("person");
    if (personId) {
      const person = allChatPersons
        .filter((p) => p.id !== "resume-editor")
        .find((p) => p.id === personId);
      if (person) {
        return person;
      }
    }
    return allChatPersons[0]; // 默认使用第一个人物（现在是PhD Mentor）
  };

  const [selectedPerson, setSelectedPerson] = useState<ChatPerson>(() =>
    getInitialPerson()
  );

  // Update selectedPerson when allChatPersons changes
  useEffect(() => {
    const personId = searchParams?.get("person");
    if (personId) {
      const person = allChatPersons
        .filter((p) => p.id !== "resume-editor")
        .find((p) => p.id === personId);
      if (person) {
        setSelectedPerson(person);
      }
    }
  }, [allChatPersons, searchParams]);

  // Load existing chat session if available for real mentor
  useEffect(() => {
    if (selectedPerson.isRealPerson && user?.id && !isLoadingChat) {
      loadChatSession(selectedPerson.id);
    }
  }, [selectedPerson.id, user?.id]);

  // Set up real-time subscription for chat messages
  useEffect(() => {
    if (!chatSessionId) return;

    console.log("Setting up realtime subscription for chat ID:", chatSessionId);

    // 使用一个简单的通道名称
    const channelId = `chat-${chatSessionId}`;

    // Subscribe to changes in the mentor_student_interactions table
    let channel: any;
    try {
      channel = supabase
        .channel(channelId)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "mentor_student_interactions",
            filter: `id=eq.${chatSessionId}`,
          },
          (payload) => {
            console.log("Received real-time update");
            // The conversation has been updated
            if (
              payload.new &&
              payload.new.type === "chat" &&
              payload.new.metadata?.messages
            ) {
              console.log("Updating messages from real-time event");
              // Replace our messages with the entire updated message history
              setMessages(payload.new.metadata.messages);
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error("Error setting up subscription:", error);
    }

    return () => {
      if (channel) {
        try {
          console.log(`Removing channel for chat ${chatSessionId}`);
          supabase.removeChannel(channel);
        } catch (error) {
          console.error("Error removing channel:", error);
        }
      }
    };
  }, [chatSessionId, supabase]);

  // Load existing chat session if available
  const loadChatSession = async (mentorId: string) => {
    if (!user?.id || isLoadingChat) return;

    // Set loading state to prevent duplicate calls
    setIsLoadingChat(true);

    try {
      // Check if there's an existing chat session with this mentor
      const { data, error } = await supabase
        .from("mentor_student_interactions")
        .select("*")
        .eq("student_id", user.id)
        .eq("mentor_id", mentorId)
        .eq("type", "chat")
        .maybeSingle();

      if (error) {
        console.error("Error loading chat session:", error);
        setIsLoadingChat(false);
        return;
      }

      // Also fetch mentor's FCM token for notifications
      const { data: mentorData, error: mentorError } = await supabase
        .from("mentors")
        .select("fcm_token")
        .eq("id", mentorId)
        .single();

      if (!mentorError && mentorData?.fcm_token) {
        setMentorFcmToken(mentorData.fcm_token);
      }

      if (data) {
        // Existing chat session found
        setChatSessionId(data.id);

        // Load previous messages
        if (data.metadata?.messages) {
          setMessages(data.metadata.messages);
        }
      } else {
        // Create a new chat session
        const { data: newSession, error: createError } = await supabase
          .from("mentor_student_interactions")
          .insert({
            student_id: user.id,
            mentor_id: mentorId,
            type: "chat",
            status: "active",
            metadata: {
              messages: [],
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating chat session:", createError);
          setIsLoadingChat(false);
          return;
        }

        setChatSessionId(newSession.id);
        setMessages([]);
      }

      setIsLoading(false);
      setIsLoadingChat(false);
    } catch (error) {
      console.error("Error managing chat session:", error);
      setIsLoadingChat(false);
    }
  };

  // 检查URL中是否有初始提示
  const getInitialPrompt = () => {
    // 检查URL中的has_resume标记
    const hasResume = searchParams?.get("has_resume");

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

    // 检查URL中的has_sop标记
    const hasSop = searchParams?.get("has_sop");
    if (hasSop === "true") {
      // 从sessionStorage读取SOP内容
      try {
        const sopPrompt = sessionStorage.getItem("sop_review_prompt");
        if (sopPrompt) {
          // 清除sessionStorage中的数据，避免重复使用
          sessionStorage.removeItem("sop_review_prompt");
          return sopPrompt;
        }
      } catch (e) {
        console.error("Failed to read SOP from sessionStorage:", e);
      }
    }

    // 回退到直接从URL参数获取
    const initialPromptParam = searchParams?.get("initialPrompt");
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
    const personId = searchParams?.get("person");
    if (personId) {
      const person = allChatPersons
        .filter((p) => p.id !== "resume-editor")
        .find((p) => p.id === personId);
      if (person && person.id !== selectedPerson.id) {
        changePerson(person);
      }
    }
  }, [searchParams, allChatPersons]);

  // 初始化，并处理初始提示
  useEffect(() => {
    if (hasInitializedRef.current) return;

    // 短暂显示加载状态
    setTimeout(() => {
      setIsLoading(false);

      // 处理初始提示
      const initialPrompt = getInitialPrompt();
      if (initialPrompt && selectedPerson && !selectedPerson.isRealPerson) {
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

  // 统一处理人物切换逻辑
  const changePerson = (person: ChatPerson) => {
    setSelectedPerson(person);
    setIsLoading(true);
    setMessages([]);
    hasInitializedRef.current = false;

    if (person.isRealPerson) {
      // If switching to real mentor, load the chat session
      if (user?.id && !isLoadingChat) {
        loadChatSession(person.id);
      }
    } else {
      setChatSessionId(null);
    }

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
      sender_id: user?.id,
      sender_name: user?.name,
      sender_avatar: user?.avatar_name,
    };

    // 立即更新本地消息列表，直接显示用户消息
    setMessages((prev) => [...prev, userMessage]);

    // Handle real mentor chat
    if (selectedPerson.isRealPerson && chatSessionId) {
      try {
        console.log("Sending message to real mentor, chat ID:", chatSessionId);

        // 获取当前消息列表（确保获取最新状态）
        const { data: currentData, error: fetchError } = await supabase
          .from("mentor_student_interactions")
          .select("metadata")
          .eq("id", chatSessionId)
          .single();

        if (fetchError) {
          console.error("Error fetching current chat data:", fetchError);
          return;
        }

        // 合并现有消息和新消息
        const currentMessages = currentData?.metadata?.messages || [];
        const updatedMessages = [...currentMessages, userMessage];

        // 更新数据库 - 使用简单的.update()调用
        const result = await supabase
          .from("mentor_student_interactions")
          .update({
            metadata: {
              ...currentData?.metadata,
              messages: updatedMessages,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", chatSessionId);

        if (result.error) {
          console.error("Error saving message:", result.error);
        } else {
          console.log("Message saved successfully");
        }

        // Send notification to mentor if they have a token
        if (mentorFcmToken && selectedPerson.id) {
          try {
            console.log("Sending notification to mentor");
            await fetch("/api/chat-notification", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                receiverId: selectedPerson.id,
                senderId: user?.id,
                senderName: user?.name,
                token: mentorFcmToken,
                message: inputValue,
                chatSessionId: chatSessionId,
              }),
            });
          } catch (notifyError) {
            console.error("Error sending notification:", notifyError);
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }

      return;
    }

    // Handle AI chat
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
            typeof chunk.chunk.delta.content === "string"
          ) {
            chunkText = chunk.chunk.delta.content;
          }

          // Accumulate the text for a better user experience
          accumulatedText += chunkText;

          // We only update the message if there are meaningful changes to avoid too many re-renders
          if (
            accumulatedText.length - lastProcessedText.length > 5 ||
            (accumulatedText.includes("\n") &&
              !lastProcessedText.includes("\n"))
          ) {
            lastProcessedText = accumulatedText;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: accumulatedText }
                  : msg
              )
            );
          }
        }
      });

      // Make sure the final text is set
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: accumulatedText }
            : msg
        )
      );
    } catch (error) {
      console.error("Error calling chat API:", error);
      // Handle the error - maybe add an error message to the chat
      setMessages((prev) =>
        prev.map((msg) =>
          msg.role === "assistant" && msg.content === ""
            ? {
                ...msg,
                content:
                  "Sorry, I encountered an error processing your request. Please try again.",
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        selectedPerson={selectedPerson}
        onPersonChange={handleChangePerson}
        messagesCount={messages.length}
        allChatPersons={allChatPersons}
        userId={user?.id}
        fcmToken={userFcmToken}
        notificationPermissionStatus={notificationPermissionStatus}
      />

      <div className="flex-1 flex flex-col overflow-y-auto">
        {isLoading ? (
          <LoadingState />
        ) : messages.length === 0 ? (
          <WelcomeScreen selectedPerson={selectedPerson} />
        ) : (
          <div className="flex-1 pb-20 overflow-auto">
            <div className="max-w-3xl mx-auto p-4 space-y-6">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  selectedPerson={selectedPerson}
                />
              ))}
              {isStreaming && (
                <TypingIndicator
                  selectedPerson={selectedPerson}
                  dots={streamingDots}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {!isLoading && (
        <ChatInput
          onSendMessage={handleSendMessage}
          isDisabled={isStreaming}
          placeholder={`发送消息给${selectedPerson.name}...`}
        />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Chat />
    </Suspense>
  );
}
