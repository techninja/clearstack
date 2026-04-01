/**
 * Canvas WebSocket client — connects to the per-project canvas room.
 * @module utils/canvasSocket
 */

/**
 * @typedef {Object} CanvasConnection
 * @property {(msg: object) => void} send - Send a message to the server
 * @property {() => void} close - Disconnect
 */

/**
 * Connect to the canvas WebSocket for a project.
 * @param {string} projectId
 * @param {(msg: object) => void} onMessage - Called for each incoming message
 * @returns {CanvasConnection}
 */
export function connectCanvas(projectId, onMessage) {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${proto}//${location.host}/ws/canvas?projectId=${projectId}`;
  let ws = new WebSocket(url);
  let closed = false;

  /** @param {WebSocket} socket */
  function bind(socket) {
    socket.onmessage = (e) => onMessage(JSON.parse(e.data));
    socket.onclose = () => {
      if (closed) return;
      setTimeout(() => {
        ws = new WebSocket(url);
        bind(ws);
      }, 2000);
    };
  }

  bind(ws);

  return {
    send: (msg) => {
      if (ws.readyState === 1) ws.send(JSON.stringify(msg));
    },
    close: () => {
      closed = true;
      ws.close();
    },
  };
}
