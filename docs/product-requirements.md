# 1ST0P Product Requirements 

## Purpose

Define the minimum product contract for 1ST0P so all implementation commits map to a clear user journey, trust model, and acceptance criteria.

This document is intentionally product-facing and implementation-ready.

## Vision Contract

1ST0P is a single home for serious Solana builders and the people who hire or back them.
Every shipped feature must strengthen:

- Discovery: users can quickly find credible teams/providers/projects.
- Credibility: identity, track record, and verification are visible.
- Execution: payments, launches, and outcomes are structured and auditable.

## Primary User Lanes

- Development teams launching tokens
- Traders/investors evaluating and participating in projects
- Service providers offering delivery work
- Buyers/founders hiring providers

## Lane 1: Development Team (Apply to Launch)

### Goal

Allow legitimate teams to launch through a quality-gated process that reduces anonymous, low-accountability launches.

### Required Inputs

- Team roster with roles and ownership accountability
- Team lead identity verification (government ID + liveness/selfie check)
- Project summary and ecosystem value thesis
- Utility claims and expected delivery timeline
- Token category (utility, meme, gaming, infra, DeFi, charity, other)
- Prior experience, references, socials, and contact channels
- Optional early token metadata at application time:
  - token name
  - token ticker
  - token logo
  - short token/project description

### Required Platform Behavior

- Application enters manual review queue before any launch approval.
- Structured interview flow and publishable summary
- If application passes review, schedule formal online interview.
- After interview + final review, produce a launch plan with the team.
- If approved, token launch is executed manually by 1ST0P with the team.
- Approval flow includes explicit launch policy and cost disclosure.
- Launch profile exposes team context, roadmap, and trust indicators.

### Acceptance Criteria

- Application cannot submit without mandatory trust fields.
- Team is not listed as approved without manual reviewer decision.
- Interview and launch-plan checkpoints are captured before launch execution.
- Launch profile includes team identity status and roadmap section.
- Policy page explains approval path, costs, and lifecycle.

## Lane 2: Trader/Investor (View Projects)

### Goal

Help traders evaluate real projects and team accountability, not only token price action.

### Required Platform Behavior

- Project listings segmented by status:
  - prelaunch/presale
  - launched/live
  - archived/inactive
- Every listing includes trust context:
  - team verification status
  - interview/roadmap completion state
  - why the project qualifies for listing

### Acceptance Criteria

- Traders can distinguish presale vs live projects at a glance.
- Project page provides a non-price explanation of listing credibility.

## Lane 3: Service Provider (Apply as Provider)

### Goal

Onboard providers into a reputation system that rewards completed, verified work.

### Required Inputs

- Provider identity basics and profile
- Services offered + specialization tags
- Portfolio and prior delivery history
- Pricing model (fixed/range/hourly/depends)
- Social/contact channels
- Optional resume upload

### Required Platform Behavior

- Provider card shows average rating (/5) and total review count.
- No standalone reviews destination is required.
- Provider onboarding includes mandatory disclosure that completed jobs require buyer feedback.
- Provider application enters manual review queue before public listing.
- Provider can only be listed after explicit reviewer approval.

### Acceptance Criteria

- Provider profile cannot go live without service + contact minimums.
- Provider cannot appear in public listings without manual approval.
- Provider list exposes rating average and count consistently.

## Lane 4: Buyer/Founder (View Services + Hire)

### Goal

Give buyers a safe place to purchase services with clear custody and quality enforcement.

### Required Platform Behavior

- Marketplace trust copy explains:
  - funds held in treasury/escrow until completion criteria are met
  - support for milestone or timeboxed (daily/weekly) release cadence
  - dispute path allowing partial/full refunds on unmet deliverables
- **Platform fee (target):** the greater of (a) a fixed minimum fee (e.g. 0.1 SOL on devnet) and (b) 1% of the booked engagement amount—disclosed before payment; final schedule published in policy UI.
- **Pre-funding agreement (target):** buyers and providers agree scope, timeline, commercial terms, and acceptance criteria before treasury receives funds (structured engagement record, not ad-hoc DMs only).
- **Identity and collaboration (discovery / later commits):**
  - Optional wallet-scoped display identity: unique username 1:1 with wallet public key for profiles and routing.
  - Engagement workspace: messaging and proof-of-delivery artifacts tied to the engagement.
  - Adjustable standard contract template: parties review and accept a base agreement before the engagement activates and funds move.
- At completion, buyer must submit mandatory feedback:
  - 1-5 star rating
  - minimum 50-character written review
- Final closeout is blocked until required feedback is submitted.

### Acceptance Criteria

- Buyers see escrow/treasury policy before hiring.
- Service completion flow enforces rating + minimum review length.
- Review payload is written to provider reputation data.

## Global Trust and Safety Requirements

- Identity-first launch process with explicit verification state
- Escrow-first service payment flow with deterministic release rules
- Mandatory closed-loop reviews for completed work
- Audit-friendly state transitions for approval, payout, dispute, and refund events

## Non-Goals (Current Scope)

- Full centralized exchange-style KYC stack implementation in this commit
- Advanced anti-bot production enforcement in this commit
- Final legal/compliance language in this commit

These are addressed in later roadmap phases.

## Definition of Done 

- Product requirements document exists and is reviewed by founder.
- All four user lanes have explicit required inputs and required platform behavior.
- Trust policies (identity, escrow, mandatory feedback) are written as enforceable requirements.
- Acceptance criteria are concrete enough to derive future implementation tasks.
