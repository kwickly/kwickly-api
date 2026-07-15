# API Client Integration: Elysia Eden

**Date:** 2026-07-16
**Domain:** Architecture & Infrastructure
**Status:** Approved & Implemented

## Context
Our frontend applications (`kwickly-admin-web` and `kwickly-client`) were previously consuming the API using raw Axios, leading to fragile, manually-typed interfaces. This broke the End-to-End type safety promise of a full TypeScript stack.

## Decision
As the industry best practice, we have adopted **Elysia Eden**, the official E2E type safety client for ElysiaJS. 
The backend will now export the unified `App` type from `server.ts`. Both frontend repositories will consume this type using the Eden Treaty client.

## Implications
- No more manual interface definitions for API responses.
- Breaking changes in the API will instantly cause type errors in the frontend build pipelines.
- Enhanced developer experience with IDE autocompletion for API routes, query params, and body payloads.
