import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statusColor, statusTitle, priorityColor, priorityTitle } from './statusColors.js';

describe('statusColor', () => {
  it('maps active to success', () => assert.equal(statusColor('active'), 'success'));
  it('maps doing to warning', () => assert.equal(statusColor('doing'), 'warning'));
  it('maps done to success', () => assert.equal(statusColor('done'), 'success'));
  it('defaults to info for unknown', () => assert.equal(statusColor('xyz'), 'info'));
});

describe('statusTitle', () => {
  it('maps todo to To Do', () => assert.equal(statusTitle('todo'), 'To Do'));
  it('maps doing to In Progress', () => assert.equal(statusTitle('doing'), 'In Progress'));
  it('maps active to Active', () => assert.equal(statusTitle('active'), 'Active'));
  it('returns raw value for unknown', () => assert.equal(statusTitle('xyz'), 'xyz'));
});

describe('priorityColor', () => {
  it('maps high to danger', () => assert.equal(priorityColor('high'), 'danger'));
  it('maps med to warning', () => assert.equal(priorityColor('med'), 'warning'));
  it('maps low to info', () => assert.equal(priorityColor('low'), 'info'));
});

describe('priorityTitle', () => {
  it('maps med to Medium', () => assert.equal(priorityTitle('med'), 'Medium'));
  it('maps high to High', () => assert.equal(priorityTitle('high'), 'High'));
  it('returns raw value for unknown', () => assert.equal(priorityTitle('xyz'), 'xyz'));
});
