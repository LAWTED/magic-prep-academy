# API and JSON Processing

This project's API endpoints are responsible for interacting with the OpenAI API and processing JSON data in responses. We've adopted a centralized approach to handling AI-generated JSON data.

## Design Principles

1. **Server-side Parsing**: All JSON parsing is performed on the server side and should not be duplicated in client components
2. **Unified Validation**: Using shared validator functions to ensure the parsed content structure is correct
3. **Error Handling**: Providing clear error messages, allowing clients to respond appropriately
4. **Consistent Response Format**: API response format remains consistent regardless of content type
5. **Efficient Data Retrieval**: Combining related data requests into single API calls where possible

## Main API Endpoints

### 1. `/api/vector-chat`

This API is used to generate various exercise content based on vector storage.

#### Request Format:

```json
{
  "vectorStoreId": "Vector Store ID",
  "prompt": "Prompt for generating content",
  "validator_name": "Name of validator to use"
}
```

Available validator names:
- `multipleChoice`: Multiple choice questions
- `fillInTheBlank`: Fill in the blank exercises
- `dialogue`: Dialogue exercises
- `matching`: Matching exercises
- `moduleMetadata`: Title and summary for modules

#### Response Format:

On Success:
```json
{
  "response": {
    "output_text": "Original OpenAI response",
    "parsed_content": {
      // Parsed structured content
    }
  }
}
```

On Parse Failure:
```json
{
  "response": {
    "output_text": "Original OpenAI response"
  },
  "parse_error": "Parse error message"
}
```

### 2. `/api/eligibility-check`

This API is used to check if a user is eligible for a specific program.

#### Request Format:

```json
{
  "programId": "Program ID",
  "userId": "User ID (optional)"
}
```

#### Response Format:

On Success:
```json
{
  "success": true,
  "data": [
    {
      "label": "Label",
      "status": "met|not_met|partially_met|unknown",
      "explain": "Explanation text"
    }
  ]
}
```

On Parse Failure:
```json
{
  "success": false,
  "error": "Error message",
  "raw_response": "Original OpenAI response"
}
```

## JSON Processing Flow

1. API receives a request and calls the OpenAI completions API
2. Uses the `parseAIGeneratedJson` utility function to parse JSON in the response
3. Validates the parsed structure with the appropriate validator
4. Returns the parsed content or appropriate error messages

## Combined Data Requests

For efficiency, some API requests can combine related data into a single call:

- **Module Metadata**: Instead of separate calls for title and summary, use the `moduleMetadata` validator to process a JSON response containing both

Example prompt for combined data:
```
Generate a title and summary for this learning material as a JSON object with this format:
{
  "title": "A concise title",
  "summary": "A brief summary of key points"
}
```

## Error Handling Strategy

1. If JSON parsing fails, the API attempts to provide useful error information
2. Client components should handle these errors gracefully, such as displaying error messages and allowing users to retry
3. For some APIs, the original response is provided when JSON parsing fails for manual inspection if needed

## Best Practices and Implementation Strategy

We've established these key practices for JSON processing in our application:

1. **API-Only JSON Parsing**: All JSON parsing is performed ONLY in API layer, never in client components
   - This ensures consistent processing logic
   - Reduces duplicate code across components
   - Centralizes error handling

2. **Using Validator Names**: Client components should:
   - Always provide the `validator_name` parameter in API requests
   - Never implement their own parsing logic
   - Focus on handling the parsed results returned by the API

3. **Handling Multiple Data Points**:
   - Use combined JSON structures (like `moduleMetadata`) instead of multiple API calls
   - Structure your prompts to generate properly formatted JSON
   - Create appropriate validators for each JSON structure

4. **Client Component Implementation**:
   ```typescript
   // Good implementation (uses API-parsed data)
   const response = await fetch("/api/vector-chat", {
     method: "POST",
     body: JSON.stringify({
       vectorStoreId,
       prompt: PROMPT,
       validator_name: "moduleMetadata" // Always specify validator
     })
   });
   const data = await response.json();

   // Use the parsed_content directly
   if (data.response.parsed_content) {
     setData(data.response.parsed_content);
   } else {
     // Handle parse error
     setError(data.parse_error || "Failed to parse response");
   }
   ```

5. **Validator Development**:
   - When adding new content types, always create a validator in `jsonParser.ts`
   - Keep validators simple and focused on structural validation
   - Update the validator list in this documentation