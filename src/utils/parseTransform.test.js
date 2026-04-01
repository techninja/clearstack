import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyShapeTransform, shiftTransform, unrotate } from './parseTransform.js';

describe('applyShapeTransform', () => {
  it('applies translate to bbox', () => {
    const b = applyShapeTransform({ x: 0, y: 0, w: 24, h: 24 }, 'translate(100,200) scale(1)');
    assert.equal(b.x, 100);
    assert.equal(b.y, 200);
  });

  it('applies scale to bbox', () => {
    const b = applyShapeTransform({ x: 0, y: 0, w: 24, h: 24 }, 'translate(0,0) scale(5)');
    assert.equal(b.w, 120);
    assert.equal(b.h, 120);
  });

  it('applies translate and scale together', () => {
    const b = applyShapeTransform({ x: 0, y: 0, w: 24, h: 24 }, 'translate(50,50) scale(2)');
    assert.equal(b.x, 50);
    assert.equal(b.y, 50);
    assert.equal(b.w, 48);
    assert.equal(b.h, 48);
  });
});

describe('shiftTransform', () => {
  it('shifts translate by dx, dy', () => {
    const result = shiftTransform('translate(100.0,200.0) scale(5)', 10, -20);
    assert.ok(result.includes('translate(110.0,180.0)'));
    assert.ok(result.includes('scale(5)'));
  });
});

describe('unrotate', () => {
  it('returns unchanged deltas for no rotation', () => {
    const [dx, dy] = unrotate(10, 20, 0);
    assert.equal(dx, 10);
    assert.equal(dy, 20);
  });

  it('returns unchanged deltas for undefined rotation', () => {
    const [dx, dy] = unrotate(10, 20, undefined);
    assert.equal(dx, 10);
    assert.equal(dy, 20);
  });

  it('rotates 90 degrees correctly', () => {
    const [dx, dy] = unrotate(10, 0, 90);
    assert.ok(Math.abs(dx) < 0.01);
    assert.ok(Math.abs(dy - -10) < 0.01);
  });
});
