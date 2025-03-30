"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, ArrowLeft, HelpCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

interface DialogueQuizProps {
  data: {
    title: string;
    instruction: string;
    dialogue: {
      speaker: string;
      text: string;
      blank?: {
        id: string;
        answer: string;
        hint: string;
      };
    }[];
  };
  onComplete: () => void;
}

export default function DialogueQuiz({ data, onComplete }: DialogueQuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(false);

  // Get unique speakers using a different method to avoid Set iteration issues
  const speakersMap: Record<string, boolean> = {};
  data.dialogue.forEach((item) => {
    speakersMap[item.speaker] = true;
  });
  const speakers = Object.keys(speakersMap);

  // Consider the first unique speaker as the user/primary speaker
  const primarySpeaker = speakers.length > 0 ? speakers[0] : "";

  // Filter dialogue items to get only those with blanks
  const dialogueWithBlanks = data.dialogue.filter((item) => item.blank);

  // Calculate current blank to show
  const currentBlankIndex = dialogueWithBlanks.findIndex(
    (item, index) => !feedback[item.blank?.id || ""]
  );

  const handleInputChange = (id: string, value: string) => {
    if (isChecking || feedback[id]) return;

    setAnswers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const toggleHint = (id: string) => {
    setShowHint((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const checkAnswer = (id: string, correctAnswer: string) => {
    setIsChecking(true);

    // Simple check - could be enhanced with more sophisticated matching
    const userAnswer = answers[id]?.trim().toLowerCase() || "";
    const isCorrect = userAnswer === correctAnswer.toLowerCase();

    setFeedback((prev) => ({
      ...prev,
      [id]: isCorrect,
    }));

    // Check if this was the last question to be answetomato
    const newFeedback = { ...feedback, [id]: isCorrect };
    const allAnswetomato = dialogueWithBlanks.every(
      (item) => item.blank && item.blank.id in newFeedback
    );

    if (allAnswetomato) {
      setTimeout(() => {
        setCompleted(true);
      }, 1000);
    }

    setTimeout(() => {
      setIsChecking(false);
    }, 500);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center text-bronze mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
        </button>
        <h1 className="text-2xl font-bold text-bronze">{data.title}</h1>
        <p className="text-black/80 mt-2">{data.instruction}</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-bronze rounded-full h-2 mb-6">
        <div
          className="bg-lime h-2 rounded-full"
          style={{
            width: `${
              (Object.keys(feedback).length / dialogueWithBlanks.length) * 100
            }%`,
          }}
        ></div>
      </div>

      {completed ? (
        <div className="text-center py-8 bg-sand rounded-xl p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6"
          >
            <div className="w-20 h-20 bg-lime rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <h2 className="text-xl font-bold mb-2 text-bronze">
            Dialogue Completed!
          </h2>
          <p className="text-black/80 mb-6">
            You've successfully completed this dialogue exercise.
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-3 rounded-xl bg-gold text-bronze font-medium"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {data.dialogue.map((item, index) => {
            // Split text to handle blanks
            const parts = item.blank ? item.text.split("_______") : null;
            // Determine if this is the primary speaker (user)
            const isPrimarySpeaker = item.speaker === primarySpeaker;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${
                  isPrimarySpeaker
                    ? "ml-auto bg-sand text-black/80"
                    : "mr-auto bg-sand text-black/80"
                } max-w-[85%] p-4 rounded-xl ${isPrimarySpeaker ? "rounded-tr-sm" : "rounded-tl-sm"}`}
              >
                <div className="font-medium mb-2 text-bronze">
                  {item.speaker}
                </div>

                {item.blank ? (
                  <div>
                    <div className="flex flex-wrap items-center">
                      {parts?.[0]}
                      <div className="mx-1 my-1 border-b-2 border-bronze inline-block min-w-[120px]">
                        <input
                          type="text"
                          value={answers[item.blank.id] || ""}
                          onChange={(e) =>
                            handleInputChange(
                              item.blank?.id || "",
                              e.target.value
                            )
                          }
                          className={`bg-transparent px-2 py-1 outline-none w-full ${
                            feedback[item.blank.id] !== undefined
                              ? feedback[item.blank.id]
                                ? "text-grass font-medium"
                                : "text-tomato font-medium"
                              : "text-black/80"
                          }`}
                          placeholder="Enter your answer"
                          disabled={feedback[item.blank.id] !== undefined}
                        />
                      </div>
                      {parts?.[1]}
                    </div>

                    {/* Feedback */}
                    {feedback[item.blank.id] !== undefined && (
                      <div
                        className={`mt-2 p-2 rounded-lg text-sm bg-gold/10 ${
                          feedback[item.blank.id] ? "text-grass " : "text-tomato"
                        }`}
                      >
                        {feedback[item.blank.id] ? (
                          <div className="flex items-center">
                            <Check className="w-4 h-4 mr-1" />
                            <span>Correct!</span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center">
                              <X className="w-4 h-4 mr-1" />
                              <span>Incorrect. The correct answer is:</span>
                            </div>
                            <div className="font-medium mt-1">
                              {item.blank.answer}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-2 flex justify-between items-center">
                      <button
                        onClick={() => toggleHint(item.blank?.id || "")}
                        className="text-bronze text-sm flex items-center"
                      >
                        <HelpCircle className="w-3 h-3 mr-1" />
                        {showHint[item.blank?.id || ""]
                          ? "Hide hint"
                          : "Show hint"}
                      </button>

                      {!feedback[item.blank?.id || ""] && (
                        <button
                          onClick={() =>
                            checkAnswer(
                              item.blank?.id || "",
                              item.blank?.answer || ""
                            )
                          }
                          disabled={
                            !answers[item.blank?.id || ""] || isChecking
                          }
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            !answers[item.blank?.id || ""] || isChecking
                              ? "bg-cement text-white/70"
                              : "bg-gold text-bronze"
                          }`}
                        >
                          Check
                        </button>
                      )}
                    </div>

                    {/* Hint */}
                    {showHint[item.blank?.id || ""] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-2 p-2 bg-gold/10 rounded-lg text-sm text-bronze"
                      >
                        <p>{item.blank?.hint}</p>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div>{item.text}</div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
