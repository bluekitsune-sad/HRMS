# ArtFlow — Creative Studio Operating System

> People. Projects. Artists. Payments. One Studio.

An internal HRMS + creative workforce platform for digital art studios, built per the
PRD (`prd.md`). Unlike a generic HR system, ArtFlow answers not just *"who works here?"*
but *"what are they good at, what are they working on, and what can they pick up next?"*

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions, Turbopack)
- **TypeScript**
- **Tailwind CSS v4** + shadcn-style UI primitives
- **MongoDB** (Atlas) via Mongoose
- **Auth.js (NextAuth v5)** — credentials provider, JWT sessions
- **Zod** input validation, **bcryptjs** password hashing

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment:

   ```bash
   cp .env.example .env.local
   ```

   Then set:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `AUTH_SECRET` — generate with `npx auth secret`
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — initial admin login

3. Seed the database (admin user + departments + sample employees):

   ```bash
   npm run seed
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 and sign in with the seeded admin email/password.

## Sprint 1 (foundation) — what's included

- **Authentication** — Auth.js v5 credentials + JWT sessions, proxied route protection
- **Roles & RBAC** — Admin, HR, Manager/Art Director, Artist, Finance. Enforced
  server-side in every page and action (`src/lib/rbac.ts`); hidden UI is never the
  authorization boundary (PRD §39)
- **Employee management** — list with search/filter, create, edit, detail view,
  salary visibility restricted by role, optional login-account creation
- **Departments** — CRUD with member counts and delete guard
- **Dashboard** — role-aware shell with live studio counts
- **Audit log** — employee creates/updates, salary changes, department changes
  recorded per PRD §40 (`src/models/AuditLog.ts`)

## Roadmap (per PRD §41)

| Sprint | Focus |
| ------ | ----- |
| 2 — HR | Attendance, leave, documents, self-service |
| 3 — Finance | Payroll, payment records, payment-proof upload + verification |
| 4 — Creative Ops | Projects, task marketplace, atomic claim, submissions, review/revision |
| 5 — Artist Intelligence | Skills, artist profiles, availability, workload, Creative Match |
| 6 — WOW | Studio Pulse, Artist DNA, Growth Map, advanced analytics |

## Project structure

```
src/
  app/
    (dashboard)/          # authenticated shell (sidebar layout)
      dashboard/          # role-aware dashboard
      employees/          # list, new, [id], [id]/edit + server actions
      departments/        # list + server actions
    login/                # sign-in page + action
    api/auth/[...nextauth]/
  components/             # UI primitives + feature components
  lib/
    auth.ts               # Auth.js config
    rbac.ts               # server-side role/permission checks
    db.ts                 # Mongoose connection cache
    audit.ts              # audit log writer
    validation.ts         # Zod schemas
  models/                 # User, Employee, Department, AuditLog
  proxy.ts                # Next 16 middleware (session-cookie gate)
scripts/seed.ts           # database seed
```

## Security notes (PRD §39)

- Passwords hashed with bcrypt (12 rounds)
- JWT session strategy, 7-day expiry
- Every server action re-checks auth + role; the sidebar only hides links as UX
- Salary data is filtered server-side (`can(role, "salary.read")`)
- All form input validated with Zod on the server
