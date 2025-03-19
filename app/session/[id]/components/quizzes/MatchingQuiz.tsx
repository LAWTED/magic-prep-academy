"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, ArrowLeft, HelpCircle } from "lucide-react";
import Link from "next/link";

interface MatchingQuizProps {
  data: {
    title: string;
    instruction: string;
    rows: {
      id: string;
      text: string;
      options: {
        id: string;
        text: string;
      }[];
    }[];
    concepts: {
      name: string;
      matches: Record<string, string>;
    }[];
  };
  onComplete: () => void;
}

export default function MatchingQuiz({ data, onComplete }: MatchingQuizProps) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [matchedConcepts, setMatchedConcepts] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });
  const [completed, setCompleted] = useState(false);

  // Get all row IDs needed for a complete match
  const getAllRequiredRows = () => {
    const allRows = new Set<string>();

    // Find the first concept that isn't matched yet
    for (const concept of data.concepts) {
      if (!matchedConcepts.includes(concept.name)) {
        Object.keys(concept.matches).forEach((rowId) => {
          allRows.add(rowId);
        });
        break;
      }
    }

    return Array.from(allRows);
  };

  // Check if all selections form a complete concept match
  const checkConceptMatch = () => {
    // Get all rows that have selections
    const selectedRows = Object.keys(selections);

    // Check if the current selections match any concept that hasn't been matched yet
    for (const concept of data.concepts) {
      // Skip already matched concepts
      if (matchedConcepts.includes(concept.name)) continue;

      // Check if all selections match this concept
      const conceptMatches = concept.matches;
      const conceptRows = Object.keys(conceptMatches);

      // We need selections for all rows in this concept
      if (conceptRows.every((row) => selectedRows.includes(row))) {
        // Check if all selections match the expected values
        const isConceptMatch = conceptRows.every(
          (row) => selections[row] === conceptMatches[row]
        );

        if (isConceptMatch) {
          return concept;
        }
      }
    }

    return null;
  };

  // Auto check matches when user has selected one option from each required row
  useEffect(() => {
    const requiredRows = getAllRequiredRows();
    const selectedRows = Object.keys(selections);

    // Check if user has selected one option from each required row
    if (
      requiredRows.length > 0 &&
      requiredRows.every((row) => selectedRows.includes(row))
    ) {
      handleCheckMatch();
    }
  }, [selections]);

  // Handle option selection
  const handleSelection = (rowId: string, optionId: string) => {
    if (completed) return;

    // Toggle selection for this row
    setSelections((prev) => {
      const newSelections = { ...prev };

      // If this option is already selected, remove it
      if (newSelections[rowId] === optionId) {
        delete newSelections[rowId];
      } else {
        // Otherwise select it
        newSelections[rowId] = optionId;
      }

      return newSelections;
    });
  };

  // Check if match is correct
  const handleCheckMatch = () => {
    // Check if selections form a complete concept match
    const matchedConcept = checkConceptMatch();

    if (matchedConcept) {
      // Add this concept to matched concepts
      setMatchedConcepts((prev) => [...prev, matchedConcept.name]);

      // Show success feedback
      setFeedback({
        type: "success",
        message: "Correct match!",
      });

      // Clear selections
      setSelections({});

      // Hide feedback after a moment
      setTimeout(() => {
        setFeedback({ type: null, message: "" });

        // Check if quiz is complete - only when ALL concepts are matched
        if (matchedConcepts.length === data.concepts.length - 1) {
          setCompleted(true);
        }
      }, 1000);
    } else {
      // Show error feedback
      setFeedback({
        type: "error",
        message: "Not a match. Try again!",
      });

      // Clear selections after error
      setTimeout(() => {
        setSelections({});
        setFeedback({ type: null, message: "" });
      }, 1500);
    }
  };

  // Reset quiz
  const resetQuiz = () => {
    setSelections({});
    setMatchedConcepts([]);
    setFeedback({ type: null, message: "" });
    setCompleted(false);
  };

  // Check if there are any concepts left to match
  const hasRemainingConcepts = matchedConcepts.length < data.concepts.length;

  // Get matched option IDs to filter them out
  const getMatchedOptionIds = () => {
    const matchedOptions: string[] = [];

    for (const conceptName of matchedConcepts) {
      const concept = data.concepts.find((c) => c.name === conceptName);
      if (concept) {
        Object.values(concept.matches).forEach((optionId) => {
          matchedOptions.push(optionId);
        });
      }
    }

    return matchedOptions;
  };

  // Get all remaining options for display
  const getRemainingRowsWithOptions = () => {
    const matchedOptions = getMatchedOptionIds();

    // We need to show all rows, but filter out matched options
    return data.rows
      .map((row) => ({
        ...row,
        filteredOptions: row.options.filter(
          (option) => !matchedOptions.includes(option.id)
        ),
      }))
      .filter((row) => row.filteredOptions.length > 0); // Only show rows with remaining options
  };

  const remainingRowsWithOptions = getRemainingRowsWithOptions();

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

      {/* Progress */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all"
            style={{
              width: `${Math.floor((matchedConcepts.length / data.concepts.length) * 100)}%`,
            }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {matchedConcepts.length} of {data.concepts.length} matches complete
        </p>
      </div>

      {/* Quiz Content */}
      {hasRemainingConcepts && remainingRowsWithOptions.length > 0 ? (
        <div className="space-y-6 mb-8">
          {remainingRowsWithOptions.map((row) => (
            <div key={row.id} className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold mb-3">{row.text}</h3>
              <div className="grid grid-cols-1 gap-3">
                {row.filteredOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelection(row.id, option.id)}
                    className={`p-3 rounded-lg border-2 text-left ${
                      selections[row.id] === option.id
                        ? "border-primary bg-primary/10"
                        : "border-gray-200"
                    }`}
                    disabled={completed}
                  >
                    {option.text}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : !completed ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-xl font-medium">All matches found!</p>
          </div>
        </div>
      ) : (
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
          <p className="text-gray-600 mb-6">
            You've completed this matching exercise.
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-3 rounded-xl bg-primary text-white font-medium"
          >
            Continue
          </button>
        </div>
      )}

      {/* Selected options indicator */}
      {Object.keys(selections).length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-700 mb-2">
            Your selections:
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(selections).map(([rowId, optionId]) => {
              const row = data.rows.find((r) => r.id === rowId);
              const option = row?.options.find((o) => o.id === optionId);
              return (
                <div
                  key={rowId}
                  className="px-2 py-1 bg-white rounded border border-blue-200 text-xs"
                >
                  {row?.text}: {option?.text}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback.type && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg mb-6 ${
            feedback.type === "success" ? "bg-green-100" : "bg-red-100"
          }`}
        >
          <div className="flex items-center">
            {feedback.type === "success" ? (
              <Check className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <X className="w-5 h-5 text-red-600 mr-2" />
            )}
            <p
              className={
                feedback.type === "success" ? "text-green-700" : "text-red-700"
              }
            >
              {feedback.message}
            </p>
          </div>
        </motion.div>
      )}

      {/* Hint */}
      <div className="mb-6">
        <button
          onClick={() => setShowHint(!showHint)}
          className="text-primary flex items-center"
        >
          <HelpCircle className="w-4 h-4 mr-1" />
          {showHint ? "Hide hint" : "Show hint"}
        </button>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-2 p-3 bg-blue-50 rounded-lg text-blue-700"
          >
            <p>
              Select one option from each category. If your combination is
              correct, the options will disappear.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
