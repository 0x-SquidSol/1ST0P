# 1ST0P UX Acceptance Checklist

## Purpose

This checklist defines minimum UX acceptance requirements before shipping work across Launch, Marketplace, Trade, and shared platform surfaces.

Use it as a release gate for feature PRs and milestone signoff.

## How to Use

- Mark each item pass/fail during QA.
- Do not ship if any critical item fails.
- Log failures with reproduction steps and owner.
- Re-test all failed items after fixes.

## Severity Key

- Critical: must pass before release
- High: should pass before release unless explicitly waived
- Medium: can ship with follow-up ticket if risk is low

## A) Global Navigation and Layout

- [ ] (Critical) Global top navigation is present and consistent on all primary pages.
- [ ] (Critical) Active nav state correctly reflects current lane.
- [ ] (High) Context side navigation appears only where relevant and is route-correct.
- [ ] (High) Primary CTA paths are reachable in 1-2 clicks from home.
- [ ] (Medium) Footer links and trust copy are visible and readable on all breakpoints.

## B) Visual Consistency and Readability

- [ ] (Critical) UI follows grayscale token baseline (no unauthorized accent usage).
- [ ] (High) Heading/body/caption hierarchy matches design token typography scale.
- [ ] (High) Spacing and card padding follow the established spacing system.
- [ ] (High) Border/radius/shadow usage is consistent with token standards.
- [ ] (Medium) Dense views preserve scannability with clear section separation.

## C) Wallet and Transaction UX

- [ ] (Critical) Wallet connect/disconnect states render correctly and predictably.
- [ ] (Critical) Transaction states are explicit: pending, confirmed, failed.
- [ ] (Critical) User receives actionable error feedback when transaction fails.
- [ ] (High) No duplicate transaction submissions from rapid repeated clicks.
- [ ] (High) Wallet UI styling matches platform visual language.

## D) Launch Application Flow (Teams)

- [ ] (Critical) Launch application enforces required trust/compliance fields.
- [ ] (Critical) Team is never listed as approved without manual reviewer action.
- [ ] (Critical) Approval workflow captures review state transitions correctly.
- [ ] (High) Interview-required status is visible after initial approval gate.
- [ ] (High) Launch-plan stage is clearly separated from application stage.
- [ ] (High) Optional early token metadata supports:
  - name
  - ticker
  - logo
  - description
- [ ] (Medium) Application form supports save/return flow without data loss.

## E) Marketplace Provider Flow

- [ ] (Critical) Provider applications require minimum identity/service/contact fields.
- [ ] (Critical) Provider is not publicly listed until manually approved.
- [ ] (High) Provider cards display average rating (/5) and review count.
- [ ] (High) No standalone reviews destination is exposed.
- [ ] (Critical) Provider onboarding includes mandatory feedback policy disclosure.

## F) Buyer Hiring and Escrow Flow

- [ ] (Critical) Escrow/treasury custody policy is shown before buyer commits funds.
- [ ] (Critical) Milestone/timeboxed release rules are visible and understandable.
- [ ] (Critical) Completion flow enforces mandatory buyer feedback:
  - 1-5 star rating
  - minimum 50-character written review
- [ ] (Critical) Final closeout is blocked until required review is submitted.
- [ ] (High) Dispute and refund outcomes are presented clearly to both parties.

## G) Trade and Project Discovery Flow

- [ ] (Critical) Project listing shows lifecycle state:
  - prelaunch/presale
  - launched/live
  - archived/inactive
- [ ] (High) Listing includes trust context (verification, interview/roadmap state).
- [ ] (High) Users can distinguish trust context from market metrics.
- [ ] (Medium) Trade lane labeling remains consistent (Trade vs traders route naming).

## H) Empty, Loading, and Error States

- [ ] (Critical) Every major data view has defined empty, loading, and error states.
- [ ] (High) Loading states preserve layout (no disruptive reflow).
- [ ] (High) Empty states include helpful next actions.
- [ ] (Critical) Error states include retry path when operation is recoverable.
- [ ] (Medium) Error copy avoids ambiguous language and technical leakage.

## I) Accessibility Baseline

- [ ] (Critical) Keyboard navigation reaches all interactive controls in logical order.
- [ ] (Critical) Focus indicators are visible on all actionable elements.
- [ ] (Critical) Contrast meets WCAG AA for body text and controls.
- [ ] (High) Critical states are not color-only; text/icon reinforcement exists.
- [ ] (High) Form fields have labels and validation messages are programmatically associated.

## J) Content and Trust Messaging

- [ ] (Critical) Trust and safety claims match implemented behavior.
- [ ] (Critical) No copy suggests instant listing/launch where manual approval is required.
- [ ] (High) Cost/fee language is clear and consistent across lanes.
- [ ] (High) Policy wording is consistent with product requirements and IA docs.
- [ ] (Medium) Copy tone is concise, professional, and user-literate.

## K) Release Readiness Gate

Release is blocked if any of the following are true:

- Any Critical item fails.
- Any trust-flow requirement is ambiguous or inconsistent with implementation.
- Any mandatory review/approval guard can be bypassed in normal UX paths.

## Evidence Template (Per QA Run)

- Scope:
- Build/commit:
- Reviewer:
- Date:
- Failing items:
- Notes:
- Final decision: pass / conditional pass / fail
