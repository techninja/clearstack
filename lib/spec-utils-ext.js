/**
 * runExtCmd — shell command runner for clearstack.spec.js extensions.
 * @module lib/spec-utils-ext
 */

import { execSync, spawn } from 'node:child_process';
import { elapsed } from './spec-utils.js';

/**
 * Run an arbitrary shell command for a custom extension check.
 * Handles timing, output filtering, and consistent ✅/❌ printing.
 * Ignores lines matching node_modules or any paths in `ignorePaths`.
 * Use this in clearstack.spec.js extensions instead of execSync directly.
 *
 * @param {string} label - Display name for the check
 * @param {string} cmd - Shell command to run
 * @param {{ quiet?: boolean, cwd?: string, ignorePaths?: string[], onProgress?: (line: string) => void }} [opts]
 * @returns {import('./spec-utils.js').CheckResult | Promise<import('./spec-utils.js').CheckResult>}
 */
export function runExtCmd(label, cmd, opts = {}) {
  const start = performance.now();
  const cwd = opts.cwd ?? process.cwd();
  const suffix = () => ` (${elapsed(start)})`;
  const ignoreRe = [
    /[/\\]node_modules[/\\]/,
    ...(opts.ignorePaths ?? []).map((p) => new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))),
  ];
  const filter = (l) => l.trim() && !ignoreRe.some((re) => re.test(l)) && (!opts.lineFilter || opts.lineFilter(l));

  if (opts.onProgress) {
    return new Promise((resolve) => {
      const [bin, ...args] = cmd.split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/);
      const proc = spawn(bin, args, { cwd, shell: true });
      const lines = [];
      const onLine = (chunk) => {
        for (const l of chunk.toString().split('\n')) {
          if (!filter(l)) continue;
          lines.push(l);
          opts.onProgress(l);
        }
      };
      proc.stdout.on('data', onLine);
      proc.stderr.on('data', onLine);
      proc.on('close', (code) => {
        if (code === 0 || lines.length === 0) {
          if (!opts.quiet) console.log(`  ✅ ${label}${suffix()}`);
          resolve({ pass: true, label, time: elapsed(start) });
        } else {
          if (!opts.quiet) {
            console.log(`  ❌ ${label}${suffix()}`);
            for (const l of lines) console.log(`     ${l}`);
          }
          resolve({ pass: false, label, time: elapsed(start), errors: lines });
        }
      });
    });
  }

  try {
    execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf-8' });
    if (!opts.quiet) console.log(`  ✅ ${label}${suffix()}`);
    return { pass: true, label, time: elapsed(start) };
  } catch (err) {
    const out = ((err.stdout || '') + (err.stderr || '')).trim();
    const errors = out.split('\n').filter(filter);
    if (errors.length === 0) {
      if (!opts.quiet) console.log(`  ✅ ${label}${suffix()}`);
      return { pass: true, label, time: elapsed(start) };
    }
    if (!opts.quiet) {
      console.log(`  ❌ ${label}${suffix()}`);
      for (const line of errors) console.log(`     ${line}`);
    }
    return { pass: false, label, time: elapsed(start), errors };
  }
}
