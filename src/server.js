/**
 * Express server entry point.
 * Serves static frontend files and mounts the REST API.
 * @module server
 */

import express from 'express';
import { watch } from 'node:fs';
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

// Hot-reload SSE endpoint — broadcasts when any file in src/ changes
/** @type {Set<import('node:http').ServerResponse>} */
const reloadClients = new Set();

app.get('/_reload', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(': connected\n\n');
  reloadClients.add(res);
  req.on('close', () => reloadClients.delete(res));
});

watch('src', { recursive: true }, () => {
  for (const res of reloadClients) res.write('event: reload\ndata: {}\n\n');
});

// Static: serve src/ as root — public/, styles/, components/ all resolve
app.use(express.static('src'));

// SPA fallback — serve index.html for any non-file route
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.includes('.') && !req.path.startsWith('/api')) {
    return res.sendFile('index.html', { root: 'src' });
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
