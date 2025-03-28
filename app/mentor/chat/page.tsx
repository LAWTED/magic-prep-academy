"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import {
  MessageCircle,
  Send,
  User,
  ArrowLeft,
  MoreVertical,
  Search,
  Plus,
  UserCheck,
  Cog,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatMessage } from "@/app/(students)/chat/components/ChatMessage";
import { ChatInput } from "@/app/(students)/chat/components/ChatInput";
import { motion } from "framer-motion";
import {
  ChatPerson,
  Message as ChatMessageType,
} from "@/app/(students)/chat/components/types";
import useFcmToken from "@/hooks/useFcmToken";
import { NotificationToggle } from "@/app/(students)/chat/components/NotificationToggle";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  sender_name?: string;
  sender_id?: string;
  sender_avatar?: string;
}

interface ChatSession {
  id: string;
  student_id: string;
  student_name: string;
  student_avatar: string;
  last_message: string;
  updated_at: string;
  unread_count: number;
}

// Welcome screen for empty chat
const WelcomeScreen = ({ studentName }: { studentName: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-6"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="mb-6 p-5 rounded-full bg-green-100"
      >
        <UserCheck size={40} className="text-green-600" />
      </motion.div>

      <h1 className="text-2xl font-bold mb-3">Chat with {studentName}</h1>

      <p className="text-gray-500 max-w-md text-center mb-6">
        Provide guidance and support to your student. Your expertise can make a
        significant difference in their academic journey.
      </p>

      <div className="text-sm text-gray-400 max-w-md">
        <p>Send a message to start the conversation...</p>
      </div>
    </motion.div>
  );
};

