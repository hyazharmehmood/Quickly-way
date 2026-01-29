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

const app = next({ dev, hostname, port });
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
      
      // Skip Socket.IO path - it's already handled by Socket.IO
      // But we still need to let Next.js handle it for the route.js file
      // Socket.IO will intercept WebSocket/polling requests automatically
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('internal server error');
      }
    }
  });

  httpServer.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO available at http://${hostname}:${port}/api/socket`);
    console.log(`> API routes available at http://${hostname}:${port}/api/*`);
  });
});
