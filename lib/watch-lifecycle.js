/**
 * Watch lifecycle — quit, self-restart, and fs.watch setup.
 * @module lib/watch-lifecycle
 */

import { watch } from 'node:fs';
import { existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { destroyScreen, setQuit } from './watch-ui.js';
import { setOnCopyNote } from './watch-widgets.js';

/**
 * Register quit + restart handlers and start fs.watch on project and lib dirs.
 * @param {{ serverRow: object|null, specRows: object[], projectDir: string, watchDirs: string[], schedule: (ext: string) => void, renderNote: () => void }} ctx
 */
export function setupLifecycle(ctx) {
  const { serverRow, specRows, projectDir, watchDirs, schedule, renderNote, ignore } = ctx;

  const quit = () => {
    serverRow?.kill();
    destroyScreen();
    const passing = specRows.filter((r) => r.pass).length;
    console.log(`Spec watch stopped. Final state: ${passing}/${specRows.length} checks passing`);
    process.exit(0);
  };

  const restart = () => {
    serverRow?.kill();
    destroyScreen();
    console.log('\nSpec files changed — run `npm run spec watch` to restart.');
    process.exit(0);
  };

  setQuit(quit);
  setOnCopyNote(renderNote);
  process.on('SIGINT', quit);

  for (const dir of watchDirs) {
    watch(resolve(projectDir, dir), { recursive: true }, (_event, filename) => {
      if (!filename) return;
      if (ignore?.some((seg) => filename.includes(seg))) return;
      schedule(extname(filename), filename);
    });
  }

  for (const dir of ['lib', 'bin'].filter((d) => existsSync(resolve(projectDir, d)))) {
    watch(resolve(projectDir, dir), { recursive: true }, restart);
  }
}
