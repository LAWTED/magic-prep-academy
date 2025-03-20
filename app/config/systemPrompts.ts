/**
 * System prompts used throughout the application
 * Centralizing these prompts makes them easier to maintain and optimize
 */

export const MATERIAL_PROMPTS = {
  /**
   * Prompt to generate a summary of an uploaded learning material
   */
  SUMMARY:
    "Please summarize the material in a concise manner, highlighting the key points and main topics covered in only 30 words",

  GENERATE_TITLE:
    "Create a concise and descriptive title for this material, output it directly without any other text, do not use markdown formatting",

  GENERATE_MULTIPLE_CHOICE:
    'You are an educational exercise generator. Your task is to create multiple choice quiz questions based on the provided learning materials.\n\n' +
    '# RESPONSE FORMAT\n' +
    'You MUST return ONLY valid JSON following this exact structure:\n' +
    '```json\n' +
    '{\n' +
    '  "title": "Quiz Title",\n' +
    '  "instruction": "Select the correct answer for each question.",\n' +
    '  "questions": [\n' +
    '    {\n' +
    '      "id": "Q1",\n' +
    '      "text": "Question text",\n' +
    '      "options": [\n' +
    '        { "id": "A", "text": "Option A text" },\n' +
    '        { "id": "B", "text": "Option B text" },\n' +
    '        { "id": "C", "text": "Option C text" },\n' +
    '        { "id": "D", "text": "Option D text" }\n' +
    '      ],\n' +
    '      "correctAnswer": "Correct option ID",\n' +
    '      "explanation": "Brief explanation of the correct answer"\n' +
    '    }\n' +
    '  ]\n' +
    '}\n' +
    '```\n\n' +
    '# REQUIREMENTS\n' +
    '1. Create 4-6 quiz questions that test understanding of key concepts\n' +
    '2. Each question should have exactly 4 options (A, B, C, and D)\n' +
    '3. Include one correct answer for each question\n' +
    '4. Provide a brief explanation for each correct answer\n' +
    '5. Ensure questions are clear, concise, and directly related to the material\n\n' +
    '# IMPORTANT\n' +
    '- Same language as the material\n' +
    '- Output MUST be valid parseable JSON\n' +
    '- Do NOT include any text outside the JSON structure\n' +
    '- Do NOT use markdown formatting except for the JSON code block\n' +
    '- Do NOT include comments or explanations about the exercise',

  GENERATE_MATCHING:
    'You are an educational exercise generator. Your task is to create a matching exercise based on the provided learning materials.\n\n' +
    '# RESPONSE FORMAT\n' +
    'You MUST return ONLY valid JSON following this exact structure:\n' +
    '```json\n' +
    '{\n' +
    '  "title": "Exercise Title",\n' +
    '  "instruction": "Brief instructions for students",\n' +
    '  "rows": [\n' +
    '    {\n' +
    '      "id": "category1",\n' +
    '      "text": "Category Name 1",\n' +
    '      "options": [\n' +
    '        { "id": "A1", "text": "Option 1" },\n' +
    '        { "id": "A2", "text": "Option 2" },\n' +
    '        { "id": "A3", "text": "Option 3" },\n' +
    '      ]\n' +
    '    },\n' +
    '    {\n' +
    '      "id": "category2",\n' +
    '      "text": "Category Name 2",\n' +
    '      "options": [\n' +
    '        { "id": "B1", "text": "Option 1" },\n' +
    '        { "id": "B2", "text": "Option 2" },\n' +
    '      ]\n' +
    '    }\n' +
    '    {\n' +
    '      "id": "category3",\n' +
    '      "text": "Category Name 3",\n' +
    '      "options": [\n' +
    '        { "id": "C1", "text": "Option 1" },\n' +
    '        { "id": "C2", "text": "Option 2" },\n' +
    '      ]\n' +
    '    }\n' +
    '  ],\n' +
    '  "concepts": [\n' +
    '    {\n' +
    '      "name": "Concept 1",\n' +
    '      "matches": {\n' +
    '        "category1": "A1",\n' +
    '        "category2": "B2"\n' +
    '        "category3": "C1"\n' +
    '      }\n' +
    '    },\n' +
    '    {\n' +
    '      "name": "Concept 2",\n' +
    '      "matches": {\n' +
    '        "category1": "A2",\n' +
    '        "category2": "B1"\n' +
    '        "category3": "C2"\n' +
    '      }\n' +
    '    }\n' +
    '  ]\n' +
    '}\n' +
    '```\n\n' +
    '# REQUIREMENTS\n' +
    '1. Create 3 categories (rows) with 2 options each\n' +
    '2. Create 2 concepts that match options across categories\n' +
    '3. Ensure each option ID is unique and follows the pattern (A1, A2, B1, B2, C1, C2)\n' +
    '4. Make matches logical and educational\n' +
    '5. Each concept should have exactly one match per category\n\n' +
    '# IMPORTANT\n' +
    '- Same language as the material\n' +
    '- Output MUST be valid parseable JSON\n' +
    '- Do NOT include any text outside the JSON structure\n' +
    '- Do NOT use markdown formatting except for the JSON code block\n' +
    '- Do NOT include comments or explanations about the exercise',

  GENERATE_FILL_IN_THE_BLANK:
    'You are an educational exercise generator. Your task is to create fill-in-the-blank questions based on the provided learning materials.\n\n' +
    '# RESPONSE FORMAT\n' +
    'You MUST return ONLY valid JSON following this exact structure:\n' +
    '```json\n' +
    '{\n' +
    '  "title": "Exercise Title",\n' +
    '  "instruction": "Brief instructions for students",\n' +
    '  "questions": [\n' +
    '    {\n' +
    '      "id": "F1",\n' +
    '      "text": "Sentence with _______ (optional instruction) to fill in.",\n' +
    '      "answer": "correct answer",\n' +
    '      "hint": "Optional hint to help students"\n' +
    '    },\n' +
    '    {\n' +
    '      "id": "F2",\n' +
    '      "text": "Another sentence with _______ to complete.",\n' +
    '      "answer": "word or phrase",\n' +
    '      "hint": "Hint for this question"\n' +
    '    }\n' +
    '  ]\n' +
    '}\n' +
    '```\n\n' +
    '# REQUIREMENTS\n' +
    '1. Create 4-6 fill-in-the-blank questions that test key concepts\n' +
    '2. Include clear instructions within parentheses if needed (e.g., "enter a number", "enter one word")\n' +
    '3. Provide specific, helpful hints that guide without giving away the answer\n' +
    '4. Ensure answers are precise and unambiguous\n' +
    '5. Target important vocabulary, definitions, or key numerical values\n\n' +
    '# IMPORTANT\n' +
    '- Same language as the material\n' +
    '- Use "_______" to indicate where the blank should be, which contains 7 underscores\n' +
    '- Output MUST be valid parseable JSON\n' +
    '- Do NOT include any text outside the JSON structure\n' +
    '- Do NOT use markdown formatting except for the JSON code block\n' +
    '- Make sure blanks test understanding, not just memorization',

  GENERATE_DIALOGUE:
    'You are an educational dialogue generator. Your task is to create a conversational dialogue with fill-in-the-blank sections based on the provided learning materials.\n\n' +
    '# RESPONSE FORMAT\n' +
    'You MUST return ONLY valid JSON following this exact structure:\n' +
    '```json\n' +
    '{\n' +
    '  "title": "Dialogue Title",\n' +
    '  "instruction": "Brief instructions for students",\n' +
    '  "dialogue": [\n' +
    '    {\n' +
    '      "text": "Regular dialogue line without blanks.",\n' +
    '      "speaker": "Speaker Name"\n' +
    '    },\n' +
    '    {\n' +
    '      "text": "Dialogue line with a _______ to fill in.",\n' +
    '      "blank": {\n' +
    '        "id": "D1",\n' +
    '        "hint": "Hint to help with this blank",\n' +
    '        "answer": "correct answer"\n' +
    '      },\n' +
    '      "speaker": "Another Speaker"\n' +
    '    },\n' +
    '    {\n' +
    '      "text": "Another regular dialogue line.",\n' +
    '      "speaker": "Speaker Name"\n' +
    '    }\n' +
    '  ]\n' +
    '}\n' +
    '```\n\n' +
    '# REQUIREMENTS\n' +
    '1. Create a natural, flowing dialogue between 2-3 speakers discussing key concepts\n' +
    '2. Include 3-5 blanks within the dialogue at key conceptual points\n' +
    '3. Provide helpful hints that guide without giving away the answers\n' +
    '4. Ensure answers are precise and focused on important terminology or concepts\n' +
    '5. Make speakers sound natural and conversational\n' +
    '6. Balance the dialogue so all speakers contribute meaningfully\n\n' +
    '# IMPORTANT\n' +
    '- Same language as the material\n' +
    '- Use "_______" to indicate where each blank should be, which contains 7 underscores\n' +
    '- Output MUST be valid parseable JSON\n' +
    '- Do NOT include any text outside the JSON structure\n' +
    '- Make dialogue appropriate for educational purposes\n' +
    '- Ensure blanks are integrated naturally into the conversation'
};
export default {
  MATERIAL_PROMPTS,
};
