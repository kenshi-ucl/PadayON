import axios from 'axios';

// Configure axios
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Use XSRF-TOKEN cookie for CSRF protection (Laravel sets this cookie automatically)
// This ensures every request gets the LATEST token from the cookie, not a stale meta tag value
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;

// Configure axios base URL
axios.defaults.baseURL = window.location.origin;

// Add response interceptor for error handling
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            window.location.href = '/login';
        }
        if (error.response?.status === 419) {
            // Session expired — full page reload to get fresh session + token
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

// Export for use in components
window.axios = axios;

declare global {
    interface Window {
        axios: typeof axios;
    }
}

export { };

