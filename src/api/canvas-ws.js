/**
 * WebSocket server for real-time canvas collaboration.
 * Each project has its own room. Broadcasts drawing and transform events.
 * @module api/canvas-ws
 */

import { WebSocketServer } from 'ws';
import { getRecord, setRecord } from './db.js';

/** @type {Map<string, Set<import('ws').WebSocket>>} */
const rooms = new Map();

/**
 * Attach WebSocket server to an HTTP server.
 * @param {import('node:http').Server} server
 */
export function attachCanvasWS(server) {
  const wss = new WebSocketServer({ server, path: '/ws/canvas' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', 'http://localhost');
    const projectId = url.searchParams.get('projectId');
    if (!projectId) return ws.close(4000, 'Missing projectId');

    // Join room
    if (!rooms.has(projectId)) rooms.set(projectId, new Set());
    rooms.get(projectId).add(ws);

    // Send current canvas state
    const canvas = getRecord('canvases', projectId);
    ws.send(JSON.stringify({ type: 'init', objects: canvas?.objects || [] }));

    ws.on('message', (raw) => {
      const msg = JSON.parse(String(raw));
      handleMessage(projectId, ws, msg);
    });

    ws.on('close', () => {
      rooms.get(projectId)?.delete(ws);
      if (rooms.get(projectId)?.size === 0) rooms.delete(projectId);
    });
  });
}

/**
 * Handle an incoming canvas message and broadcast to peers.
 * @param {string} projectId
 * @param {import('ws').WebSocket} sender
 * @param {object} msg
 */
function handleMessage(projectId, sender, msg) {
  // Broadcast to all other clients in the room
  broadcast(projectId, sender, msg);

  // Persist state-changing messages
  if (msg.type === 'object:add' || msg.type === 'object:update' || msg.type === 'object:delete') {
    persistCanvas(projectId, msg);
  }
}

/**
 * Send a message to all clients in a room except the sender.
 * @param {string} projectId
 * @param {import('ws').WebSocket} sender
 * @param {object} msg
 */
function broadcast(projectId, sender, msg) {
  const data = JSON.stringify(msg);
  for (const client of rooms.get(projectId) || []) {
    if (client !== sender && client.readyState === 1) client.send(data);
  }
}

/**
 * Apply a mutation to the persisted canvas state.
 * @param {string} projectId
 * @param {object} msg
 */
function persistCanvas(projectId, msg) {
  const canvas = getRecord('canvases', projectId) || { id: projectId, objects: [] };
  const objects = /** @type {any[]} */ (canvas.objects);

  if (msg.type === 'object:add') {
    objects.push(msg.object);
  } else if (msg.type === 'object:update') {
    const idx = objects.findIndex((o) => o.id === msg.object.id);
    if (idx !== -1) objects[idx] = { ...objects[idx], ...msg.object };
  } else if (msg.type === 'object:delete') {
    const idx = objects.findIndex((o) => o.id === msg.id);
    if (idx !== -1) objects.splice(idx, 1);
  }

  setRecord('canvases', projectId, { id: projectId, objects });
}
