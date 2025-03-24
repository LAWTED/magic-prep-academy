/**
 * Utility for parsing and cleaning JSON from AI-generated responses
 */

/**
 * Parses a JSON string from an AI response with error handling and cleanup
 * @param jsonText The text containing JSON from an API response
 * @param validateFn Optional function to validate the parsed JSON structure
 * @returns The parsed and validated JSON object, or throws an error
 */
export function parseAIGeneratedJson<T>(
  jsonText: string,
  validateFn?: (parsed: any) => boolean
): T {
  if (!jsonText) {
    throw new Error("Empty response from API");
  }

  // Try different patterns to extract JSON
  const jsonRegexPatterns = [
    /```json\n([\s\S]*?)\n```/, // Standard JSON code block with json tag
    /```\n([\s\S]*?)\n```/, // Code block without language
    /\[\s*\{[\s\S]*\}\s*\]/, // Direct JSON array
    /\{[\s\S]*"title"[\s\S]*\}/, // Direct JSON object with title
    /\{[\s\S]*\}/, // Any JSON object
  ];

  let cleanJson = "";
  for (const pattern of jsonRegexPatterns) {
    const match = jsonText.match(pattern);
    if (match && match[1]) {
      cleanJson = match[1].trim();
      break;
    } else if (match) {
      cleanJson = match[0].trim();
      break;
    }
  }

  // If no pattern matched, use the whole response as a last resort
  if (!cleanJson) {
    cleanJson = jsonText.trim();
  }

  // Additional cleanup for common issues
  cleanJson = cleanJson
    .replace(/^```json/, "") // Remove leading ```json
    .replace(/^```/, "") // Remove leading ```
    .replace(/```$/, "") // Remove trailing ```
    .trim();

  // Parse the JSON
  const parsedJson = JSON.parse(cleanJson) as T;

  // If validation function is provided, use it
  if (validateFn && !validateFn(parsedJson)) {
    throw new Error("Invalid JSON structure: validation failed");
  }

  return parsedJson;
}

/**
 * Type for validator names
 */
export type ValidatorName =
  | "multipleChoice"
  | "fillInTheBlank"
  | "dialogue"
  | "matching"
  | "eligibilityResults"
  | "moduleMetadata"
  | "resumeContentAnalysis"
  | "resumeAnalysis"
  | "apaResume"
  | "sopExtract"
  | "sopContentAnalysis"
  | "aiFeedback";

/**
 * Common JSON validation functions
 */
export const validators = {
  /**
   * Validates multiple choice quiz JSON structure
   */
  multipleChoice: (json: any): boolean => {
    return (
      json &&
      typeof json === "object" &&
      typeof json.title === "string" &&
      Array.isArray(json.questions) &&
      json.questions.length > 0
    );
  },

  /**
   * Validates fill in the blank JSON structure
   */
  fillInTheBlank: (json: any): boolean => {
    return (
      json &&
      typeof json === "object" &&
      typeof json.title === "string" &&
      Array.isArray(json.questions) &&
      json.questions.length > 0
    );
  },

  /**
   * Validates dialogue JSON structure
   */
  dialogue: (json: any): boolean => {
    return (
      json &&
      typeof json === "object" &&
      typeof json.title === "string" &&
      Array.isArray(json.dialogue) &&
      json.dialogue.length > 0
    );
  },

  /**
   * Validates matching JSON structure
   */
  matching: (json: any): boolean => {
    return (
      json &&
      typeof json === "object" &&
      typeof json.title === "string" &&
      Array.isArray(json.rows) &&
      json.rows.length > 0 &&
      Array.isArray(json.concepts) &&
      json.concepts.length > 0
    );
  },

  /**
   * Validates eligibility results JSON structure
   */
  eligibilityResults: (json: any): boolean => {
    return (
      Array.isArray(json) &&
      json.length > 0 &&
      json.every(
        (item) =>
          item &&
          typeof item === "object" &&
          typeof item.label === "string" &&
          typeof item.status === "string" &&
          typeof item.explain === "string"
      )
    );
  },

  /**
   * Validates module metadata JSON structure
   */
  moduleMetadata: (json: any): boolean => {
    return (
      json &&
      typeof json === "object" &&
      typeof json.title === "string" &&
      typeof json.summary === "string"
    );
  },

  /**
   * Validates resume analysis JSON structure for content analysis
   */
  resumeContentAnalysis: (json: any): boolean => {
    return (
      json &&
      typeof json === "object" &&
      json.scores &&
      typeof json.scores === "object" &&
      json.scores.content &&
      typeof json.scores.content === "object" &&
      typeof json.scores.content.score === "number" &&
      typeof json.scores.content.feedback === "string" &&
      json.scores.quality &&
      typeof json.scores.quality === "object" &&
      typeof json.scores.quality.score === "number" &&
      typeof json.scores.quality.feedback === "string" &&
      json.scores.impact &&
      typeof json.scores.impact === "object" &&
      typeof json.scores.impact.score === "number" &&
      typeof json.scores.impact.feedback === "string" &&
      json.scores.clarity &&
      typeof json.scores.clarity === "object" &&
      typeof json.scores.clarity.score === "number" &&
      typeof json.scores.clarity.feedback === "string" &&
      typeof json.overallScore === "number" &&
      typeof json.overallFeedback === "string" &&
      Array.isArray(json.actionableSteps) &&
      json.actionableSteps.length > 0 &&
      json.actionableSteps.every((item: any) => typeof item === "string")
    );
  },

  /**
   * Validates resume analysis JSON structure
   */
  resumeAnalysis: (json: any): boolean => {
    return (
      json &&
      typeof json === "object" &&
      json.score &&
      typeof json.score === "object" &&
      typeof json.score.completeness === "number" &&
      typeof json.score.academicJargon === "number" &&
      typeof json.score.structure === "number" &&
      typeof json.score.relevance === "number" &&
      typeof json.score.total === "number" &&
      Array.isArray(json.feedback) &&
      json.feedback.length > 0 &&
      json.feedback.every((item: any) => typeof item === "string")
    );
  },

  /**
   * Validates APA formatted resume JSON structure - extremely simplified version
   */
  apaResume: (json: any): boolean => {
    // Only check if json is an object with personalInfo
    return (
      json &&
      typeof json === "object" &&
      json.personalInfo &&
      typeof json.personalInfo === "object" &&
      typeof json.personalInfo.name === "string"
    );
  },

  /**
   * Validates SOP extract JSON structure - simple format with text content
   */
  sopExtract: (json: any): boolean => {
    return (
      json &&
      typeof json === "object" &&
      typeof json.content === "string" &&
      json.content.length > 0
    );
  },

  /**
   * Validates SOP analysis JSON structure for content analysis
   */
  sopContentAnalysis: (json: any): boolean => {
    return (
      json &&
      typeof json === "object" &&
      json.scores &&
      typeof json.scores === "object" &&
      json.scores.clarity &&
      typeof json.scores.clarity === "object" &&
      typeof json.scores.clarity.score === "number" &&
      typeof json.scores.clarity.feedback === "string" &&
      json.scores.motivation &&
      typeof json.scores.motivation === "object" &&
      typeof json.scores.motivation.score === "number" &&
      typeof json.scores.motivation.feedback === "string" &&
      json.scores.relevance &&
      typeof json.scores.relevance === "object" &&
      typeof json.scores.relevance.score === "number" &&
      typeof json.scores.relevance.feedback === "string" &&
      json.scores.writing &&
      typeof json.scores.writing === "object" &&
      typeof json.scores.writing.score === "number" &&
      typeof json.scores.writing.feedback === "string" &&
      typeof json.overallScore === "number" &&
      typeof json.overallFeedback === "string" &&
      Array.isArray(json.actionableSteps) &&
      json.actionableSteps.length > 0 &&
      json.actionableSteps.every((item: any) => typeof item === "string")
    );
  },

  /**
   * Validates AI feedback JSON structure
   */
  aiFeedback: (json: any): boolean => {
    // Check if json is an array
    if (!Array.isArray(json)) return false;

    // Make sure there's at least one item
    if (json.length === 0) return false;

    // Check each feedback item has the required properties
    return json.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.text === "string" &&
        typeof item.selectedText === "string" &&
        (typeof item.timestamp === "string" || item.timestamp instanceof Date) &&
        (item.type === "comment" || item.type === "suggestion") &&
        (!item.mentorId || typeof item.mentorId === "string")
    );
  },
};
