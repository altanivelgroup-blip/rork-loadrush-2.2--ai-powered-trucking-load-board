import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { auth } from "@/config/firebase";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  console.warn('⚠️ EXPO_PUBLIC_RORK_API_BASE_URL not set, using fallback');
  return 'http://localhost:8081';
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getAuthToken(): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      return token;
    }
  } catch (error) {
    console.warn('⚠️ Failed to get auth token:', error);
  }
  return null;
}

async function fetchWithRetry(url: RequestInfo | URL, options?: RequestInit, attempt = 1): Promise<Response> {
  try {
    const authToken = await getAuthToken();
    const headers = new Headers(options?.headers);
    
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok && attempt < MAX_RETRIES) {
      console.warn(`⚠️ tRPC request failed (attempt ${attempt}/${MAX_RETRIES}), retrying...`);
      await sleep(RETRY_DELAY * attempt);
      return fetchWithRetry(url, options, attempt + 1);
    }

    return response;
  } catch (error) {
    const isAbortError = error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'));
    const isNetworkError = error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'));

    if ((isAbortError || isNetworkError) && attempt < MAX_RETRIES) {
      console.warn(`⚠️ tRPC fetch error (attempt ${attempt}/${MAX_RETRIES}):`, error instanceof Error ? error.message : 'Unknown error');
      await sleep(RETRY_DELAY * attempt);
      return fetchWithRetry(url, options, attempt + 1);
    }

    console.error('❌ tRPC fetch failed after retries:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: fetchWithRetry as typeof fetch,
    }),
  ],
});
