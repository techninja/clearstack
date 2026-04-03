# Clearstack POC — Application Spec

This is the companion example app for the Clearstack specification.
It implements a project/task tracker to exercise every pattern in the spec.

## Purpose

Prove that the spec works end-to-end: API-backed entities, localStorage state,
realtime sync via SSE, schema-driven endpoints, and atomic design components —
all served as raw ES modules with zero build tools.

## Features

| Feature            | Entities | Patterns Exercised                           |
| ------------------ | -------- | -------------------------------------------- |
| Project management | Project  | CRUD, schema discovery, validation, SSE sync |
| Task tracking      | Task     | Filtered lists, drag reorder, status enums   |

See [ENTITIES.md](./ENTITIES.md) for field definitions and relationships.
