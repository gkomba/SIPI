import { POST as chatHandler } from '../api/chat';

// Simple API handler for development
export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  if (url.pathname === '/api/chat') {
    return chatHandler(request);
  }
  
  return new Response('Not Found', { status: 404 });
}

// Mock fetch for development
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    
    if (url.startsWith('/api/')) {
      const request = new Request(url, init);
      return handleApiRequest(request);
    }
    
    return originalFetch(input, init);
  };
}