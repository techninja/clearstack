/**
 * JSON Schema + form layout registry for all entities.
 * Each entry has { schema, layout } where layout defines form structure.
 * @module api/schemas
 */

/** @type {Map<string, { schema: object, layout: object }>} */
export const schemas = new Map();

schemas.set('projects', {
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Project',
    type: 'object',
    required: ['name'],
    properties: {
      id: { type: 'string', format: 'uuid', readOnly: true },
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        title: 'Name',
        description: 'Project name',
        placeholder: 'My Project',
      },
      description: {
        type: 'string',
        maxLength: 1000,
        default: '',
        title: 'Description',
        description: 'Brief summary of the project',
      },
      status: {
        type: 'string',
        enum: ['active', 'archived'],
        enumTitles: ['Active', 'Archived'],
        default: 'active',
        title: 'Status',
        description: 'Current project status',
      },
      createdAt: { type: 'string', format: 'date-time', readOnly: true },
    },
  },
  layout: {
    groups: [
      { fields: ['name'], columns: 1 },
      { fields: ['description'], columns: 1 },
      { fields: ['status'], columns: 1 },
    ],
    actions: { align: 'right' },
  },
});

schemas.set('tasks', {
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Task',
    type: 'object',
    required: ['title', 'projectId'],
    properties: {
      id: { type: 'string', format: 'uuid', readOnly: true },
      projectId: {
        type: 'string',
        format: 'uuid',
        title: 'Project',
        description: 'Parent project ID',
        writeOnly: true,
      },
      title: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        title: 'Title',
        description: 'Task title',
        placeholder: 'What needs to be done?',
      },
      status: {
        type: 'string',
        enum: ['todo', 'doing', 'done'],
        enumTitles: ['To Do', 'In Progress', 'Done'],
        default: 'todo',
        title: 'Status',
        description: 'Current progress',
      },
      priority: {
        type: 'string',
        enum: ['low', 'med', 'high'],
        enumTitles: ['Low', 'Medium', 'High'],
        default: 'med',
        title: 'Priority',
        description: 'Urgency level',
      },
      sortOrder: { type: 'number', default: 0, writeOnly: true },
      createdAt: { type: 'string', format: 'date-time', readOnly: true },
    },
  },
  layout: {
    groups: [
      { fields: ['title'], columns: 1 },
      { fields: ['status', 'priority'], columns: 2 },
    ],
    actions: { align: 'right' },
  },
});
