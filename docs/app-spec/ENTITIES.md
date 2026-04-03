# Entities

## Project

The top-level organizational unit.

| Field       | Type          | Required | Notes                          |
| ----------- | ------------- | -------- | ------------------------------ |
| id          | string (uuid) | auto     | Read-only, generated on create |
| name        | string        | yes      | 1–200 chars                    |
| description | string        | no       | Max 1000 chars                 |
| status      | enum          | no       | `active` (default), `archived` |
| createdAt   | date-time     | auto     | Read-only                      |

## Task

A work item belonging to a Project.

| Field     | Type          | Required | Notes                             |
| --------- | ------------- | -------- | --------------------------------- |
| id        | string (uuid) | auto     | Read-only, generated on create    |
| projectId | string (uuid) | yes      | Foreign key → Project.id          |
| title     | string        | yes      | 1–200 chars                       |
| status    | enum          | no       | `todo` (default), `doing`, `done` |
| priority  | enum          | no       | `low`, `med` (default), `high`    |
| sortOrder | number        | no       | Manual ordering within a project  |
| createdAt | date-time     | auto     | Read-only                         |

## Relationships

```
Project 1 ──── * Task
```

Tasks are filtered by `projectId` via `GET /api/tasks?projectId=<id>`.
Deleting a project does not cascade — tasks become orphaned by design
(the UI filters them out).
