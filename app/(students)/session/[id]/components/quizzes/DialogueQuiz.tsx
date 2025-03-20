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

    // Check if this was the last question to be answered
    const newFeedback = { ...feedback, [id]: isCorrect };
    const allAnswered = dialogueWithBlanks.every(
      (item) => item.blank && item.blank.id in newFeedback
    );

    if (allAnswered) {
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
          className="inline-flex items-center text-primary mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
        </button>
        <h1 className="text-2xl font-bold">{data.title}</h1>
        <p className="text-gray-600 mt-2">{data.instruction}</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-primary h-2 rounded-full"
          style={{
            width: `${
              (Object.keys(feedback).length / dialogueWithBlanks.length) * 100
            }%`,
          }}
        ></div>
      </div>

      {completed ? (
        <div className="text-center py-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-600" />
            </div>
          </motion.div>
          <h2 className="text-xl font-bold mb-2">Dialogue Completed!</h2>
          <p className="text-gray-600 mb-6">
            You've successfully completed this dialogue exercise.
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-3 rounded-xl bg-primary text-white font-medium"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="space-y-6">
            {data.dialogue.map((item, index) => {
              // Split text to handle blanks
              const parts = item.blank ? item.text.split("_______") : null;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${
                    item.speaker === "小李"
                      ? "ml-auto bg-primary/10 text-gray-800"
                      : "mr-auto bg-gray-100 text-gray-800"
                  } max-w-[85%] p-4 rounded-xl`}
                >
                  <div className="font-medium mb-2">{item.speaker}</div>

                  {item.blank ? (
                    <div>
                      <div className="flex flex-wrap items-center">
                        {parts?.[0]}
                        <div className="mx-1 my-1 border-b-2 border-primary inline-block min-w-[120px]">
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
                                  ? "text-green-600 font-medium"
                                  : "text-red-600 font-medium"
                                : ""
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
                          className={`mt-2 p-2 rounded-lg text-sm ${
                            feedback[item.blank.id]
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
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
                                <span>Incorrect</span>
                              </div>
                              <div className="mt-1">
                                Correct answer: {item.blank.answer}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hint and Check button */}
                      {feedback[item.blank.id] === undefined && (
                        <div className="mt-3 flex justify-between items-center">
                          <button
                            onClick={() => toggleHint(item.blank?.id || "")}
                            className="text-primary flex items-center text-xs"
                          >
                            <HelpCircle className="w-3 h-3 mr-1" />
                            {showHint[item.blank?.id || ""]
                              ? "Hide hint"
                              : "Show hint"}
                          </button>

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
                            className={`px-4 py-1 rounded-lg text-xs font-medium ${
                              answers[item.blank?.id || ""]
                                ? "bg-primary text-white"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {isChecking ? "Checking..." : "Check"}
                          </button>
                        </div>
                      )}

                      {/* Hint content */}
                      {showHint[item.blank?.id || ""] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-2 p-2 bg-blue-50 rounded-lg text-blue-700 text-xs"
                        >
                          <p>{item.blank.hint}</p>
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
        </div>
      )}
    </div>
  );
}
