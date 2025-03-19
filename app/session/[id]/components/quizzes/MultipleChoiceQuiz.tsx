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

export default function MultipleChoiceQuiz({ data, onComplete }: MultipleChoiceQuizProps) {
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
    const isCorrect = answers[currentQuestion.id] === currentQuestion.correctAnswer;

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
        <Link href="/homepage" className="inline-flex items-center text-primary mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span>Back to Learning Map</span>
        </Link>
        <h1 className="text-2xl font-bold">{data.title}</h1>
        <p className="text-gray-600 mt-2">{data.instruction}</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-primary h-2 rounded-full"
          style={{
            width: `${((currentQuestionIndex + 1) / data.questions.length) * 100}%`,
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
          <h2 className="text-xl font-bold mb-2">Congratulations!</h2>
          <p className="text-gray-600 mb-6">You've completed this quiz section.</p>
          <button
            onClick={onComplete}
            className="px-6 py-3 rounded-xl bg-primary text-white font-medium"
          >
            Continue
          </button>
        </div>
      ) : (
        <>
          {/* Question */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">{currentQuestion.text}</h3>
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <motion.button
                  key={option.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectOption(option.id)}
                  className={`w-full p-4 rounded-lg border-2 text-left flex justify-between items-center ${
                    answers[currentQuestion.id] === option.id
                      ? "border-primary bg-primary/10"
                      : "border-gray-200"
                  } ${
                    feedback &&
                    option.id === currentQuestion.correctAnswer
                      ? "border-green-500 bg-green-50"
                      : feedback &&
                        answers[currentQuestion.id] === option.id &&
                        option.id !== currentQuestion.correctAnswer
                      ? "border-red-500 bg-red-50"
                      : ""
                  }`}
                  disabled={!!feedback}
                >
                  <span>{option.text}</span>
                  {feedback && option.id === currentQuestion.correctAnswer && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}
                  {feedback &&
                    answers[currentQuestion.id] === option.id &&
                    option.id !== currentQuestion.correctAnswer && (
                      <X className="w-5 h-5 text-red-600" />
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
              className={`p-4 rounded-lg mb-6 ${
                feedback.isCorrect ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <div className="flex items-start">
                {feedback.isCorrect ? (
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
                ) : (
                  <X className="w-5 h-5 text-red-600 mr-2 mt-1 flex-shrink-0" />
                )}
                <div>
                  <p
                    className={`font-medium ${
                      feedback.isCorrect ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {feedback.isCorrect
                      ? "Correct!"
                      : "Incorrect"}
                  </p>
                  <p
                    className={
                      feedback.isCorrect ? "text-green-700" : "text-red-700"
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
            {feedback ? (
              <button
                onClick={goToNextQuestion}
                className="px-6 py-3 rounded-xl bg-primary text-white font-medium flex items-center"
              >
                {currentQuestionIndex < data.questions.length - 1
                  ? "Next Question"
                  : "Finish Quiz"}
                <ChevronRight className="ml-1 w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={checkAnswer}
                disabled={!answers[currentQuestion.id] || isChecking}
                className={`px-6 py-3 rounded-xl font-medium ${
                  answers[currentQuestion.id]
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isChecking ? "Checking..." : "Check Answer"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}