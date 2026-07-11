# Kwickly API Documentation Master Index & Audit Log

Welcome to the Kwickly API docs folder. We maintain a strict chronological Architecture Decision Record (ADR) format here, mirroring the `kwickly-admin-web` repository structure.

## How to Maintain This Folder

1. **New Topics:** Any new research, tracker, or architectural decision MUST be placed in a new folder.
2. **Naming Convention:** Use the ISO 8601 date standard in kebab-case format. Example: `2026-07-12-database-schema-standards`. This guarantees perfect chronological sorting.
3. **Supersession Rule:** When a document is ruled out or replaced, you MUST edit the old document to include a `> [!WARNING] SUPERSEDED` block at the top, pointing to the new document. You must also record this change in the **Audit Log** below.

## Project Timeline & Master Index

- **[2026-06-17-initial-testing](./2026-06-17-initial-testing)**: Initial legacy testing progress tracker.
- **[2026-06-23-api-implementation](./2026-06-23-api-implementation)**: Original API implementation phases and roadmap.
- **[2026-06-28-deployment-and-context](./2026-06-28-deployment-and-context)**: Infrastructure, deployment architecture, and context retrieval strategies.
- **[2026-07-12-database-schema-standards](./2026-07-12-database-schema-standards)**: Definitive guidelines on Kwickly's database architecture, including global soft-deletes, multi-tenant indexing (`idxTenant`), and tenant lifecycle tracking (Suspension & Termination).

## Audit Log of Changed Decisions

- **12th Jul, 26**: Transitioned `kwickly-api/docs` into a chronological ADR structure to match the frontend repo standards.
- **[2026-07-12-global-status-enums](./2026-07-12-global-status-enums)**: Industry standard Global Status Enums architecture and Soft Deletes documentation.
