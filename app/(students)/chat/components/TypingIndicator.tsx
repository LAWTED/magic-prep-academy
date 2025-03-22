import { motion } from "framer-motion";

type TypingIndicatorProps = {
  streamingDots: string;
};

// Animation variants for typing
const typingVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export function TypingIndicator({ streamingDots }: TypingIndicatorProps) {
  return (
    <motion.div
      variants={typingVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex justify-center my-2"
    >
      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
        Generating response{streamingDots}
      </span>
    </motion.div>
  );
}