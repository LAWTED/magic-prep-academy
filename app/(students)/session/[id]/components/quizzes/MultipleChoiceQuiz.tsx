"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, ArrowLeft, HelpCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

interface MultipleChoiceQuizProps {
  data: {
    title: string;
    instruction: string;
    questions: {
      id: string;
      text: string;
      options: {
        id: string;
        text: string;
      }[];
      correctAnswer: string;
      explanation: string;
    }[];
  };
  onComplete: () => void;
}

export default function MultipleChoiceQuiz({
  data,
  onComplete,
}: MultipleChoiceQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    explanation: string;
  } | null>(null);
  const [completed, setCompleted] = useState(false);

  const currentQuestion = data.questions[currentQuestionIndex];

  const handleSelectOption = (optionId: string) => {
    if (isChecking || feedback) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const checkAnswer = () => {
    setIsChecking(true);
    const isCorrect =
      answers[currentQuestion.id] === currentQuestion.correctAnswer;

    setFeedback({
      isCorrect,
      explanation: currentQuestion.explanation,
    });

    setTimeout(() => {
      setIsChecking(false);
    }, 500);
  };

  const goToNextQuestion = () => {
    setFeedback(null);

    if (currentQuestionIndex < data.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
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
            width: `${((currentQuestionIndex + 1) / data.questions.length) * 100}%`,
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
            <div className="w-20 h-20 bg-grass/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-grass" />
            </div>
          </motion.div>
          <h2 className="text-xl font-bold mb-2 text-bronze">
            Congratulations!
          </h2>
          <p className="text-black/80 mb-6">
            You've completed this quiz section.
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-3 rounded-xl bg-gold text-bronze font-medium"
          >
            Continue
          </button>
        </div>
      ) : (
        <>
          {/* Question */}
          <div className="bg-sand rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4 text-bronze">
              {currentQuestion.text}
            </h3>
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <motion.button
                  key={option.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectOption(option.id)}
                  className={`w-full p-4 rounded-lg border-2 text-left flex justify-between items-center ${
                    answers[currentQuestion.id] === option.id
                      ? "border-skyblue bg-skyblue/10"
                      : "border-cement"
                  } ${
                    feedback && option.id === currentQuestion.correctAnswer
                      ? "border-grass bg-grass/10"
                      : feedback &&
                          answers[currentQuestion.id] === option.id &&
                          option.id !== currentQuestion.correctAnswer
                        ? "border-red bg-red/10"
                        : ""
                  }`}
                  disabled={!!feedback}
                >
                  <span className="text-black/80">{option.text}</span>
                  {feedback && option.id === currentQuestion.correctAnswer && (
                    <Check className="w-5 h-5 text-grass" />
                  )}
                  {feedback &&
                    answers[currentQuestion.id] === option.id &&
                    option.id !== currentQuestion.correctAnswer && (
                      <X className="w-5 h-5 text-red" />
                    )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg mb-6 bg-sand`}
            >
              <div className="flex items-start">
                {feedback.isCorrect ? (
                  <Check className="w-5 h-5 text-grass mr-2 mt-1 flex-shrink-0" />
                ) : (
                  <X className="w-5 h-5 text-tomato mr-2 mt-1 flex-shrink-0" />
                )}
                <div>
                  <p
                    className={`font-medium ${
                      feedback.isCorrect ? "text-grass" : "text-red"
                    }`}
                  >
                    {feedback.isCorrect ? "Correct!" : "Incorrect"}
                  </p>
                  <p
                    className={
                      feedback.isCorrect ? "text-grass" : "text-red"
                    }
                  >
                    {feedback.explanation}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <div></div>
            <div>
              {!feedback ? (
                <button
                  onClick={checkAnswer}
                  disabled={!answers[currentQuestion.id]}
                  className={`px-6 py-3 rounded-xl ${
                    answers[currentQuestion.id]
                      ? "bg-gold text-bronze"
                      : "bg-sand text-cement"
                  } font-medium`}
                >
                  Check
                </button>
              ) : (
                <button
                  onClick={goToNextQuestion}
                  className="px-6 py-3 rounded-xl bg-gold text-bronze font-medium"
                >
                  {currentQuestionIndex < data.questions.length - 1
                    ? "Next"
                    : "Finish"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
