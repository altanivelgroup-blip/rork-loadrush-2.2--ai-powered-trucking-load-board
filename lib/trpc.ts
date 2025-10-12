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

const MAX_RETRIES = 8;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;
const REQUEST_TIMEOUT = 60000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let authTokenCache: { token: string; expiry: number } | null = null;

async function getAuthToken(): Promise<string | null> {
  try {
    if (authTokenCache && authTokenCache.expiry > Date.now()) {
      console.log('🔑 [tRPC] Using cached auth token');
      return authTokenCache.token;
    }

    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken(false);
      authTokenCache = {
        token,
        expiry: Date.now() + 55 * 60 * 1000,
      };
      console.log('🔑 [tRPC] Fresh auth token obtained');
      return token;
    }
  } catch (error) {
    console.warn('⚠️ [tRPC] Failed to get auth token:', error);
    authTokenCache = null;
  }
  return null;
}

export function clearAuthTokenCache() {
  authTokenCache = null;
  console.log('🔑 [tRPC] Auth token cache cleared');
}

async function fetchWithRetry(url: RequestInfo | URL, options?: RequestInit, attempt = 1): Promise<Response> {
  const urlString = typeof url === 'string' ? url : url.toString();
  
  try {
    console.log(`🔄 [tRPC] Fetch attempt ${attempt}/${MAX_RETRIES} to:`, urlString);
    
    const authToken = await getAuthToken();
    const headers = new Headers(options?.headers);
    
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
      console.log('🔑 [tRPC] Auth token attached');
    } else {
      console.log('⚠️ [tRPC] No auth token available');
    }

    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`⏱️ [tRPC] Request timeout after ${REQUEST_TIMEOUT}ms`);
      controller.abort();
    }, REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        credentials: 'omit',
        mode: 'cors',
      });

      clearTimeout(timeoutId);

      console.log(`✅ [tRPC] Response received: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const responseText = await response.text().catch(() => 'Unable to read response');
        console.warn(`⚠️ [tRPC] Non-OK response: ${response.status} - ${responseText.substring(0, 200)}`);
        
        if (response.status === 401) {
          console.warn('🔑 [tRPC] Auth token may be invalid, clearing cache');
          clearAuthTokenCache();
        }
        
        if (attempt < MAX_RETRIES && (response.status >= 500 || response.status === 429 || response.status === 408)) {
          const retryDelay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1), MAX_RETRY_DELAY);
          console.log(`⏳ [tRPC] Retrying after ${retryDelay}ms...`);
          await sleep(retryDelay);
          return fetchWithRetry(url, options, attempt + 1);
        }
      }

      return response;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    const isAbortError = error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'));
    const isNetworkError = error instanceof Error && (
      error.message.includes('fetch') || 
      error.message.includes('network') || 
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed') ||
      error.message.includes('Load failed')
    );
    const isTimeoutError = error instanceof Error && error.message.includes('timeout');

    if ((isAbortError || isNetworkError || isTimeoutError) && attempt < MAX_RETRIES) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const retryDelay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1), MAX_RETRY_DELAY);
      
      console.warn(`⚠️ [tRPC] Fetch error (attempt ${attempt}/${MAX_RETRIES}): ${errorMsg}`);
      console.log(`⏳ [tRPC] Waiting ${retryDelay}ms before retry...`);
      
      await sleep(retryDelay);
      return fetchWithRetry(url, options, attempt + 1);
    }

    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [tRPC] Fetch failed after ${attempt} attempts:`, errorMsg);
    console.error(`❌ [tRPC] URL: ${urlString}`);
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
