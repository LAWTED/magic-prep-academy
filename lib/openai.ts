import OpenAI from 'openai';
import { HttpsProxyAgent } from "https-proxy-agent";

// Create a singleton OpenAI client with proxy configuration
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  ...(process.env.NODE_ENV !== 'production' && {
    httpAgent: new HttpsProxyAgent("http://127.0.0.1:7890")
  }),
});