import { RUNWAY_API_URL, RUNWAY_API_VERSION } from '@/constants';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type ImageApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  additionalHeaders?: Record<string, string>;
};

/**
 * Utility function to make image generation API requests with proper headers
 */
export async function imageApiRequest<T = unknown>(
  endpoint: string,
  apiKey: string,
  options: ImageApiRequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, additionalHeaders = {} } = options;

  if (!apiKey) {
    throw new Error('API key is required for image generation API requests');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'X-Runway-Version': RUNWAY_API_VERSION,
    ...additionalHeaders,
  };

  const requestOptions: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    requestOptions.body = JSON.stringify(body);
  }

  const url = `${RUNWAY_API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      // If the response is not JSON, use the status text or response text as the error
      try {
        errorData = { error: (await response.text()) || response.statusText };
      } catch {
        errorData = { error: response.statusText || 'Unknown error' };
      }
    }

    console.error('Runway API Error:', {
      url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      errorData,
    });

    throw new Error(
      JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        details: errorData,
      })
    );
  }

  // Handle 204 No Content responses (commonly returned by DELETE operations)
  if (response.status === 204) {
    return {} as T;
  }

  try {
    const data = await response.json();
    return data;
  } catch {
    throw new Error('Failed to parse response');
  }
}
