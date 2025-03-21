"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

type Message = {
  id: string;
  content: string;
  sender: "user" | "mentor";
  timestamp: Date;
};

// Mock initial messages
const initialMessages: Message[] = [
  {
    id: "1",
    content:
      "Hi there! I'm your PhD mentor. I can help you improve your resume for academic applications. What questions do you have?",
    sender: "mentor",
    timestamp: new Date(new Date().getTime() - 300000),
  },
];

// Mock responses for specific questions
const mockResponses: Record<string, string> = {
  "research": `For your research section, I'd recommend:

1. Begin with your research interests and methodological expertise

2. For each project, include: title, your role, PI name, methodology, and key findings

3. Quantify impact where possible (e.g., "Increased participant retention by 15%")

4. Include technical skills relevant to your research (SPSS, R, Python, etc.)

Would you like me to review a specific part of your research experience?`,

  "publication": `For academic CVs, publications are crucial. Here's how to format them:

1. Use APA 7th edition format consistently
2. List authors exactly as they appear in the publication
3. Include DOI links when available
4. Separate categories for peer-reviewed articles, book chapters, and conference proceedings
5. Bold your name in the author list to highlight your contributions

Do you have any publications to add to your CV?`,

  "education": `For the education section:

1. List degrees in reverse chronological order (most recent first)
2. Include GPA if it's above 3.5
3. Highlight relevant coursework that demonstrates expertise for your target program
4. Include any academic honors or scholarships
5. If you have a thesis, include the title and a brief description

What specific program are you targeting with this resume?`,

  "format": `For APA format in academic CVs:

1. Use a clean, professional font (Times New Roman, Arial, or Calibri)
2. Keep consistent 1-inch margins
3. Use section headers in bold with clear hierarchy
4. Maintain reverse chronological order within sections
5. Include page numbers for multiple pages
6. Use bullet points for clarity in experience descriptions

Would you like me to review your current formatting?`,

  "default": `I'm happy to help with your resume! I can offer advice on:

- Formatting for academic applications
- Highlighting relevant research experience
- Structuring your education section
- Incorporating publications and presentations
- Technical and research skills presentation

What aspect of your resume would you like to improve?`
};

export default function MentorChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");

    // Simulate mentor typing
    setIsTyping(true);

    // Generate response based on keywords
    setTimeout(() => {
      let responseContent = mockResponses.default;

      // Check for keywords in the message
      const lowerCaseMessage = newMessage.toLowerCase();
      if (lowerCaseMessage.includes("research")) {
        responseContent = mockResponses.research;
      } else if (
        lowerCaseMessage.includes("publication") ||
        lowerCaseMessage.includes("publish")
      ) {
        responseContent = mockResponses.publication;
      } else if (
        lowerCaseMessage.includes("education") ||
        lowerCaseMessage.includes("degree") ||
        lowerCaseMessage.includes("gpa")
      ) {
        responseContent = mockResponses.education;
      } else if (
        lowerCaseMessage.includes("format") ||
        lowerCaseMessage.includes("apa") ||
        lowerCaseMessage.includes("style")
      ) {
        responseContent = mockResponses.format;
      }

      // Add mentor response
      const mentorMessage: Message = {
        id: Date.now().toString(),
        content: responseContent,
        sender: "mentor",
        timestamp: new Date(),
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, mentorMessage]);
    }, 1500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 max-w-[80%] ${
              message.sender === "user" ? "ml-auto" : ""
            }`}
          >
            <div
              className={`p-3 rounded-lg ${
                message.sender === "user"
                  ? "bg-gray-100"
                  : "bg-blue-50"
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {message.sender === "user" ? "You" : "PhD Mentor"},{" "}
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="mb-4 max-w-[80%]">
            <div className="flex items-center p-3 rounded-lg bg-blue-50">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            placeholder="Ask your PhD mentor..."
            className="w-full border rounded-full py-3 px-4 pr-12"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full"
          >
            <Send size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}