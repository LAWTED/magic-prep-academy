# JSON Processing Utilities

This directory contains utilities for processing JSON responses from OpenAI's API, particularly for structured content like quizzes, exercises, and assessments.

## JSON Parser

The `jsonParser.ts` file provides utilities for parsing and validating JSON from AI-generated text responses. This helps handle the sometimes inconsistent formatting in AI responses.

### Key Features

1. **Centralized JSON Parsing**: A shared utility for parsing JSON from AI responses across the application
2. **Multiple Pattern Matching**: Uses regex patterns to extract JSON from various formats
3. **Validation Functions**: Includes validators for different content types
4. **Error Handling**: Graceful handling of parsing errors with informative messages
5. **Type Safety**: TypeScript generics for properly typed return values

### Implementation

Our approach focuses entirely on server-side JSON processing:

**Server-side Parsing**: All JSON parsing is performed exclusively in API endpoints before returning data to clients. Client components should never implement their own parsing logic.

### Usage

#### In API Routes

```typescript
import { parseAIGeneratedJson, validators } from "@/app/utils/jsonParser";

// In API route handler
try {
  const parsedResults = parseAIGeneratedJson(
    response.output_text,
    validators.multipleChoice
  );

  return NextResponse.json({
    response: {
      ...response,
      parsed_content: parsedResults
    }
  });
} catch (parseError) {
  // Return the original response if parsing fails
  return NextResponse.json({
    response: response,
    parse_error: "Failed to parse JSON response"
  });
}
```

### Available Validators

The `validators` object in `jsonParser.ts` contains validation functions for different content types:

- `multipleChoice`: For multiple choice quiz content
- `fillInTheBlank`: For fill-in-the-blank exercises
- `dialogue`: For dialogue exercises
- `matching`: For matching exercises
- `eligibilityResults`: For program eligibility check results
- `moduleMetadata`: For module title and summary data

### Combined JSON Responses

For efficiency, some API requests can combine related data into a single call:

- **Module Metadata**: Instead of separate calls for title and summary, use the `moduleMetadata` validator to process a JSON response containing both

Example in API implementation:
```typescript
// Using the moduleMetadata validator for combined title and summary
if (validator_name === "moduleMetadata") {
  try {
    const validatorFn = validators.moduleMetadata;
    const parsedContent = parseAIGeneratedJson(
      response.output_text,
      validatorFn
    );

    // parsedContent now contains { title: string, summary: string }
    return NextResponse.json({
      response: {
        ...response,
        parsed_content: parsedContent
      }
    });
  } catch (parseError) {
    // Handle parsing error
  }
}
```

## Best Practices

1. **API-Only JSON Parsing**: Perform all JSON parsing only on the server-side API layer
2. **No Client-Side Parsing**: Client components should never implement parsing logic
3. **Appropriate Validator Selection**: Always use the correct validator for the content type
4. **Validator Development**: When adding new content types, create corresponding validators
5. **API Documentation**: Keep the validator list in the API docs updated

For client-side implementation guidelines, refer to the API documentation.