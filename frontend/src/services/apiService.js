// --- API Service ---
const BASE_URL = 'http://localhost:3000/api/v1';

const apiService = {
  async request(endpoint, method, body = null) {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Send cookies
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok || data.status !== 200) {
      throw new Error(data.message || data.error || 'API request failed');
    }
    return data;
  },

  login(email, password) {
    return this.request('/auth/login', 'POST', { email, password });
  },

  signup(email, password) {
    return this.request('/auth/signup', 'POST', { email, password });
  },

  logout() {
    return this.request('/auth/logout', 'GET');
  },

  onboard(onboardingData) {
    return this.request('/auth/onboarding', 'POST', onboardingData);
  },
};

export default apiService;