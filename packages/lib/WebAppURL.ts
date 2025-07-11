import { WEBAPP_URL } from "@calcom/lib/constants";

/** This class extends the native URL and uses WEBAPP_URL as the base URL for creating object URLs */
export class WebAppURL extends URL {
  constructor(path: string | URL) {
    super(path, WEBAPP_URL);
  }
}

/**
 * Safely constructs a callback URL for authentication flows
 * @param callbackUrl - The callback URL that may start with / or be a relative path
 * @param baseUrl - The base URL to use (defaults to WEBAPP_URL)
 * @returns A properly formatted absolute URL
 */
export function safeCallbackUrl(callbackUrl: string, baseUrl: string = WEBAPP_URL): string {
  if (!callbackUrl) return baseUrl.replace(/\/+$/, '');
  if (/^https?:\/\//.test(callbackUrl)) return callbackUrl;
  return `${baseUrl.replace(/\/+$/, '')}/${callbackUrl.replace(/^\/+/, '')}`;
}