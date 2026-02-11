const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initSocket } = require('./lib/socket.js');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.NODE_ENV !== 'development'
  ? '0.0.0.0'
  : 'localhost';
// Frontend should run on port 3000, not 3001
const port = 3000;

const app = next({
  dev,
  hostname,
  port,
  turbopack: dev, // Use Turbopack in dev mode (Next.js 16+)
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer();

  // Initialize Socket.IO FIRST
  // Socket.IO will attach to the server and only handle /api/socket path
  const io = initSocket(httpServer);

  // Set up Next.js request handler for all routes
  // Socket.IO middleware will handle /api/socket before this runs
  httpServer.on('request', async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);

      // Handle /api/services/public in main process (same as socket) so presence store is shared
      if (req.method === 'GET' && parsedUrl.pathname === '/api/services/public') {
        try {
          const { getPublicServices } = require('./lib/getPublicServicesServer.cjs');
          const skillSlug = parsedUrl.query.skill || null;
          const status = parsedUrl.query.status || 'all';
          const page = parsedUrl.query.page;
          const pageSize = parsedUrl.query.pageSize;
          const services = await getPublicServices(skillSlug, status, page, pageSize);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(services));
          return;
        } catch (err) {
          if (dev) console.error('Services API error:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch services' }));
          return;
        }
      }

      // Skip Socket.IO path - it's already handled by Socket.IO
      // Socket.IO will intercept WebSocket/polling requests automatically
      await handle(req, res, parsedUrl);
    } catch (err) {
      if (dev) {
        console.error('Error occurred handling', req.url, err);
      } else {
        console.error('Error occurred handling request');
      }
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('internal server error');
      }
    }
  });

  httpServer.once('error', (err) => {
    if (dev) {
      console.error(err);
    } else {
      console.error('Server error');
    }
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO available at http://${hostname}:${port}/api/socket`);
    console.log(`> API routes available at http://${hostname}:${port}/api/*`);
  });
});
