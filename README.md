<div align="center">
  <h1>🚀 Kwickly API</h1>
  <p><strong>The high-performance backend core for the Kwickly Restaurant OS.</strong></p>
</div>

<br />

## 📖 Overview

Kwickly API is a robust, modular monolith designed to power the entire Kwickly B2B SaaS platform. It handles multi-tenant restaurant configurations, secure role-based access control, real-time Kitchen Order Tickets (KOTs), payments, staff/payroll management, inventory, and CRM.

Built for extreme low-latency at the edge, the API runs on **Bun** and leverages **ElysiaJS** to deliver near-instant responses to customer mobile apps, staff devices, and admin web dashboards.

## 🛠 Technology Stack

- **Runtime:** [Bun](https://bun.sh/)
- **Framework:** [ElysiaJS](https://elysiajs.com/) (End-to-end Type Safety)
- **Database:** PostgreSQL via [Neon Serverless](https://neon.tech)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Caching:** TCP Redis (via native `Bun.redis` client)
- **Logging:** Pino (Structured JSON Logging)

## 🚀 Getting Started

### 1. Prerequisites
- Install **Bun** (v1.3+)
- Ensure you have a running PostgreSQL database (Docker or NeonDB).

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/kwickly/kwickly-api.git
cd kwickly-api

# Install dependencies blazingly fast
bun install
```

### 3. Environment Configuration
Copy the sample environment file and fill in your database credentials:
```bash
cp .env.example .env
```
*(Note: If you are running PostgreSQL locally via Docker, ensure your `DATABASE_URL` contains `localhost` and the API will automatically switch to standard TCP drivers.)*

### 4. Database Setup
To initialize the tables in your local database:
```bash
bun run db:push
```

### 5. Running the API
```bash
# Start the development server with Hot Module Reloading
bun run dev

# Start in production mode
bun run start
```
The API will be available at `http://localhost:3000`. Swagger documentation is automatically generated at `http://localhost:3000/swagger`.

## 🏗 Architectural Guidelines

Kwickly API adheres strictly to enterprise-grade architectural standards:

- **Soft Deletes Only:** The system forbids cascading deletes. All entities utilize `deletedAt` timestamps to preserve referential integrity and prevent accidental data loss.
- **UUIDs:** All primary keys across the database are native PostgreSQL UUIDs.
- **Cache-Aside:** High-read, low-write operations (like fetching Menus and Branch Configs) are wrapped in custom Redis `withCache` helpers.
- **Automated Audit Logs:** The system features a globally registered Elysia `auditPlugin` that automatically tracks and records all mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) with user, tenant, and IP context without slowing down the request lifecycle.
- **Zero-Downtime Migrations:** Migrations must always be additive (Expand & Contract pattern).
- **Production Readiness:** Out-of-the-box support for Edge Rate Limiting, HTTP Security Headers, Global Error Sanitization, and Graceful Server Shutdowns (SIGINT/SIGTERM handling) for true zero-downtime reliability.

## 📄 License
Proprietary software. All rights reserved by Kwickly.
