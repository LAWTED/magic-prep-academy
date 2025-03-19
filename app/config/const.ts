// Quiz types definitions
export type Quiz =
  | "matching"
  | "multipleChoice"
  | "fillInTheBlank"
  | "dialogue";

// Quiz constants to be used as values
export const QUIZ_TYPES = {
  MATCHING: "matching" as Quiz,
  MULTIPLE_CHOICE: "multipleChoice" as Quiz,
  FILL_IN_THE_BLANK: "fillInTheBlank" as Quiz,
  DIALOGUE: "dialogue" as Quiz,
};
