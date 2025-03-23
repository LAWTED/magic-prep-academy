import { motion } from "framer-motion";
import { ChatPerson } from "./types";

type TypingIndicatorProps = {
  selectedPerson: ChatPerson;
  dots: string;
};

// Animation variants for typing
const typingVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export function TypingIndicator({ selectedPerson, dots }: TypingIndicatorProps) {
  return (
    <motion.div
      variants={typingVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex justify-center my-2"
    >
      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
        {selectedPerson.name} is typing{dots}
      </span>
    </motion.div>
  );
}