/**
 * Utility for handling streaming responses from the vector-chat-stream API
 */

type StreamResponse<T> = {
  parsedContent: T | null;
  error: string | null;
};

/**
 * Processes a streaming response from the vector-chat-stream API
 *
 * @param response The fetch response from vector-chat-stream API
 * @param onChunkReceived Optional callback for when each chunk is received, useful for progressive UI updates
 * @returns A promise that resolves to the parsed content or an error
 */
export async function processVectorChatStream<T>(
  response: Response,
  onChunkReceived?: (chunk: any) => void
): Promise<StreamResponse<T>> {
  if (!response.body) {
    return { parsedContent: null, error: "Response has no body" };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let parsedContent: T | null = null;
  let error: string | null = null;

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      const chunkText = decoder.decode(value, { stream: true });
      const chunks = chunkText.split("\n").filter(Boolean);

      for (const chunk of chunks) {
        try {
          const parsedChunk = JSON.parse(chunk);

          // Call the callback with the chunk if provided
          if (onChunkReceived) {
            onChunkReceived(parsedChunk);
          }

          // Check for parsed content
          if (parsedChunk.parsed_content) {
            parsedContent = parsedChunk.parsed_content as T;
            break;
          }

          // Check for errors
          if (parsedChunk.parse_error) {
            error = parsedChunk.parse_error;
            break;
          }
        } catch (e) {
          console.error("Error parsing chunk:", e);
        }
      }

      // Stop if we found content or an error
      if (parsedContent || error) {
        break;
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Error reading stream";
  } finally {
    reader.releaseLock();
  }

  return { parsedContent, error };
}