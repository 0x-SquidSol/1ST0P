# 1ST0P Information Architecture 

## Purpose

Define the canonical information architecture for 1ST0P so navigation, page ownership, and user flows remain consistent as the platform expands.

This document maps the product requirements into concrete routing and UI structure.

## IA Principles

- Clarity over density: every primary user action should be reachable in 1-2 clicks.
- Trust visible by default: identity, approval state, escrow rules, and reputation are discoverable.
- Contextual depth: global nav gets users to a lane, local nav helps them execute inside it.
- No orphan pages: every page must have a clear parent lane and return path.

## Navigation Model

### Global Top Navigation

- Home (`/`)
- Launch (`/launch`)
- Marketplace (`/marketplace`)
- Trade (`/traders`, route can be renamed later)
- Utilities:
  - Wallet connect/status/action menu
  - Search entry (cross-lane discoverability)

### Context Navigation (Route-Aware Side Navigation)

#### Launch Context

- Overview
- Create
- My Launches
- Docs

#### Marketplace Context

- **Removed from shell:** the marketplace lane uses a full-width primary layout on `/marketplace` and related routes. Discovery, provider samples, category search, and “How it works” live on the page—no left rail.
- Provider application: `/marketplace/apply` (structured intake; **no required email** on the form).
- **Messages / inbox (planned):** platform ↔ applicant (and later provider) **in-app threads** for application status and follow-ups; **admin dashboard** includes the operator view of all threads; **close / end conversation** to archive threads (declined applicants, spam, final decisions). Wallet hub (`Phase 2` commit 21) surfaces the user-side inbox when authenticated.

#### Trade Context

- Pulse
- Watchlist
- Recent Trades

Notes:
- Context nav appears only on pages where secondary depth is needed.
- Home can remain full-width and CTA-first with no side nav.

## Route and Page Inventory

## 1) Home Lane (`/`)

### Current

- Hero/brand section
- Launchpad status widgets and core launch/trade entry blocks

### Planned

- Persona CTA modules:
  - Apply to Launch (teams)
  - View Projects (traders/investors)
  - Apply as Provider (service providers)
  - View Services (buyers/founders)
- Trust explainer snippets beneath each CTA:
  - approval and interview expectations
  - escrow/treasury custody model
  - mandatory review policy for completed services

## 2) Launch Lane (`/launch`)

### Core Pages

- Launch overview
- Team launch application form
- Application status and reviewer outcomes
- Interview scheduling and completion state
- Launch planning and execution checklist
- Launch policy and pricing details

### Launch Lane Rules

- Team is not listed as approved without manual reviewer decision.
- Interview checkpoint must be completed before launch planning.
- Token launch execution is managed manually by 1ST0P operations with team coordination.
- Token metadata can be submitted at application time or later:
  - name
  - ticker
  - logo
  - description

## 3) Marketplace Lane (`/marketplace`)

### Core Pages

- Marketplace shell (`/marketplace`) with section tabs (service search, how-it-works, samples, FAQs)
- Service search lists categories and live suggestions; each category links to **`/marketplace/browse/[slug]`** (one **discovery card per provider who lists that service** — if a team lists three different services, they appear as **three separate cards** across the three category pages and can appear **multiple times** in search when the query matches more than one offering)
- Full provider profile / “ad” (`/marketplace/providers/[slug]`) — shared chrome for every approved provider once applications drive data; **up to three service columns** (1/2/3 wide on desktop) with per-service tags, rates, reviews, and header slots for Website / X / GitHub
- Buyer hiring/work order flow
- Milestone/timeboxed contract setup
- Escrow and payout state views
- **Messages** (user inbox for application threads; ships with auth + admin queue); wallet hub surfaces the same threads for signed-in users when that ships.
- **Admin** (`/admin`, staff): secured provider-application queue and approval → public listing; staff sign-in uses env vars documented in `web/.env.example` and **`web/local-secrets.example.env`** (real values only in gitignored **`local-secrets.env`**).
  - **Roadmap — unified staff messaging:** fold operator-facing chat into this dashboard as **one messaging system** with **separate organized lanes** operators can switch between: **(1) applicant / provider-application conversations**, **(2) buyer–seller deal conversations** (hire, engagement, escrow), **(3) help / support** (when integrated). Interim applicant threads may stay on `/internal/messages` until merged.
  - **Roadmap — queue UX:** list every real submission; when the queue is empty or for onboarding, show a **sample or pinned row** (e.g. latest submission snapshot or explicit seed) so reviewers always see how applications appear in the dashboard.

### Marketplace Lane Rules

- **Follow-up after provider application form (Phase 2):** the three service-column cards are intentionally generic today. Once intake captures **role/service selections and structured fields**, swing back and render **per-role (per-offering) column templates**—each column’s layout and fields should match what the applicant chose and submitted (see execution plan Phase 2 commit 6 → 7a). Until then, mock data demonstrates columns, scoped reviews, and social link slots only.
- Provider applications are manually reviewed before listing.
- Discovery cards (browse, search suggestions, sample listings) stay minimal: **provider name**, **service name**, **star row** (merged + per-service scoped reputation), **review count in brackets** — no review text or rates on the card; full detail on **`/marketplace/providers/[slug]`**.
- No standalone reviews destination is required.
- Buyer must submit mandatory completion feedback:
  - 1-5 stars
  - minimum 50-character written review
- Final closeout remains blocked until required review payload is submitted.

### Trust Copy Requirements (Buyer + Provider Surfaces)

- Funds are held in treasury/escrow until agreed completion criteria are met.
- Partial releases can be milestone-based or timeboxed (daily/weekly).
- Dispute outcomes can trigger partial/full refunds on unmet deliverables.

## 4) Trade Lane (`/traders` + project pages)

### Core Pages

- Market pulse overview (`/`)
- Project browse / directory (`/traders`, anchored list `#project-directory`) — on-chain program accounts, search + sort
- Project detail / trade (`/coin/[mint]`)
- Watchlist and recent activity modules

### Trade Lane Rules

- Listings must show lifecycle segmentation:
  - prelaunch/presale
  - launched/live
  - archived/inactive
- Listings and detail pages expose trust context:
  - team verification state
  - interview/roadmap completion
  - qualification rationale for being listed

## Cross-Lane Entity Model

### Shared Entities

- Team
- Provider
- Buyer
- Project
- Token
- Application
- Review
- Escrow Contract

### Shared Status Concepts

- `draft`
- `submitted`
- `under_review`
- `interview_required`
- `approved`
- `rejected`
- `active`
- `completed`
- `disputed`
- `refunded`

These statuses should map to both backend state and frontend badges/copy.

## Primary CTA Routing Map

- Home -> Apply to Launch -> Launch application flow (`/launch`)
- Home -> View Projects -> Trade/project discovery (`/traders`)
- Home -> Apply as Provider -> Provider onboarding (`/marketplace`)
- Home -> View Services -> Provider listings (`/marketplace`)

## What Is Already Implemented vs Planned

### Implemented

- Global top nav shell
- Context-aware side nav framework
- Global footer
- Base lane routes:
  - `/`
  - `/launch`
  - `/marketplace`
  - `/traders`

### Planned

- Full page sets and forms under each lane
- Manual reviewer dashboards and approval workflows
- Reputation and mandatory review enforcement UI
- Rich project/trader intelligence pages

## Definition of Done (Phase 0 / Commit 2)

- Global and contextual navigation is documented and matches current shell behavior.
- Every primary lane has explicit page ownership and lane-specific rules.
- Manual approval and trust-gating requirements are represented in IA, not only in PRD text.
- CTA routing from homepage to lane destinations is explicitly mapped.
