/**
 * Static dev server — serves src/ for the browser with SPA fallback.
 * @module server
 */

import express from 'express';
import { watch } from 'node:fs';

/** @type {any} */
const app = express();

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

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.includes('.')) {
    return res.sendFile('index.html', { root: 'src' });
  }
  next();
});

/** @param {number} [port] */
export function start(port = {{port}}) {
  const server = app.listen(port, () => console.log(`http://localhost:${port}`));
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start(parseInt(process.env.PORT) || {{port}});
}

export default app;
