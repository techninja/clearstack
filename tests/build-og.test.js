/**
 * OG metadata build tests.
 * @module tests/build-og
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildOG, loadRoutes, resolveDataSource } from '../lib/build-og.js';
import { buildMetaTags, interpolate, injectMeta } from '../lib/og-template.js';

let tmp;

before(() => {
  tmp = mkdtempSync(join(tmpdir(), 'clearstack-og-'));
});

after(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('og-template', () => {
  it('buildMetaTags includes required OG tags', () => {
    const tags = buildMetaTags({
      title: 'Hello',
      description: 'World',
      url: 'https://example.com/hello',
    });
    assert.ok(tags.includes('og:title'));
    assert.ok(tags.includes('og:description'));
    assert.ok(tags.includes('og:url'));
    assert.ok(tags.includes('twitter:card'));
  });

  it('buildMetaTags includes image when provided', () => {
    const tags = buildMetaTags({
      title: 'T',
      description: 'D',
      url: '/',
      image: 'https://img.example.com/pic.png',
    });
    assert.ok(tags.includes('og:image'));
    assert.ok(tags.includes('twitter:image'));
  });

  it('buildMetaTags escapes HTML entities', () => {
    const tags = buildMetaTags({
      title: 'A & B "quoted"',
      description: '<script>',
      url: '/',
    });
    assert.ok(tags.includes('&amp;'));
    assert.ok(tags.includes('&quot;'));
    assert.ok(tags.includes('&lt;'));
  });

  it('interpolate resolves dot-notation paths', () => {
    const result = interpolate('{item.name} | {app.title}', {
      item: { name: 'Foo' },
      app: { title: 'Bar' },
    });
    assert.equal(result, 'Foo | Bar');
  });

  it('interpolate returns empty string for missing paths', () => {
    assert.equal(interpolate('{missing.key}', {}), '');
  });

  it('injectMeta replaces title in HTML shell', () => {
    const html = '<html><head><title>Old</title></head><body></body></html>';
    const result = injectMeta(html, {
      title: 'New Title',
      description: 'Desc',
      url: '/',
    });
    assert.ok(!result.includes('<title>Old</title>'));
    assert.ok(result.includes('<title>New Title</title>'));
    assert.ok(result.includes('og:title'));
  });
});

describe('build-og', () => {
  it('loadRoutes returns null when no config exists', () => {
    assert.equal(loadRoutes(tmp), null);
  });

  it('loadRoutes reads clearstack.routes.json', () => {
    const dir = mkdtempSync(join(tmpdir(), 'og-routes-'));
    writeFileSync(join(dir, 'clearstack.routes.json'), JSON.stringify({
      '/about': { title: 'About', description: 'About page' },
    }));
    const routes = loadRoutes(dir);
    assert.deepEqual(routes, { '/about': { title: 'About', description: 'About page' } });
    rmSync(dir, { recursive: true, force: true });
  });

  it('resolveDataSource reads JSON file with path', () => {
    const dir = mkdtempSync(join(tmpdir(), 'og-data-'));
    writeFileSync(join(dir, 'data.json'), JSON.stringify({
      traits: [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }],
    }));
    const items = resolveDataSource('data.json:traits', dir);
    assert.equal(items.length, 2);
    assert.equal(items[0].name, 'Alpha');
    rmSync(dir, { recursive: true, force: true });
  });

  it('resolveDataSource returns [] for missing file', () => {
    assert.deepEqual(resolveDataSource('nope.json:items', tmp), []);
  });

  it('buildOG generates static route pages', () => {
    const dir = mkdtempSync(join(tmpdir(), 'og-build-'));
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src/index.html'),
      '<!doctype html><html><head><title>App</title></head><body></body></html>');
    writeFileSync(join(dir, 'clearstack.routes.json'), JSON.stringify({
      '/about': { title: 'About Us', description: 'Learn more' },
      '/pricing': { title: 'Pricing', description: 'Plans and pricing' },
    }));
    const result = buildOG({ projectDir: dir, outDir: 'dist', baseUrl: 'https://example.com' });
    assert.equal(result.pages, 2);
    assert.equal(result.routes, 2);
    const aboutHtml = readFileSync(join(dir, 'dist/about.html'), 'utf-8');
    assert.ok(aboutHtml.includes('About Us'));
    assert.ok(aboutHtml.includes('og:url'));
    assert.ok(aboutHtml.includes('https://example.com/about'));
    rmSync(dir, { recursive: true, force: true });
  });

  it('buildOG generates dynamic route pages from data source', () => {
    const dir = mkdtempSync(join(tmpdir(), 'og-dynamic-'));
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src/index.html'),
      '<!doctype html><html><head><title>App</title></head><body></body></html>');
    writeFileSync(join(dir, 'traits.json'), JSON.stringify({
      traits: [
        { id: 'brave', name: 'Brave', description: 'Courage trait' },
        { id: 'kind', name: 'Kind', description: 'Kindness trait' },
      ],
    }));
    writeFileSync(join(dir, 'clearstack.routes.json'), JSON.stringify({
      '/traits/:id': {
        title: '{id.name} Trait',
        description: '{id.description}',
        data: 'traits.json:traits',
      },
    }));
    const result = buildOG({ projectDir: dir, baseUrl: 'https://x.com' });
    assert.equal(result.pages, 2);
    const braveHtml = readFileSync(join(dir, 'dist/traits/brave.html'), 'utf-8');
    assert.ok(braveHtml.includes('Brave Trait'));
    assert.ok(braveHtml.includes('Courage trait'));
    rmSync(dir, { recursive: true, force: true });
  });
});
