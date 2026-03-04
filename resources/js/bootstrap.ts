import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally for Echo
(window as any).Pusher = Pusher;

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

// Initialize Laravel Echo for real-time broadcasting
const echoKey = import.meta.env.VITE_PUSHER_APP_KEY;
const echoCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1';

if (echoKey) {
    window.Echo = new Echo({
        broadcaster: 'pusher',
        key: echoKey,
        cluster: echoCluster,
        forceTLS: true,
        authorizer: (channel: any) => ({
            authorize: (socketId: string, callback: Function) => {
                axios.post('/broadcasting/auth', {
                    socket_id: socketId,
                    channel_name: channel.name,
                })
                .then(response => callback(null, response.data))
                .catch(error => callback(error));
            },
        }),
    });
}

declare global {
    interface Window {
        axios: typeof axios;
        Echo: Echo<any>;
    }
}

export { };

