import { RefreshCw, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChatPerson } from "./types";

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
};

export function ChatInput({ onSendMessage, isDisabled = false, placeholder = "Type a message..." }: ChatInputProps) {
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
    <div className="relative">
      <textarea
        ref={inputRef}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          adjustTextareaHeight();
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full border rounded-xl pl-4 pr-12 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base"
        rows={1}
        style={{ maxHeight: "120px" }}
      />
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleSendMessage}
        disabled={!inputValue.trim() || isDisabled}
        className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 ${
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
  );
}