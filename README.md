# Playwright TS Framework — Sauce Demo Tests

This repository contains a small Playwright + TypeScript test framework with example login scenarios for https://www.saucedemo.com/

**Contents**
- `src/pages/LoginPage.ts` — Page object for the Sauce Demo login flow.
- `tests/login.spec.ts` — Login scenarios implemented against the public site.

**Prerequisites**
- Node.js (recommended 16+ or newer)
- Git (optional)

Setup

1. Install dependencies:

```bash
npm install
```

2. Install Playwright browsers (required once on the machine):

```bash
npx playwright install
```

Running tests

- Run the full test suite:

```bash
npm test
```

- Run a single spec file:

```bash
npx playwright test tests/login.spec.ts
```

- Run headed for debugging:

```bash
npx playwright test tests/login.spec.ts --headed
npx playwright test --debug
```

View report

After a run, open the HTML report with:

```bash
npx playwright show-report
```

Test coverage (what's included)

- Successful login and logout for `standard_user`.
- Error shown for `locked_out_user`.
- Error shown for invalid credentials.
- Validation behavior for empty username/password.
- `problem_user` login (checks products page loads despite UI differences).
- `performance_glitch_user` login (accounts for delayed load).

Files to inspect

- See the page object: [src/pages/LoginPage.ts](src/pages/LoginPage.ts)
- See the tests: [tests/login.spec.ts](tests/login.spec.ts)

Suggested next improvements

- Accessibility: add `axe-playwright` checks to assert no blocking a11y violations on the login and products pages.
- Performance: assert page load / Time-to-interactive thresholds (use `page.metrics()` or custom timing). Test `performance_glitch_user` separately with higher timeouts.
- Visual regression: add snapshot comparisons (Playwright snapshots or Percy).
- CI: ensure `npx playwright install` runs in CI prior to `npm test`.
- Network resilience: simulate throttling/offline to assert error messaging.

CI snippet (example)

```yaml
# Example for GitHub Actions
name: Playwright tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
```

Notes

- Tests interact with the public site (`https://www.saucedemo.com/`) and therefore are black-box at the UI level. Keep assertions resilient to minor wording/UI changes by using substring checks and visible-element assertions.
- The project already includes cross-browser projects (Chromium/Firefox/WebKit) in `playwright.config.ts`.

If you want, I can add accessibility checks using `axe-playwright` next.
# Playwright TypeScript Framework (scaffold)

Quick scaffold for a TypeScript Playwright test framework.

Getting started

1. Install dependencies:

```bash
npm install
npm run install:playwright
```

2. Run tests:

```bash
npm test
```

Useful scripts

- `npm test` — run Playwright tests
- `npm run test:headed` — run tests with headed browsers
- `npm run test:debug` — run with the Playwright inspector

Project layout

- `playwright.config.ts` — test runner configuration
- `tests/` — test files
- `src/pages/` — page objects and helpers

Next steps

- Add CI workflow
- Add linting/formatting
- Add coverage/reporting per your requirements
