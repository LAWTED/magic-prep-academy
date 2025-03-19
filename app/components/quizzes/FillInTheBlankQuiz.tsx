"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, ArrowLeft, HelpCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

interface FillInTheBlankQuizProps {
  data: {
    title: string;
    instruction: string;
    questions: {
      id: string;
      text: string;
      answer: string;
      hint: string;
    }[];
  };
}

export default function FillInTheBlankQuiz({ data }: FillInTheBlankQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
  } | null>(null);
  const [completed, setCompleted] = useState(false);

  const currentQuestion = data.questions[currentQuestionIndex];

  // Split text to identify where the blank is
  const textParts = currentQuestion?.text.split("_______");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isChecking || feedback) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: e.target.value,
    }));
  };

  const checkAnswer = () => {
    setIsChecking(true);

    // Simple check - could be enhanced with more sophisticated matching
    const userAnswer = answers[currentQuestion.id]?.trim().toLowerCase() || "";
    const correctAnswer = currentQuestion.answer.toLowerCase();
    const isCorrect = userAnswer === correctAnswer;

    setFeedback({
      isCorrect,
      correctAnswer: currentQuestion.answer,
    });

    setTimeout(() => {
      setIsChecking(false);
    }, 500);
  };

  const goToNextQuestion = () => {
    setFeedback(null);
    setShowHint(false);

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
          <Link href="/homepage">
            <button className="px-6 py-3 rounded-xl bg-primary text-white font-medium">
              Back to Learning Map
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Question */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="text-lg mb-6">
              {textParts.length > 0 && (
                <div className="flex flex-wrap items-center">
                  <span>{textParts[0]}</span>
                  <div className="mx-2 my-2 min-w-[150px] border-b-2 border-primary">
                    <input
                      type="text"
                      value={answers[currentQuestion.id] || ""}
                      onChange={handleInputChange}
                      className={`w-full bg-transparent px-2 py-1 outline-none ${
                        feedback
                          ? feedback.isCorrect
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                          : ""
                      }`}
                      placeholder="Your answer"
                      disabled={!!feedback}
                    />
                  </div>
                  {textParts.length > 1 && <span>{textParts[1]}</span>}
                </div>
              )}
            </div>

            {/* Hint button */}
            <div className="mb-2">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-primary flex items-center text-sm"
                disabled={!!feedback}
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                {showHint ? "Hide hint" : "Show hint"}
              </button>
            </div>

            {/* Hint content */}
            {showHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 bg-blue-50 rounded-lg text-blue-700 text-sm"
              >
                <p>{currentQuestion.hint}</p>
              </motion.div>
            )}
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
                  {!feedback.isCorrect && (
                    <p className="text-red-700">
                      Correct answer: {feedback.correctAnswer}
                    </p>
                  )}
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