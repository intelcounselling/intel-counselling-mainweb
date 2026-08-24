import { authHeaders } from './auth';

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT = 15000; // 15 seconds

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  // 1. Check network connection
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new ApiError('No internet connection. Please check your network and try again.', 0);
  }

  const { timeoutMs = DEFAULT_TIMEOUT, headers: customHeaders, ...restOptions } = options;

  // 2. Prepare headers (include Auth tokens automatically)
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...Object.fromEntries(new Headers(customHeaders as any).entries()),
  });

  // 3. Implement request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 4. Parse JSON or text response
    let responseData: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = { message: await response.text() };
    }

    // 5. Handle unsuccessful HTTP statuses
    if (!response.ok) {
      const errorMessage = responseData?.error || responseData?.message || `Request failed with status ${response.status}`;
      
      // Handle unauthorized session
      if (response.status === 401) {
        console.warn('Session expired or unauthorized. Clearing authentication.');
        // Optional: clearAuthSession() or redirect
      }
      
      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new ApiError('The request timed out. Please try again.', 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    
    console.error(`API Request failed on ${url}:`, err);
    throw new ApiError(err.message || 'An unexpected error occurred. Please try again.', 500);
  }
}

export const apiClient = {
  get: <T>(url: string, options?: RequestOptions) => 
    request<T>(url, { ...options, method: 'GET' }),
    
  post: <T>(url: string, body?: any, options?: RequestOptions) => 
    request<T>(url, { 
      ...options, 
      method: 'POST', 
      body: body ? JSON.stringify(body) : undefined 
    }),
    
  put: <T>(url: string, body?: any, options?: RequestOptions) => 
    request<T>(url, { 
      ...options, 
      method: 'PUT', 
      body: body ? JSON.stringify(body) : undefined 
    }),
    
  delete: <T>(url: string, options?: RequestOptions) => 
    request<T>(url, { ...options, method: 'DELETE' }),
};
