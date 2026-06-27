/**
 * aiResponse.ts
 *
 * Normalizes AI endpoint error handling, fallback execution, and metadata extraction.
 * Shared by all Gemini-powered API routes (e.g., ai-forecast, ai-analyze, location-analyze).
 */

export interface AiSourceMetadata {
  title: string;
  uri: string;
}

export interface AiResponseResult<T> {
  data: T;
  sources: AiSourceMetadata[];
  isFallback: boolean;
  error?: string;
}

/**
 * Validates the presence of the Gemini API key.
 * Throws a specific error message if missing.
 */
export function requireApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment. Please add it via Settings > Secrets.");
  }
  return apiKey;
}

/**
 * Extracts grounding sources from the Gemini response object.
 */
export function extractGroundingSources(response: any): AiSourceMetadata[] {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return chunks
    .map((chunk: any) => ({
      title: chunk.web?.title || "Referensi Strategi FnB",
      uri: chunk.web?.uri || "",
    }))
    .filter((source: AiSourceMetadata) => source.uri !== "");
}

/**
 * Executes a Gemini AI call and parses the JSON response.
 * If the API call fails (e.g. Quota Exceeded, 429) or JSON parsing fails,
 * it gracefully invokes the provided fallback function.
 *
 * @param aiCall - A promise representing the AI generation call
 * @param fallbackFn - A function that returns a synchronous fallback data structure
 * @param contextName - A descriptive string for logging (e.g., "Marketing Analysis")
 */
export async function withAiFallback<T>(
  aiCall: () => Promise<any>,
  fallbackFn: () => T,
  contextName: string
): Promise<AiResponseResult<T>> {
  try {
    const response = await aiCall();
    const resultText = response.text || "{}";
    const parsedData = JSON.parse(resultText) as T;
    const sources = extractGroundingSources(response);
    
    return {
      data: parsedData,
      sources,
      isFallback: false,
    };
  } catch (error: any) {
    console.warn(`⚠️ API Gemini gagal atau JSON tidak valid di [${contextName}]. Mengaktifkan Mode Fallback:`, error.message || error);
    
    return {
      data: fallbackFn(),
      sources: [{ title: `Mode Analitik Lokal (Model Fallback Coraq - ${contextName})`, uri: "#" }],
      isFallback: true,
      error: error.message || "Unknown AI error",
    };
  }
}
