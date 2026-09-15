/**
 * Re-exports the `globals` package for use in consumer ESLint configs.
 * Avoids consumers needing to install globals separately or reach into
 * node_modules paths.
 *
 * Usage in eslint.config.js:
 *   import globals from '@techninja/clearstack/lib/globals.js';
 *
 * @module lib/globals
 */
export { default } from 'globals';
