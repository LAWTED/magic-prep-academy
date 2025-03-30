import { RefreshCw, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChatPerson } from "@/app/(students)/chat/components/types";

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
};

export function ChatInput({
  onSendMessage,
  isDisabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Adjust textarea height based on content
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isDisabled) return;

    onSendMessage(inputValue);
    setInputValue("");

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  return (
    <div className="px-4 py-2">
      <div className="flex border rounded-xl overflow-hidden">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-3 resize-none focus:outline-none text-sm md:text-base border-none"
            rows={1}
            style={{ maxHeight: "120px" }}
          />
        </div>
        <div className="pr-2 flex items-end pb-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isDisabled}
            className={`rounded-full p-2 ${
              inputValue.trim() && !isDisabled
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {isDisabled ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
