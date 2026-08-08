const API_URL = import.meta.env.VITE_API_URL;
export const BASE_URL = `${API_URL}/api`;

let tokenProvider = null;
let unauthorizedHandler = null;

export const setTokenProvider = (provider) => {
  tokenProvider = provider;
};

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const apiClient = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (tokenProvider) {
    const token = tokenProvider();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `API Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch (e) {
      // Ignore if response is not JSON
    }
    
    // Handle 401 Unauthorized via the registered handler
    if (response.status === 401 && unauthorizedHandler) {
      try {
        const newToken = await unauthorizedHandler();
        if (newToken) {
          // Retry the original request with the new token
          options.headers = { ...options.headers, 'Authorization': `Bearer ${newToken}` };
          return apiClient(endpoint, options);
        }
      } catch (handlerError) {
        throw new Error(errorMsg);
      }
    }

    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};
