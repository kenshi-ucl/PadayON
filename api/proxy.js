export const config = {
    runtime: 'edge',
};

const BACKEND_URL = 'https://0131-216-247-43-161.ngrok-free.app';

export default async function handler(request) {
    const url = new URL(request.url);
    const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('ngrok-skip-browser-warning', 'true');
    requestHeaders.set('Host', new URL(BACKEND_URL).host);
    requestHeaders.delete('connection');

    const fetchOptions = {
        method: request.method,
        headers: requestHeaders,
        redirect: 'manual',
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        fetchOptions.body = request.body;
        fetchOptions.duplex = 'half';
    }

    const response = await fetch(targetUrl, fetchOptions);

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('transfer-encoding');

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
    });
}
