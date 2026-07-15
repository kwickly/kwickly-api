# Automated Schema Compliance via Git Hooks

**Date:** 2026-07-16
**Domain:** Database & Schema
**Status:** Approved & Implemented

## Context
We established strict rules in `2026-07-12-database-standards.md` regarding Multi-Tenant Indexing (`idxTenant`) and Zero Hard-Deletes (`deletedAt`). However, relying entirely on developer memory during PRs is prone to human error, which could lead to critical bugs or data leakage across tenants.

## Decision
We are automating the enforcement of these schema standards at the version control level using `husky` and `lint-staged`.

## Implementation
1. A custom Node script (`scripts/check-schema.ts`) has been written.
2. The script parses all TypeScript files in `src/db/schema/*`.
3. If a table defines a `tenantId` column but fails to export an `idxTenant` index, the script throws an error.
4. If a table lacks the `deletedAt` timestamp (violating the soft-delete rule), the script throws an error.
5. This script runs automatically via Husky on every `git commit`. If the check fails, the commit is aborted.
