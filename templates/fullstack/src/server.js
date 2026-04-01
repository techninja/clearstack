/**
 * Express server entry point.
 * @module server
 */

import express from 'express';
import { entityRouter } from './api/entities.js';
import { eventsRouter } from './api/events.js';

const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use('/src', express.static('src'));

app.use('/api', eventsRouter);
app.use('/api', entityRouter);

// SPA fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.includes('.')) {
    return res.sendFile('index.html', { root: 'public' });
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
