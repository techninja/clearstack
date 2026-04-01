/**
 * Express server entry point.
 * Serves static frontend files and mounts the REST API.
 * @module server
 */

import express from 'express';
import { entityRouter } from './src/api/entities.js';
import { eventsRouter } from './src/api/events.js';
import { attachCanvasWS } from './src/api/canvas-ws.js';

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Static: app shell + vendored deps
app.use(express.static('public'));

// Static: application ES modules served as-is
app.use('/src', express.static('src'));

// API
app.use('/api', eventsRouter);
app.use('/api', entityRouter);

// SPA fallback — serve index.html for any non-file route
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.includes('.')) {
    return res.sendFile('index.html', { root: 'public' });
  }
  next();
});

/**
 * Start the server on the given port.
 * @param {number} [port=3000]
 * @returns {import('node:http').Server}
 */
export function start(port = 3000) {
  const server = app.listen(port, () => {
    console.log(`http://localhost:${port}`);
  });

  attachCanvasWS(server);

  server.on('error', (/** @type {NodeJS.ErrnoException} */ err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Try: PORT=4354 npm start`);
    } else {
      console.error(err);
    }
    process.exit(1);
  });

  return server;
}

// Auto-start when run directly (not imported by tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  start(parseInt(process.env.PORT) || 3000);
}

export default app;
