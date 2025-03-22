import { motion } from "framer-motion";
import { ChatPerson } from "./types";

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
  return (
    <motion.div
      variants={welcomeVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-6"
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className={`mb-6 p-5 rounded-full ${
          selectedPerson.id === "phd-mentor"
            ? "bg-purple-100"
            : selectedPerson.id === "resume-editor"
              ? "bg-blue-100"
              : "bg-green-100"
        }`}
      >
        <selectedPerson.icon size={40} className={selectedPerson.color} />
      </motion.div>
      <h1 className="text-2xl font-bold mb-3">
        Chat with {selectedPerson.name}
      </h1>
      <p className="text-gray-500 max-w-md text-center">
        {selectedPerson.id === "phd-mentor" &&
          "Need help with advanced research, graduate school applications, or academic publishing? Ask away!"}
        {selectedPerson.id === "resume-editor" &&
          "Let me help you create a standout resume that showcases your skills and experiences."}
        {selectedPerson.id === "human-teacher" &&
          "有任何学习上的疑问，都可以向我咨询。我会尽力提供专业的指导和建议。"}
      </p>
    </motion.div>
  );
}