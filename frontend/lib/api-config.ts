// API Configuration utility
import { log } from './logger';

// Default API configuration
const DEFAULT_API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888',
  timeout: 10000,
  retries: 3
};

// Fallback URLs to try if the primary URL fails
const FALLBACK_URLS = [
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888',
  'http://127.0.0.1:8888',
  'http://host.docker.internal:8888',
  'http://backend:8888'
];

// Cache for working URL
let cachedWorkingUrl: string | null = null;

/**
 * Get the working API URL
 */
export async function getApiUrl(): Promise<string> {
  // Return cached URL if available
  if (cachedWorkingUrl) {
    return cachedWorkingUrl;
  }

  // Try environment variable first
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    log.info('API_CONFIG', 'Using environment API URL', { url: envUrl });
    if (await testUrl(envUrl)) {
      cachedWorkingUrl = envUrl;
      return envUrl;
    }
  }

  // Try fallback URLs
  for (const url of FALLBACK_URLS) {
    log.info('API_CONFIG', 'Testing fallback URL', { url });
    if (await testUrl(url)) {
      cachedWorkingUrl = url;
      log.info('API_CONFIG', 'Found working URL', { url });
      return url;
    }
  }

  // If all URLs fail, return the default
  log.error('API_CONFIG', 'All API URLs failed, using default', { defaultUrl: DEFAULT_API_CONFIG.baseUrl });
  return DEFAULT_API_CONFIG.baseUrl;
}

/**
 * Test if a URL is reachable
 */
async function testUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    return response.ok;
  } catch (error) {
    log.debug('API_CONFIG', 'URL test failed', { url, error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

/**
 * Make an API request with automatic URL resolution
 */
export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = await getApiUrl();
  const url = `${baseUrl}${endpoint}`;
  
  log.debug('API_REQUEST', 'Making API request', { url, method: options.method || 'GET' });
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }     
  });
  
  return response;
}

/**
 * Clear the cached URL (useful for testing or when backend restarts)
 */
export function clearApiUrlCache(): void {
  cachedWorkingUrl = null;
  log.info('API_CONFIG', 'API URL cache cleared');
}
