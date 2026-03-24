# Playwright TS Framework — Sauce Demo Tests

This repository contains a Playwright + TypeScript test suite that exercises the Sauce Demo login and products flows.

**Quick start**

1. Install deps:

```bash
npm install
```

2. Install Playwright browsers (once per machine/CI):

```bash
npx playwright install --with-deps
```

3. Run tests (full suite):

```bash
npm test
```

View the HTML report after a run:

```bash
npx playwright show-report
```

**What this suite covers (current state)**

- Core login flows:
  - `standard_user` — successful login + logout.
  - `locked_out_user` — shows an error message.
  - invalid credentials and empty credentials validations.
- Users that exercise UI edge-cases:
  - `problem_user` — page loads but assets (images) may be broken; test contains a strict image-src check to detect missing/404 images.
  - `performance_glitch_user` — tests stable behavior when loading is delayed.
  - `visual_user` — known to introduce layout regressions; tests include logical layout assertions to detect broken element relationships.

**Why the assertions are structured this way**

- Page objects split responsibilities: `LoginPage` handles authentication, `ProductsPage` contains product-related locators and layout helpers.
- Tests prefer web-first, auto-retrying assertions (`await expect(locator).toHaveText(...)`).
- Non-critical visuals use `expect.soft(...)` so they don't fail the happy path unnecessarily.
- Important visual regressions are detected in two ways:
  1. Logical layout assertions (ProductsPage.assertFirstProductLayoutConstraints) — checks bounding boxes and spatial rules (non-zero sizes, left/right relationships, no overlap). This is low-maintenance and fails only when layout is actually broken, not when visuals are merely different.
  2. Targeted strict checks (e.g., first product image `src`) — these assert known asset tokens and intentionally fail for `problem_user` when a 404 image is served.

**How failures are captured and surfaced**

- Playwright automatically captures videos and traces when configured in `playwright.config.ts`.
- Tests attach diagnostic screenshots on layout or logout failures using `test.info().attach(...)` for quick triage.
- Failure artifacts (videos, screenshots, error-context.md) are stored under `test-results/` and visible from the HTML report.

**Known failures (intentional / expected)**

- `problem_user` — the strict first-product image `src` check is expected to fail when the page serves a 404 image; this demonstrates detection of missing/incorrect assets.
- `visual_user` — the layout assertion is expected to fail when elements overlap or images collapse to zero size; this demonstrates the logical approach catching layout regressions that pixel-diff tools might miss or overreport.

**Files to inspect**

- `src/pages/LoginPage.ts` — login-related page object and helpers.
- `src/pages/ProductsPage.ts` — product locators, layout checks, and logout helpers.
- `tests/login.spec.ts` — the test scenarios and the assertions described above.

**Design notes & next steps**

- The layout-constraint approach minimizes false positives from cosmetic differences while catching real structural breakages. If you want, I can:
  - Add ARIA snapshots (`toMatchAriaSnapshot`) for accessibility structure checks.
  - Add optional visual snapshots for baseline comparison (Playwright snapshots or a visual-regression service).
  - Make image checks soft for `problem_user` and rely on layout assertions instead — useful if asset names are flaky.

If you want, I can commit these changes and open a PR with the README and POM refactor.
