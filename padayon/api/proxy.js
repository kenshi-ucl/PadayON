const https = require('https');
const { URL } = require('url');

const BACKEND = 'https://0131-216-247-43-161.ngrok-free.app';

module.exports = (req, res) => {
    const target = new URL(BACKEND + req.url);

    const opts = {
        hostname: target.hostname,
        path: target.pathname + target.search,
        method: req.method,
        headers: {
            ...req.headers,
            host: target.hostname,
            'ngrok-skip-browser-warning': 'true',
        },
    };
    delete opts.headers.connection;

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

    if (req.method === 'GET' || req.method === 'HEAD') {
        proxy.end();
    } else {
        req.pipe(proxy);
    }
};
