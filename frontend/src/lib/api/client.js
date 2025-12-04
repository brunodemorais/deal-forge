const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async getGames(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.discountMin !== undefined) queryParams.append('discountMin', params.discountMin);
    if (params.priceMin !== undefined) queryParams.append('priceMin', params.priceMin);
    if (params.priceMax !== undefined) queryParams.append('priceMax', params.priceMax);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);

    const queryString = queryParams.toString();
    const endpoint = `/api/games${queryString ? `?${queryString}` : ''}`;
    
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
}

export const apiClient = new ApiClient();
export default apiClient;

