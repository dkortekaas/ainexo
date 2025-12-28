import { createClient, type SanityClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

// Lazy client creation - only create when actually needed
let _client: SanityClient | null = null;

function getClient(): SanityClient {
  if (!_client) {
    if (!projectId) {
      throw new Error(
        "Sanity projectId is not configured. " +
          "Please set NEXT_PUBLIC_SANITY_PROJECT_ID in your Vercel environment variables or .env.local file."
      );
    }
    if (!dataset) {
      throw new Error(
        "Sanity dataset is not configured. " +
          "Please set NEXT_PUBLIC_SANITY_DATASET in your Vercel environment variables or .env.local file."
      );
    }
    _client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
      perspective: "published",
    });
  }
  return _client;
}

// Export client with lazy initialization using a Proxy
// This allows the client to be used normally while only creating it when needed
export const client = new Proxy({} as SanityClient, {
  get(_target, prop) {
    const actualClient = getClient();
    const value = (actualClient as any)[prop];
    if (typeof value === "function") {
      return value.bind(actualClient);
    }
    return value;
  },
});
