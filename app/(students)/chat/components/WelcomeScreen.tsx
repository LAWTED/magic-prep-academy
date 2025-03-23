import { motion } from "framer-motion";
import { ChatPerson } from "./types";
import Image from "next/image";

type WelcomeScreenProps = {
  selectedPerson: ChatPerson;
};

// Animation variants for welcome screen
const welcomeVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: 0.2,
    },
  },
};

export function WelcomeScreen({ selectedPerson }: WelcomeScreenProps) {
  // Get welcome message or use default if not defined
  const welcomeMessage = selectedPerson.welcomeMessage ||
    "Feel free to ask me any questions. I'll do my best to provide professional guidance and advice.";

  return (
    <motion.div
      variants={welcomeVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-6"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="mb-6"
      >
        {selectedPerson.avatar ? (
          <div className="w-20 h-20 overflow-hidden rounded-full border-2 border-primary">
            <Image
              src={selectedPerson.avatar}
              alt={selectedPerson.name}
              width={80}
              height={80}
              className="object-cover"
            />
          </div>
        ) : (
          <div className={`p-5 rounded-full ${
            selectedPerson.id === "phd-mentor"
              ? "bg-purple-100"
              : selectedPerson.id === "resume-editor"
                ? "bg-blue-100"
                : "bg-green-100"
          }`}>
            <selectedPerson.icon size={40} className={selectedPerson.color} />
          </div>
        )}
      </motion.div>

      <h1 className="text-2xl font-bold mb-3">
        Chat with {selectedPerson.name}
      </h1>

      <p className="text-gray-500 max-w-md text-center mb-6">
        {welcomeMessage}
      </p>

      <div className="text-sm text-gray-400 max-w-md">
        <p>Send a message to start the conversation...</p>
      </div>
    </motion.div>
  );
}