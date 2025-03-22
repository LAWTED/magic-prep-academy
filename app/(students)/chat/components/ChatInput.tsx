import { RefreshCw, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChatPerson } from "./types";

type ChatInputProps = {
  selectedPerson: ChatPerson;
  isStreaming: boolean;
  onSendMessage: (message: string) => void;
};

export function ChatInput({ selectedPerson, isStreaming, onSendMessage }: ChatInputProps) {
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
    if (!inputValue.trim() || isStreaming) return;

    onSendMessage(inputValue);
    setInputValue("");

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="border-t p-4 safe-bottom"
    >
      <div className="relative">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            adjustTextareaHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Ask ${selectedPerson.name} a question...`}
          className="w-full border rounded-xl pl-4 pr-12 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base"
          rows={1}
          style={{ maxHeight: "120px" }}
        />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isStreaming}
          className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 ${
            inputValue.trim() && !isStreaming
              ? "bg-primary text-white"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          {isStreaming ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}