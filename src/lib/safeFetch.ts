/**
 * Safe fetch & JSON parser helper for network responses.
 * Prevents "SyntaxError: Unexpected token 'A', 'A server e'... is not valid JSON"
 * by inspecting headers, safely extracting response text, and attempting JSON parse.
 * If the response is HTML or plain text (such as 500/502/504 errors from reverse proxy),
 * it returns a structured JSON object with the error message instead of throwing an unhandled exception.
 */

export interface SafeParsedResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  rawText?: string;
  isJson: boolean;
}

/**
 * Safely parse a fetch Response as JSON or extract formatted error text.
 */
export async function safeParseResponse<T = any>(
  response: Response,
  fallbackErrorMessage = 'Server request failed'
): Promise<SafeParsedResponse<T>> {
  const status = response.status;
  const ok = response.ok;
  let rawText = '';

  try {
    rawText = await response.text();
  } catch (readErr: any) {
    return {
      ok: false,
      status,
      data: {
        success: false,
        error: readErr?.message || 'Failed to read response from server',
        status: 'failed'
      } as unknown as T,
      isJson: false
    };
  }

  // If body is empty
  if (!rawText || !rawText.trim()) {
    return {
      ok,
      status,
      data: {
        success: ok,
        error: ok ? undefined : `Server returned empty response (HTTP ${status})`,
        status: ok ? 'sent' : 'failed'
      } as unknown as T,
      rawText: '',
      isJson: false
    };
  }

  // Attempt JSON parse
  try {
    const parsed = JSON.parse(rawText);
    return {
      ok,
      status,
      data: parsed as T,
      rawText,
      isJson: true
    };
  } catch {
    // Non-JSON response (e.g. "A server error occurred.", HTML error page, 502/504 Bad Gateway)
    let cleanMessage = rawText.trim();

    // Strip HTML tags if HTML error page was returned
    if (cleanMessage.includes('<') && cleanMessage.includes('>')) {
      const match = cleanMessage.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i) || cleanMessage.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (match && match[1]) {
        cleanMessage = match[1].replace(/<[^>]+>/g, '').trim();
      } else {
        cleanMessage = cleanMessage.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }

    // Limit length to avoid massive HTML dumps
    if (cleanMessage.length > 250) {
      cleanMessage = cleanMessage.slice(0, 250) + '...';
    }

    if (!cleanMessage) {
      cleanMessage = `${fallbackErrorMessage} (HTTP ${status})`;
    }

    return {
      ok: false,
      status,
      data: {
        success: false,
        error: cleanMessage,
        status: 'failed'
      } as unknown as T,
      rawText,
      isJson: false
    };
  }
}

/**
 * Safe fetch wrapper that automatically catches network errors and non-JSON server responses.
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackErrorMessage = 'Unable to connect to server'
): Promise<SafeParsedResponse<T>> {
  try {
    const response = await fetch(input, init);
    return await safeParseResponse<T>(response, fallbackErrorMessage);
  } catch (networkErr: any) {
    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        error: networkErr?.message || fallbackErrorMessage,
        status: 'failed'
      } as unknown as T,
      isJson: false
    };
  }
}
