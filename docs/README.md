# Kwickly API Documentation

Welcome to the documentation for the Kwickly API repository. 
This folder contains Architecture Decision Records (ADRs), database schema standards, and implementation plans.

## 📂 Documentation Structure
To prevent documentation fatigue, we organize files by **Domain (Topic) -> Chronological Order**. 
Deprecated or superseded decisions are moved to the `archive/` folder.

### 🏛️ Architecture & Infrastructure
Decisions regarding the core backend systems, API implementation, and deployment context.
- [2026-06-23: API Implementation](architecture-and-infrastructure/2026-06-23-api-implementation/api-implementation-phases.md)
- [2026-06-28: Deployment and Context](architecture-and-infrastructure/2026-06-28-deployment-and-context/deployment-architecture.md)
- [2026-07-16: API Client Integration](architecture-and-infrastructure/2026-07-16-api-client-integration/api-client-integration.md)
- [2026-07-19: KDS Kanban Redesign & ETA System](architecture-and-infrastructure/2026-07-19-kds-kanban-and-eta/kds-kanban-and-eta.md)

### 🗄️ Database & Schema
Decisions regarding the PostgreSQL database, Drizzle ORM, state management, and conventions.
- [2026-07-12: Database Schema Standards](database-and-schema/2026-07-12-database-schema-standards/database-standards.md)
- [2026-07-12: Global Status Enums](database-and-schema/2026-07-12-global-status-enums/global-status-enums.md)
- [2026-07-16: Automated Schema Compliance](database-and-schema/2026-07-16-automated-schema-compliance/automated-schema-compliance.md)
- [2026-07-19: Metered Billing & Custom Tiers Database Schema](database-and-schema/2026-07-19-metered-billing-and-custom-tiers/billing-schema.md)
- [2026-07-19: Menu Item Enrichment — Tags, Nutrition & Availability](database-and-schema/2026-07-19-menu-item-enrichment/menu-item-enrichment.md)
- [2026-07-19: Table Management & Order Session Architecture 🔴 Phase 9](database-and-schema/2026-07-19-table-management-and-order-sessions/table-management-and-order-sessions.md)

### 📈 Progress & Planning
- [2026-07-19: Master Progress Tracker ← **START HERE**](progress-and-planning/2026-07-19-master-progress-tracker/progress-tracker.md)

### 🧪 Testing & QA
- [2026-06-17: Initial Testing](testing-and-qa/2026-06-17-initial-testing/testing-progress.md)

### 📦 Archive
*(Superseded or deprecated decisions live in `docs/archive/`)*

---

**Rule of Thumb for adding new Docs:**
1. Pick the correct domain folder (or create one if it doesn't fit).
2. Create a folder named `YYYY-MM-DD-short-topic-name`.
3. Add your markdown file inside.
4. Update this `README.md` to link to your new file!
5. Update the **Master Progress Tracker** if phases changed.

