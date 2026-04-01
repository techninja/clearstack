/**
 * Server-Sent Events endpoint and broadcast utility.
 * @module api/events
 */

import { Router } from 'express';

/** @type {Set<import('node:http').ServerResponse>} */
const clients = new Set();

export const eventsRouter = Router();

eventsRouter.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  clients.add(res);
  req.on('close', () => clients.delete(res));
});

/**
 * Broadcast an entity change to all connected SSE clients.
 * @param {string} type - Entity name (singular), e.g. 'project'
 * @param {string} id - Entity ID
 * @param {'created'|'updated'|'deleted'} action
 */
export function broadcast(type, id, action) {
  const data = JSON.stringify({ type, id, action });
  for (const res of clients) {
    res.write(`event: update\ndata: ${data}\n\n`);
  }
}
