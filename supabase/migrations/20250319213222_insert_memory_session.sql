-- Insert session data for the memory module
INSERT INTO public.sessions (
  module_id,
  session_name,
  content
) VALUES (
  '634f89dc-71c2-4aa7-9740-443028f94719', -- 记忆模块的ID
  'Short and Long Term Memory', -- 会话名称
  '{
    "title": "Understanding Memory: Short-term vs Long-term",
    "introduction": {
      "text": "Memory is a critical cognitive process. In this lesson, we will explore how memories are stored in different ways.",
      "image": "/images/memory/intro.jpg"
    },
    "sections": [
      {
        "title": "Short-term Memory",
        "content": "Short-term memory holds information for approximately 20-30 seconds. It has limited capacity, typically holding about 7 (plus or minus 2) items.",
        "examples": [
          "Remembering a phone number just long enough to dial it",
          "Recalling the beginning of a sentence while reading to the end",
          "Remembering what someone just said in a conversation"
        ],
        "image": "/images/memory/short-term.jpg"
      },
      {
        "title": "Long-term Memory",
        "content": "Long-term memory can store information for a lifetime and has virtually unlimited capacity. It requires encoding and consolidation to transfer information from short-term memory.",
        "examples": [
          "Remembering your childhood home",
          "Recalling how to ride a bicycle even after years",
          "Knowing historical facts you learned in school"
        ],
        "image": "/images/memory/long-term.jpg"
      }
    ],
    "practice": {
      "questions": [
        {
          "id": "q1",
          "text": "Which memory system has limited capacity?",
          "options": [
            "Short-term memory",
            "Long-term memory",
            "Sensory memory",
            "Implicit memory"
          ],
          "correctAnswer": 0,
          "explanation": "Short-term memory has a limited capacity of approximately 7±2 items."
        },
        {
          "id": "q2",
          "text": "How does information typically move from short-term to long-term memory?",
          "options": [
            "Through repetition and rehearsal",
            "Through forgetting and relearning",
            "Automatically after a fixed time period",
            "It cannot move between these systems"
          ],
          "correctAnswer": 0,
          "explanation": "Repetition, rehearsal, and meaningful encoding help transfer information from short-term to long-term memory."
        }
      ]
    },
    "summary": "Memory operates on multiple levels. Short-term memory is brief and limited, while long-term memory is vast and potentially permanent. Understanding how memory works helps us develop better strategies for learning and retaining information."
  }'::jsonb
);