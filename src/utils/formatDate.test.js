import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, timeAgo } from './formatDate.js';

describe('formatDate', () => {
  it('formats ISO string to readable date', () => {
    assert.equal(formatDate('2024-01-15T09:00:00Z'), 'Jan 15, 2024');
  });

  it('returns empty string for null', () => {
    assert.equal(formatDate(null), '');
  });

  it('returns empty string for undefined', () => {
    assert.equal(formatDate(undefined), '');
  });

  it('returns empty string for invalid date', () => {
    assert.equal(formatDate('not-a-date'), '');
  });
});

describe('timeAgo', () => {
  it('returns "just now" for recent timestamps', () => {
    assert.equal(timeAgo(new Date().toISOString()), 'just now');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    assert.equal(timeAgo(fiveMinAgo), '5 minutes ago');
  });

  it('returns singular form for 1 unit', () => {
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    assert.equal(timeAgo(oneHourAgo), '1 hour ago');
  });

  it('returns empty string for null', () => {
    assert.equal(timeAgo(null), '');
  });
});
