/**
 * Express server entry point.
 * @module server
 */

import express from 'express';
import { watch } from 'node:fs';
import { entityRouter } from './api/entities.js';
import { eventsRouter } from './api/events.js';

const app = express();

app.use(express.json());

app.use('/api', eventsRouter);
app.use('/api', entityRouter);

/** @type {Set<import('node:http').ServerResponse>} */
const reloadClients = new Set();

app.get('/_reload', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.write(': connected\n\n');
  reloadClients.add(res);
  req.on('close', () => reloadClients.delete(res));
});

watch('src', { recursive: true }, () => {
  for (const res of reloadClients) res.write('event: reload\ndata: {}\n\n');
});

app.use(express.static('src'));

// SPA fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.includes('.') && !req.path.startsWith('/api')) {
    return res.sendFile('index.html', { root: 'src' });
  }
  next();
});

/**
 * Start the server.
 * @param {number} [port=3000]
 * @returns {import('node:http').Server}
 */
export function start(port = {{port}}) {
  const server = app.listen(port, () => console.log(`http://localhost:${port}`));
  server.on('error', (/** @type {NodeJS.ErrnoException} */ err) => {
    if (err.code === 'EADDRINUSE') console.error(`Port ${port} in use. Try: PORT=4354 npm start`);
    else console.error(err);
    process.exit(1);
  });
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start(parseInt(process.env.PORT) || {{port}});
}

export default app;
