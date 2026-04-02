/**
 * Express server entry point.
 * Serves static frontend files and mounts the REST API.
 * @module server
 */

import express from 'express';
import { entityRouter } from './api/entities.js';
import { eventsRouter } from './api/events.js';
import { attachCanvasWS } from './api/canvas-ws.js';

/** @type {any} */
const app = express();

// Parse JSON request bodies
app.use(express.json());

// API (before static so /api routes don't hit the SPA fallback)
app.use('/api', eventsRouter);
app.use('/api', entityRouter);

// Static: serve src/ as root — public/, styles/, components/ all resolve
app.use(express.static('src'));

// SPA fallback — serve index.html for any non-file route
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.includes('.') && !req.path.startsWith('/api')) {
    return res.sendFile('index.html', { root: 'src/public' });
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
