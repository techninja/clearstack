/**
 * Dev server child process manager for spec watch dashboard.
 * Spawns the server, captures output, and maintains a status row
 * that the dashboard can render without any extra logic.
 * @module lib/server-proc
 */

import { spawn, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Detect the dev server command. Prefers SPEC_SERVER_CMD from env,
 * then probes common entry points. Returns null for static projects.
 * @param {string} dir @param {object} cfg @returns {string|null}
 */
export function detectServerCmd(dir, cfg) {
  if (cfg.serverCmd) return cfg.serverCmd;
  for (const entry of ['src/server.js', 'server.js', 'index.js']) {
    if (existsSync(resolve(dir, entry))) return `node --watch ${entry}`;
  }
  return null;
}

/**
 * Kill whatever process is listening on a given port.
 * No-ops silently if nothing is found.
 * @param {number} port
 */
export function killPort(port) {
  try {
    const pid = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf-8' }).trim();
    if (pid) execSync(`kill ${pid}`);
  } catch { /* nothing listening, or kill already gone */ }
}

/** @typedef {'starting'|'running'|'restarting'|'crashed'|'disabled'} ServerStatus */

/**
 * @typedef {object} ServerRow
 * @property {'server'} key
 * @property {string} label
 * @property {ServerStatus} status
 * @property {boolean|null} pass
 * @property {string} detail
 * @property {string} [_errLine]
 * @property {() => void} kill
 */

/** Lines from Node --watch we don't want to surface as the detail. */
const NOISE = /^Debugger|^Waiting for|^\s*$/;

/**
 * Spawn the dev server and return a live ServerRow.
 * The row object is mutated in place as output arrives — the dashboard
 * just reads it on each render cycle.
 *
 * @param {string} cmd   e.g. 'node --watch src/server.js'
 * @param {string} cwd   project root
 * @param {object} env   merged into process.env for the child
 * @param {() => void} onUpdate  called whenever status/detail changes
 * @returns {ServerRow}
 */
export function spawnServer(cmd, cwd, env, onUpdate) {
  /** @type {ServerRow} */
  const row = {
    key: 'server',
    label: 'server',
    status: 'starting',
    pass: null,
    detail: 'starting…',
    kill: () => {},
  };

  const [bin, ...args] = cmd.split(/\s+/);
  const child = spawn(bin, args, {
    cwd,
    env: { ...process.env, ...env, FORCE_COLOR: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  row.kill = () => child.kill('SIGTERM');

  /**
   *
   */
  function onLine(line, isStderr) {
    line = line.trim();
    if (!line || NOISE.test(line)) return;

    if (/restarting/i.test(line)) {
      row.status = 'restarting';
      row.pass = null;
      row.detail = 'restarting…';
      onUpdate();
      return;
    }
    // Errors on stderr always override — don't let a stale URL persist
    if (isStderr || /error|EADDR|EACCES|ENOENT/i.test(line)) {
      row.status = 'crashed';
      row.pass = false;
      // Prefer 'Error: ...' lines; only upgrade, never downgrade
      const isRich = /^Error:/i.test(line);
      if (!row._errLine || (isRich && !/^Error:/i.test(row._errLine))) {
        row._errLine = line.slice(0, 60);
        row.detail = row._errLine;
        onUpdate();
      }
      return;
    }
    if (/https?:\/\//i.test(line) || /listening|started|ready/i.test(line)) {
      row.status = 'running';
      row.pass = true;
      row.detail = line;
      onUpdate();
      return;
    }
    if (row.status !== 'running') {
      row.detail = line.slice(0, 60);
      onUpdate();
    }
  }

  child.stdout?.setEncoding('utf-8');
  child.stderr?.setEncoding('utf-8');
  /** @type {Array<[import('stream').Readable|null, boolean]>} */
  const streams = [[child.stdout, false], [child.stderr, true]];
  for (const [stream, isStderr] of streams) {
    if (!stream) continue;
    let buf = '';
    stream.on('data', (chunk) => {
      buf += chunk;
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const l of lines) onLine(l, isStderr);
    });
  }

  child.on('close', (code, signal) => {
    if (signal === 'SIGTERM') return;
    row.status = 'crashed';
    row.pass = false;
    if (!row.detail || row.detail === 'starting…' || row.detail === 'restarting…') {
      row.detail = `exited (code ${code ?? signal})`;
    }
    onUpdate();
  });

  return row;
}
