const https = require('https');
const { URL } = require('url');

const BACKEND = 'https://doreatha-periproctal-sid.ngrok-free.dev';

module.exports = (req, res) => {
    const target = new URL(BACKEND + req.url);

    // Collect the full request body for non-GET/HEAD requests
    // Vercel serverless functions buffer the body, so req.pipe() fails for multipart uploads
    const collectBody = (req.method !== 'GET' && req.method !== 'HEAD');

    const sendRequest = (bodyBuffer) => {
        const headers = { ...req.headers, host: target.hostname, 'ngrok-skip-browser-warning': 'true' };
        delete headers.connection;

        // Update content-length to match actual body buffer size
        if (bodyBuffer) {
            headers['content-length'] = Buffer.byteLength(bodyBuffer);
        }

        const opts = {
            hostname: target.hostname,
            path: target.pathname + target.search,
            method: req.method,
            headers,
        };

        const proxy = https.request(opts, (upstream) => {
            const h = { ...upstream.headers };
            delete h['transfer-encoding'];
            res.writeHead(upstream.statusCode, h);
            upstream.pipe(res);
        });

        proxy.on('error', (e) => {
            res.writeHead(502, { 'Content-Type': 'text/plain' });
            res.end('Backend unavailable: ' + e.message);
        });

        if (bodyBuffer) {
            proxy.end(bodyBuffer);
        } else {
            proxy.end();
        }
    };

    if (collectBody) {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => sendRequest(Buffer.concat(chunks)));
    } else {
        sendRequest(null);
    }
};
