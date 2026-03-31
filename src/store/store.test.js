import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { store } from 'hybrids';

import AppState from '../store/AppState.js';
import UserPrefs from '../store/UserPrefs.js';
import ProjectModel from '../store/ProjectModel.js';
import TaskModel from '../store/TaskModel.js';

describe('AppState (singleton)', () => {
  it('has no id field (singleton)', () => {
    assert.equal(AppState.id, undefined);
  });

  it('has expected default values', () => {
    assert.equal(AppState.theme, 'light');
    assert.equal(AppState.sidebarOpen, true);
    assert.equal(AppState.activeFilter, 'all');
  });

  it('has a localStorage storage connector', () => {
    const connector = AppState[store.connect];
    assert.equal(typeof connector.get, 'function');
    assert.equal(typeof connector.set, 'function');
  });
});

describe('UserPrefs (singleton)', () => {
  it('has no id field (singleton)', () => {
    assert.equal(UserPrefs.id, undefined);
  });

  it('has expected default values', () => {
    assert.equal(UserPrefs.defaultView, 'list');
    assert.equal(UserPrefs.compactMode, false);
  });

  it('has a localStorage storage connector', () => {
    const connector = UserPrefs[store.connect];
    assert.equal(typeof connector.get, 'function');
    assert.equal(typeof connector.set, 'function');
  });
});

describe('ProjectModel (enumerable)', () => {
  it('has id: true (enumerable)', () => {
    assert.equal(ProjectModel.id, true);
  });

  it('has expected fields with defaults', () => {
    assert.equal(ProjectModel.name, '');
    assert.equal(ProjectModel.description, '');
    assert.equal(ProjectModel.status, 'active');
    assert.equal(ProjectModel.createdAt, '');
  });

  it('has API storage connector with get, set, list', () => {
    const connector = ProjectModel[store.connect];
    assert.equal(typeof connector.get, 'function');
    assert.equal(typeof connector.set, 'function');
    assert.equal(typeof connector.list, 'function');
  });
});

describe('TaskModel (enumerable)', () => {
  it('has id: true (enumerable)', () => {
    assert.equal(TaskModel.id, true);
  });

  it('has expected fields with defaults', () => {
    assert.equal(TaskModel.projectId, '');
    assert.equal(TaskModel.title, '');
    assert.equal(TaskModel.status, 'todo');
    assert.equal(TaskModel.priority, 'med');
    assert.equal(TaskModel.createdAt, '');
  });

  it('has API storage connector with get, set, list', () => {
    const connector = TaskModel[store.connect];
    assert.equal(typeof connector.get, 'function');
    assert.equal(typeof connector.set, 'function');
    assert.equal(typeof connector.list, 'function');
  });
});
