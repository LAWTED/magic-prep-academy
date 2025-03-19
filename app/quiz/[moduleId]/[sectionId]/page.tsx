"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QUIZ_TYPES } from "@/app/config/const";
import { courseDetails } from "@/app/config/courseContent";
import MatchingQuiz from "@/app/components/quizzes/MatchingQuiz";
import MultipleChoiceQuiz from "@/app/components/quizzes/MultipleChoiceQuiz";
import FillInTheBlankQuiz from "@/app/components/quizzes/FillInTheBlankQuiz";
import DialogueQuiz from "@/app/components/quizzes/DialogueQuiz";
import Loading from "@/app/components/Loading";

export default function QuizPage() {
  const params = useParams();
  const [quizData, setQuizData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.sectionId) {
      const sectionId = Array.isArray(params.sectionId)
        ? params.sectionId[0]
        : params.sectionId;

      const quizContent = courseDetails.find(
        (detail) => detail.id === sectionId
      );

      if (quizContent) {
        setQuizData(quizContent);
      }
      setLoading(false);
    }
  }, [params]);

  if (loading) {
    return <Loading />;
  }

  if (!quizData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-bold text-red-500">Quiz not found</h2>
        <p className="text-gray-600">The requested quiz content could not be found.</p>
      </div>
    );
  }

  // Render the appropriate quiz component based on the quiz type
  switch (quizData.type) {
    case QUIZ_TYPES.MATCHING:
      return <MatchingQuiz data={quizData.content} />;
    case QUIZ_TYPES.MULTIPLE_CHOICE:
      return <MultipleChoiceQuiz data={quizData.content} />;
    case QUIZ_TYPES.FILL_IN_THE_BLANK:
      return <FillInTheBlankQuiz data={quizData.content} />;
    case QUIZ_TYPES.DIALOGUE:
      return <DialogueQuiz data={quizData.content} />;
    default:
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-xl font-bold text-red-500">Unsupported quiz type</h2>
          <p className="text-gray-600">This quiz type is not supported yet.</p>
        </div>
      );
  }
}