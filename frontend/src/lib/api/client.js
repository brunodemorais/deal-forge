const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    // 1. Get the JWT token from local storage
    const token = localStorage.getItem('token');
    
    // 2. Set the Authorization header if a token exists
    const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

    const url = `${this.baseURL}${endpoint}`;
    const config = {
      // Set the method (default to GET if not provided)
      method: options.method || (options.body ? 'POST' : 'GET'), 
      
      headers: {
        'Content-Type': 'application/json',
        ...authHeader, // Add the Auth header here
        ...options.headers,
      },
      ...options,
    };
    
    // Stringify the body for POST/PUT/PATCH requests
    if (options.body && typeof options.body !== 'string' && config.headers['Content-Type'].includes('json')) {
        config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle 401 Unauthorized globally (e.g., JWT expired)
        if (response.status === 401 && endpoint !== '/api/auth/login') {
             // In a real app, you might want to call AuthContext.logout() here.
             // For now, we just throw the error.
        }
        
        const error = await response.json().catch(() => ({ error: 'Unknown API error' }));
        throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
      }

      // Check if response is 204 No Content before trying to parse JSON
      if (response.status === 204) {
          return {};
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // =========================================================
  // NEW: AUTHENTICATION ENDPOINTS
  // =========================================================
  async post(endpoint, body) {
      return this.request(endpoint, { method: 'POST', body });
  }
  
  async get(endpoint) {
      return this.request(endpoint, { method: 'GET' });
  }

  async login(email, password) {
    // Calls your Flask /api/auth/login endpoint
    return this.post('/api/auth/login', { email, password });
  }

  async register(email, password) {
    // Calls your Flask /api/auth/register endpoint
    return this.post('/api/auth/register', { email, password });
  }
  
  async getMe() {
      // Calls your protected Flask /api/auth/me endpoint
      return this.get('/api/auth/me');
  }

  // =========================================================
  // EXISTING API ENDPOINTS
  // =========================================================

  async getGames(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.discountMin !== undefined) queryParams.append('discountMin', params.discountMin);
    if (params.priceMin !== undefined) queryParams.append('priceMin', params.priceMin);
    if (params.priceMax !== undefined) queryParams.append('priceMax', params.priceMax);
    
    // Support both pagination styles
    if (params.page !== undefined) queryParams.append('page', params.page);
    if (params.perPage !== undefined) queryParams.append('perPage', params.perPage);
    
    // Legacy support (can be removed if not used elsewhere)
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);

    const queryString = queryParams.toString();
    const endpoint = `/api/games${queryString ? `?${queryString}` : ''}`;
    
    console.log('🌐 API Client calling:', endpoint);
    
    return this.request(endpoint);
  }

  async getGameDetails(appId) {
    return this.request(`/api/games/${appId}`);
  }

  async getPriceHistory(appId) {
    return this.request(`/api/games/${appId}/price-history`);
  }

  async getDeals() {
    return this.request('/api/deals');
  }

  async healthCheck() {
    return this.request('/api/health');
  }
  
  // =========================================================
  // NEW: WATCHLIST ENDPOINTS (Require JWT)
  // =========================================================
  async getWatchlist() {
    // Corresponds to Flask /api/watchlist
    return this.get('/api/watchlist'); 
  }
  
  async addToWatchlist(appId) {
    // Corresponds to Flask POST /api/watchlist
    return this.post('/api/watchlist', { app_id: appId });
  }
  
  async removeFromWatchlist(appId) {
    // Corresponds to Flask DELETE /api/watchlist/<int:app_id>
    return this.request(`/api/watchlist/${appId}`, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;