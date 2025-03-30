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
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-6 "
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="mb-6"
      >
        {selectedPerson.avatar ? (
          <div className="w-20 h-20 overflow-hidden rounded-full border-2 border-gold">
            <Image
              src={selectedPerson.avatar}
              alt={selectedPerson.name}
              width={80}
              height={80}
              className="object-cover"
            />
          </div>
        ) : (
          <div className={`p-5 rounded-full bg-sand`}>
            <selectedPerson.icon size={40} className="text-bronze" />
          </div>
        )}
      </motion.div>

      <h1 className="text-2xl font-bold mb-3 text-bronze">
        Chat with {selectedPerson.name}
      </h1>

      <p className="text-bronze/80 max-w-md text-center mb-6 bg-sand p-4 rounded-xl">
        {welcomeMessage}
      </p>

      <div className="text-sm text-bronze/70 max-w-md">
        <p>Send a message to start the conversation...</p>
      </div>
    </motion.div>
  );
}