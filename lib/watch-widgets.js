/**
 * Blessed widget tree for the spec watch dashboard.
 * Constructed once at import time and shared across render calls.
 * @module lib/watch-widgets
 */

import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';

const require = createRequire(import.meta.url);
const blessed = require('blessed');

export const screen = blessed.screen({ smartCSR: true, title: 'Clearstack Spec Watch' });

export const outer = blessed.box({
  top: 0, left: 0, width: '100%', height: '100%',
  border: { type: 'line' },
  label: { text: ' {blue-fg}♥{/blue-fg} Clearstack Spec Watch  q quit  ↑↓ scroll  c copy {/}', side: 'left' },
  tags: true,
  style: { border: { fg: 'cyan' }, label: { fg: 'grey', bold: false } },
});

export const statusBox = blessed.box({
  top: 0, left: 0, width: '100%-2', height: 1,
  tags: true,
  style: { fg: 'white' },
});

export const divider = blessed.line({
  top: 1, left: 0, width: '100%-2', orientation: 'horizontal',
  style: { fg: 'grey' },
});

export const logBox = blessed.scrollablebox({
  top: 2, left: 0, width: '100%-2', bottom: 1,
  tags: true, scrollable: true, alwaysScroll: true,
  scrollbar: { ch: '│', style: { fg: 'grey' } },
  style: { fg: 'white' },
});

outer.append(statusBox);
outer.append(divider);
outer.append(logBox);
screen.append(outer);

const SPINNER = ['⠋  ', '⠙  ', '⠹  ', '⠸  ', '⠼  ', '⠴  ', '⠦  ', '⠧  ', '⠇  ', '⠏  '];
let spinFrame = 0;
export const getSpin = () => SPINNER[spinFrame % SPINNER.length];

const spinInterval = setInterval(() => { spinFrame++; screen.render(); }, 80);
spinInterval.unref(); // don't keep process alive just for the spinner

let _quit = () => process.exit(0);
export const setQuit = (fn) => { _quit = fn; };

let _copyNote = '';
export const getCopyNote = () => _copyNote;
let _onCopyNote = () => {};
export const setOnCopyNote = (fn) => { _onCopyNote = fn; };

screen.key(['C-c', 'q'], () => _quit());
screen.key(['pageup', 'up'], () => { logBox.scroll(-1); screen.render(); });
screen.key(['pagedown', 'down'], () => { logBox.scroll(1); screen.render(); });
screen.key(['c'], () => {
  const raw = logBox.getContent()
    .replace(/\{[^}]+\}/g, '')          // blessed tags
    .replace(/\x1b\[[\d;]*m/g, '')       // ANSI escape codes
    .split('\n').slice(1).join('\n')     // drop header line
    .trim();
  if (!raw) return;
  const [cmd, ...args] = process.platform === 'darwin'
    ? ['pbcopy']
    : ['xclip', '-selection', 'clipboard'];
  const proc = execFile(cmd, args);
  proc.stdin.end(raw);
  proc.on('close', (code) => {
    _copyNote = code === 0 ? '{green-fg}  ✓ copied{/}' : '{red-fg}  ✗ copy failed{/}';
    _onCopyNote();
    setTimeout(() => { _copyNote = ''; _onCopyNote(); }, 1500);
  });
  proc.on('error', () => { _copyNote = '{red-fg}  ✗ clipboard unavailable{/}'; _onCopyNote(); });
});
