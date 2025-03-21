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
};