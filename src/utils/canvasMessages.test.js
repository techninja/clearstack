import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyCanvasMessage } from './canvasMessages.js';

describe('applyCanvasMessage', () => {
  it('filters invalid objects on init', () => {
    const result = applyCanvasMessage([], {
      type: 'init',
      objects: [
        { type: 'rect', id: 'r1', x: 0, y: 0, w: 10, h: 10 },
        { type: 'path', id: 'p1' }, // missing d
        null,
        { type: 'rect' }, // missing id
        { type: 'text', id: 't1', text: 'hello' },
      ],
    });
    assert.equal(result.length, 2);
  });

  it('adds an object', () => {
    const result = applyCanvasMessage([{ id: '1' }], {
      type: 'object:add',
      object: { id: '2' },
    });
    assert.equal(result.length, 2);
  });

  it('updates an object', () => {
    const result = applyCanvasMessage([{ id: '1', x: 0 }], {
      type: 'object:update',
      object: { id: '1', x: 50 },
    });
    assert.equal(result[0].x, 50);
  });

  it('deletes an object', () => {
    const result = applyCanvasMessage([{ id: '1' }, { id: '2' }], {
      type: 'object:delete',
      id: '1',
    });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, '2');
  });

  it('appends draw:point to path', () => {
    const result = applyCanvasMessage([{ id: 'p1', d: 'M0 0' }], {
      type: 'draw:point',
      id: 'p1',
      x: 10,
      y: 20,
    });
    assert.ok(result[0].d.includes('L10 20'));
  });
});