function MentorChat() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token: mentorFcmToken, notificationPermissionStatus } = useFcmToken();
  const [studentFcmToken, setStudentFcmToken] = useState<string | null>(null);

  // Handle URL parameter changes
  useEffect(() => {
    if (chatSessions.length > 0 && userIdParam) {
      const sessionWithStudentId = chatSessions.find(
        (session) => session.student_id === userIdParam
      );

      if (sessionWithStudentId) {
        selectChat(sessionWithStudentId.id);
      }
    }
  }, [userIdParam, chatSessions]);

  // Load mentor profile and chat sessions
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/mentor/sign-in");
          return;
        }

        // Get mentor profile
        const { data: profile, error: profileError } = await supabase
          .from("mentors")
          .select("*")
          .eq("auth_id", user.id)
          .single();

        if (profileError || !profile) {
          router.push("/mentor/onboarding");
          return;
        }

        setMentorProfile(profile);

        // Get chat sessions
        await loadChatSessions(profile.id);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase, router]);

  // Load chat sessions
  const loadChatSessions = async (mentorId: string) => {
    try {
      const { data, error } = await supabase
        .from("mentor_student_interactions")
        .select(
          `
          id,
          student_id,
          status,
          updated_at,
          metadata,
          users:student_id(name, avatar_name)
        `
        )
        .eq("mentor_id", mentorId)
        .eq("type", "chat")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error loading chat sessions:", error);
        return;
      }

      if (data) {
        const formattedSessions: ChatSession[] = data.map((item: any) => {
          const messages = item.metadata?.messages || [];
          const lastMessage =
            messages.length > 0 ? messages[messages.length - 1].content : "";

          // Type assertion for user data
          const userData = item.users as {
            name: string;
            avatar_name: string;
          } | null;

          return {
            id: item.id,
            student_id: item.student_id,
            student_name: userData?.name || "Unknown Student",
            student_avatar: userData?.avatar_name || "default",
            last_message:
              lastMessage.substring(0, 50) +
              (lastMessage.length > 50 ? "..." : ""),
            updated_at: new Date(item.updated_at).toLocaleString(),
            unread_count: 0, // We'll implement this later
          };
        });

        setChatSessions(formattedSessions);

        // Check if there's a userId in the URL and select that chat
        if (userIdParam) {
          const chatSession = formattedSessions.find(
            (session) => session.student_id === userIdParam
          );
          if (chatSession) {
            selectChat(chatSession.id);
          } else if (formattedSessions.length > 0) {
            // If specified userId not found, select first chat
            selectChat(formattedSessions[0].id);
          }
        } else if (formattedSessions.length > 0 && !selectedChatId) {
          // Otherwise select the first chat if none is selected
          selectChat(formattedSessions[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading chat sessions:", error);
    }
  };

  // Select a chat session and load messages
  const selectChat = async (chatId: string) => {
    setSelectedChatId(chatId);

    // Update the URL to include the selected chat
    router.push(`/mentor/chat?chat=${chatId}`, {
      scroll: false,
    });

    try {
      // Find the selected chat session
      const selectedSession = chatSessions.find((s) => s.id === chatId);

      if (selectedSession) {
        // Load messages for this chat - fetch the latest data to ensure we have metadata
        const { data, error } = await supabase
          .from("mentor_student_interactions")
          .select("metadata")
          .eq("id", chatId)
          .single();

        if (!error && data && data.metadata?.messages) {
          setMessages(data.metadata.messages);
        } else {
          setMessages([]);
        }

        // Fetch student's FCM token for notifications
        if (selectedSession.student_id) {
          const { data: studentData, error: studentError } = await supabase
            .from('users')
            .select('fcm_token')
            .eq('id', selectedSession.student_id)
            .single();

          if (!studentError && studentData?.fcm_token) {
            setStudentFcmToken(studentData.fcm_token);
            console.log("Student FCM token fetched:", studentData.fcm_token.substring(0, 10) + "...");
          } else {
            console.log("Could not fetch student FCM token:", studentError);
          }
        }
      }
    } catch (error) {
      console.error("Error selecting chat:", error);
    }
  };

  // Set up real-time subscription for chat messages
  useEffect(() => {
    if (!selectedChatId || !mentorProfile) return;

    console.log("Setting up realtime subscription for chat ID:", selectedChatId);

    // 使用一个简单的通道名称
    const channelId = `chat-${selectedChatId}`;

    // Subscribe to changes in the selected chat
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
            filter: `id=eq.${selectedChatId}`,
          },
          (payload) => {
            console.log("Received real-time update in mentor chat");
            if (
              payload.new &&
              payload.new.type === "chat" &&
              payload.new.metadata?.messages
            ) {
              console.log("Updating mentor chat messages from real-time event");
              setMessages(payload.new.metadata.messages);

              // Refresh the chat list to update last message preview
              if (mentorProfile) {
                loadChatSessions(mentorProfile.id);
              }
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
          console.log(`Removing channel for mentor chat ${selectedChatId}`);
          supabase.removeChannel(channel);
        } catch (error) {
          console.error("Error removing channel:", error);
        }
      }
    };
  }, [selectedChatId, mentorProfile]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a message
  const sendMessage = async (inputText: string) => {
    if (!inputText.trim() || !selectedChatId || !mentorProfile) return;

    console.log("Mentor sending message in chat:", selectedChatId);

    // Create the message object
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: inputText,
      createdAt: new Date().toISOString(),
      sender_id: mentorProfile.id,
      sender_name: mentorProfile.name,
      sender_avatar: mentorProfile.avatar_name,
    };

    try {
      // 立即更新本地消息列表，以便快速显示消息
      setMessages(prevMessages => [...prevMessages, newMessage]);

      // Get current messages from database
      const { data, error } = await supabase
        .from("mentor_student_interactions")
        .select("metadata, student_id")
        .eq("id", selectedChatId)
        .single();

      if (error) {
        console.error("Error getting current messages:", error);
        return;
      }

      // Add the new message to database messages
      const currentMessages = data.metadata?.messages || [];
      const updatedMessages = [...currentMessages, newMessage];

      // Update the database with new metadata
      const updateResult = await supabase
        .from("mentor_student_interactions")
        .update({
          metadata: {
            ...data.metadata,
            messages: updatedMessages,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedChatId);

      if (updateResult.error) {
        console.error("Error updating chat:", updateResult.error);
      } else {
        console.log("Chat updated successfully");

        // 手动更新聊天列表（避免等待实时更新）
        if (mentorProfile) {
          loadChatSessions(mentorProfile.id);
        }
      }

      // Send notification to student if they have a token
      if (studentFcmToken && data.student_id) {
        try {
          console.log("Sending notification to student");
          await fetch("/api/chat-notification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              receiverId: data.student_id,
              senderId: mentorProfile.id,
              senderName: mentorProfile.name,
              token: studentFcmToken,
              message: inputText,
              chatSessionId: selectedChatId
            }),
          });
        } catch (notifyError) {
          console.error("Error sending notification:", notifyError);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get current student info
  const currentStudent = chatSessions.find((s) => s.id === selectedChatId);

  // Create a chat person object for the selected student
  const studentChatPerson: ChatPerson = currentStudent
    ? {
        id: currentStudent.student_id,
        name: currentStudent.student_name,
        avatar: `/images/avatars/${currentStudent?.student_avatar || "default"}.png`,
        isRealPerson: true,
        systemPrompt: "",
        icon: UserCheck,
        color: "text-green-600",
        description: "Chat with your student",
      }
    : {
        id: "default-student",
        name: "Student",
        avatar: "/images/avatars/default.png",
        isRealPerson: true,
        systemPrompt: "",
        icon: UserCheck,
        color: "text-green-600",
        description: "Chat with your student",
      };

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Fixed Header for both mobile and desktop */}
      <header className="w-full p-6 flex items-center justify-between border-b bg-card">
        <div className="flex items-center">
          <Link
            href="/mentor/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span className="md:inline hidden">Back to Dashboard</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* 添加通知开关按钮 */}
          {mentorProfile && (
            <NotificationToggle
              userId={mentorProfile.id}
              userRole="mentor"
              fcmToken={mentorFcmToken}
              notificationPermissionStatus={notificationPermissionStatus}
            />
          )}

        <button className="text-gray-400 cursor-not-allowed" disabled>
          <Cog size={24} />
        </button>
        </div>
      </header>

      <div className="flex max-h-[calc(100vh-76px)]">
        {/* Chat List Sidebar */}
        <div className="w-80 border-r bg-white hidden md:block">
          <div className="p-4 border-b">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search students..."
                className="pl-10 w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100vh-170px)]">
            {chatSessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No active conversations
              </div>
            ) : (
              chatSessions.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedChatId === chat.id ? "bg-blue-50" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                      <Image
                        src={`/images/avatars/${chat.student_avatar}.png`}
                        alt={chat.student_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">
                        {chat.student_name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {chat.last_message}
                      </p>
                      <span className="text-xs text-gray-400">
                        {chat.updated_at}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChatId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-white flex items-center gap-3">
                <div className="relative w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
                  <Image
                    src={`/images/avatars/${currentStudent?.student_avatar || "default"}.png`}
                    alt="Student"
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h2 className="font-medium">
                    {currentStudent?.student_name || "Student"}
                  </h2>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <WelcomeScreen
                    studentName={currentStudent?.student_name || "Student"}
                  />
                ) : (
                  messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={{
                        id: message.id,
                        role: message.role === "user" ? "user" : "assistant",
                        content: message.content,
                        timestamp: new Date(message.createdAt),
                        sender_id: message.sender_id,
                        sender_name: message.sender_name,
                      }}
                      selectedPerson={studentChatPerson}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t bg-white p-4">
                <div className="max-w-3xl mx-auto">
                  <ChatInput
                    onSendMessage={sendMessage}
                    isDisabled={false}
                    placeholder={`Message ${currentStudent?.student_name || "student"}...`}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              {chatSessions.length === 0 ? (
                <div className="text-center">
                  <MessageCircle
                    size={48}
                    className="mx-auto mb-4 text-gray-300"
                  />
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div className="text-center">
                  <p>Select a conversation to start chatting</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MentorChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MentorChat />
    </Suspense>
  );
}
