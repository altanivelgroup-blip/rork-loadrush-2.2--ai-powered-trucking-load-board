import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { auth } from "@/config/firebase";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    console.log('✅ Using configured API base URL:', url);
    return url;
  }

  console.warn('⚠️ EXPO_PUBLIC_RORK_API_BASE_URL not set, using fallback');
  return 'http://localhost:8081';
};

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

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
    console.log(`🔄 [tRPC] Fetch attempt ${attempt}/${MAX_RETRIES} to:`, typeof url === 'string' ? url : url.toString());
    
    const authToken = await getAuthToken();
    const headers = new Headers(options?.headers);
    
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
      console.log('🔑 [tRPC] Auth token attached');
    } else {
      console.log('⚠️ [tRPC] No auth token available');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`✅ [tRPC] Response received: ${response.status} ${response.statusText}`);

      if (!response.ok && attempt < MAX_RETRIES) {
        console.warn(`⚠️ [tRPC] Non-OK response (attempt ${attempt}/${MAX_RETRIES}), retrying...`);
        await sleep(RETRY_DELAY * attempt);
        return fetchWithRetry(url, options, attempt + 1);
      }

      return response;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    const isAbortError = error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'));
    const isNetworkError = error instanceof Error && (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch'));
    const isTimeoutError = error instanceof Error && error.message.includes('timeout');

    if ((isAbortError || isNetworkError || isTimeoutError) && attempt < MAX_RETRIES) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`⚠️ [tRPC] Fetch error (attempt ${attempt}/${MAX_RETRIES}): ${errorMsg}`);
      console.log(`⏳ [tRPC] Waiting ${RETRY_DELAY * attempt}ms before retry...`);
      await sleep(RETRY_DELAY * attempt);
      return fetchWithRetry(url, options, attempt + 1);
    }

    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [tRPC] Fetch failed after ${attempt} attempts:`, errorMsg);
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
