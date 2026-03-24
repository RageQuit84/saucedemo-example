# Playwright TS Framework — Sauce Demo E2E Tests

A comprehensive Playwright + TypeScript test suite for the Sauce Demo application, implementing a **Page Object Model (POM)** pattern with optimized session-based authentication for parallel test execution across multiple browsers.

## 📋 Quick Start

### Installation & Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers (once per machine)
npx playwright install --with-deps
```

### Running Tests

```bash
# Run full test suite across all browsers
npm test

# Run in headed mode (see browser UI)
npm run test:headed

# Run in debug mode (interactive debugging)
npm run test:debug

# Run specific test file
npx playwright test src/tests/purchase.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium

# View HTML report
npx playwright show-report
```

## 🏗️ Architecture Overview

### Session-Based Authentication Pattern

The framework uses a **setup/teardown pattern** to perform login once per browser, then reuses the authenticated session across all test files:

1. **Setup Project** (`src/setup/auth.setup.ts`)
   - Runs once per browser before any tests
   - Logs in as `standard_user` (credentials: `secret_sauce`)
   - Saves authenticated cookies/localStorage to `.auth/standard_user.json`

2. **Test Projects** (chromium, firefox, webkit)
   - Load the saved session via `storageState`
   - Tests start already authenticated on the products page
   - No need to log in during individual tests
   - Full parallel execution across 3 browsers × test count

**Benefits:**
- ✅ Faster test execution (login happens once, not per test)
- ✅ True parallel execution without flaky login dependencies
- ✅ Cleaner tests focused on core workflows, not authentication
- ✅ Automatic browser cleanup via Playwright's context isolation

### Page Object Model (POM)

All UI interactions are encapsulated in page objects. Tests contain **zero locators** — all selectors live in page objects for maintainability:

```
src/pages/
├── LoginPage.ts          # Authentication flow
├── ProductsPage.ts       # Product listing & cart operations
├── CartPage.ts           # Cart details & item management
└── CheckoutPage.ts       # Billing & order completion
```

## 🧪 Test Suite Structure

### Test Files Organization

| File | Purpose | Coverage |
|------|---------|----------|
| **purchase.spec.ts** | Complete purchase workflow | Login → Add 2 items → Checkout → Order |
| **cart.spec.ts** | Cart operations & persistence | Add item, remove item, session persistence |
| **checkout.spec.ts** | Pricing verification | Item prices, tax calculation, totals |
| **products.spec.ts** | Product display & layout | Image visibility, layout constraints |

### What Each Test Suite Covers

#### 1️⃣ **Standard User Purchase Flow** (`purchase.spec.ts`)
Tests the complete happy-path user workflow:
- ✓ Products page loads with inventory
- ✓ Add first product to cart (verify count)
- ✓ Add second product to cart (verify count)
- ✓ Navigate to cart
- ✓ Verify cart items and prices
- ✓ Proceed to checkout
- ✓ Enter billing information
- ✓ Complete order
- ✓ Verify order confirmation message

#### 2️⃣ **Cart Operations** (`cart.spec.ts`)
Tests cart functionality and session persistence:
- ✓ Add single item to cart
- ✓ Verify cart badge count updates
- ✓ Continue shopping navigation
- ✓ Remove item from cart
- ✓ Verify item removal in UI
- ✓ **Session persistence check** — page reload confirms item stays removed (tests Playwright's session storage realism)

#### 3️⃣ **Checkout & Pricing** (`checkout.spec.ts`)
Tests price calculations and checkout flow:
- ✓ Add multiple items, track per-item prices
- ✓ Navigate to checkout
- ✓ Verify subtotal (sum of items)
- ✓ Verify tax calculation (8% of subtotal)
- ✓ Verify total (subtotal + tax) = actual displayed total
- ⚠️ **[FIXME]** Empty cart checkout validation (app currently allows checkout with 0 items; skipped until fixed)

#### 4️⃣ **Product Display** (`products.spec.ts`)
Tests product visibility and layout integrity:
- ✓ Products title displays correctly
- ✓ Inventory list is visible
- ✓ First product image is visible and loads
- ✓ First product name is visible
- ✓ Product image has valid `src` (no broken image tokens)
- ✓ **Layout constraints** — Product names/prices follow spatial rules, no overlaps, correct z-ordering

### Test Execution Flow

```
npm test
  │
  ├─→ Setup Project (runs once)
  │   └─→ Authenticate standard_user → save .auth/standard_user.json
  │
  ├─→ Chromium Tests (parallel, 5 test suites)
  │   ├─→ purchase.spec.ts
  │   ├─→ cart.spec.ts
  │   ├─→ checkout.spec.ts
  │   └─→ products.spec.ts
  │
  ├─→ Firefox Tests (parallel, same suite)
  │
  └─→ WebKit Tests (parallel, same suite)

Total: 1 setup + (4 specs × 3 browsers) = 13 test tasks running in parallel
Result: 16 tests passing + 3 skipped (fixme tests)
```

## 📁 Project Structure

```
playwright-ts-framework/
├── src/
│   ├── setup/
│   │   └── auth.setup.ts              # One-time authentication per browser
│   ├── pages/
│   │   ├── LoginPage.ts               # goto(), login(user, pass)
│   │   ├── ProductsPage.ts            # Product listing, add to cart
│   │   ├── CartPage.ts                # Cart items, pricing info
│   │   └── CheckoutPage.ts            # Billing form, order completion
│   └── tests/
│       ├── purchase.spec.ts           # Full purchase workflow
│       ├── cart.spec.ts               # Cart operations
│       ├── checkout.spec.ts           # Pricing verification
│       └── products.spec.ts           # Product display
├── .auth/
│   └── standard_user.json             # Session state (generated, .gitignored)
├── playwright-report/                 # HTML test report (generated)
├── playwright.config.ts               # Playwright configuration
├── tsconfig.json                      # TypeScript configuration
├── package.json                       # Dependencies & scripts
└── README.md                          # This file
```

## 🔧 Configuration Details

### `playwright.config.ts` Highlights

```typescript
// Global test timeout
timeout: 30_000  // 30 seconds per test

// Base URL for all tests (Sauce Demo)
baseURL: 'https://www.saucedemo.com/'

// Browser configuration
projects: [
  { name: 'setup', testDir: './src/setup', ... }        // Runs once
  { name: 'chromium', storageState: '.auth/...', ... }  // Loads session
  { name: 'firefox', storageState: '.auth/...', ... }   // Loads session
  { name: 'webkit', storageState: '.auth/...', ... }    // Loads session
]

// Session reuse
storageState: '.auth/standard_user.json'  // Load cookies/localStorage from setup
dependencies: ['setup']                   // Wait for setup to complete first
```

### Test Assertion Strategy

- **Web-first assertions** — Auto-retry for 5 seconds (`expect.timeout: 5_000`)
- **Soft assertions** — Non-critical checks don't halt test (e.g., visual details)
- **Hard assertions** — Critical paths block on failure (e.g., order confirmation)

Example:
```typescript
// Hard assertion — test fails if products title is wrong
await expect(products.productsTitle).toHaveText('Products');

// Soft assertion (if used) — test continues even if image fails
expect.soft(imageSrc).toContain('expected-token');
```

## 🚀 CI/CD Integration — GitHub Actions

### Workflow: `.github/workflows/playwright-tests.yml`

Automatically runs on every `push` to `main` and generates a GitHub Pages report:

#### Job 1: **Run Tests**
1. Run on Ubuntu (latest)
2. Set up Node.js 18
3. Install dependencies (`npm ci`)
4. Install Playwright browsers
5. **Run full test suite** (`npm test`)
   - Setup authenticates once
   - All 4 test files run in parallel across 3 browsers
   - Continue on error (always generate report)
6. Upload test results artifact (30-day retention)

#### Job 2: **Deploy Report to GitHub Pages**
1. Waits for test job completion
2. Uploads `playwright-report/` directory to GitHub Pages
3. Report available at: `https://ragequit84.github.io/saucedemo-example/`

### Triggering CI/CD

```bash
# Automatic trigger on push to main
git push origin main

# Manual trigger
# Go to Actions tab → "Playwright tests" → "Run workflow"
```

### Viewing Test Results

**After CI completes:**
1. Go to **Actions** tab
2. Click the latest workflow run
3. Scroll to **Artifacts** section
4. Download `playwright-test-results` artifact
5. Extract and open `index.html` in browser

**Or via GitHub Pages (if enabled):**
1. Go to repo Settings → Pages
2. Ensure "Deploy from a branch" is selected
3. Ensure "gh-pages" branch is selected
4. Report automatically updates after each run

### Debugging a Failed Test

```bash
# Interactive debug mode (opens inspector)
npm run test:debug

# Headed mode (see browser actions)
npm run test:headed -- --project=chromium

# Run single test
npx playwright test src/tests/cart.spec.ts -g "remove item"
```

## 📊 Test Metrics

**Current State:**
- **Total Tests:** 16 passing + 3 skipped (fixme)
- **Browsers:** 3 (chromium, firefox, webkit)
- **Execution Time:** ~17–21 seconds (full suite)
- **Coverage:** Complete user purchase flow + edge cases
- **Parallel Execution:** 8 workers (auto-scaled by Playwright)

## 🔐 Security Notes

- ✅ `.auth/` directory is `.gitignored` — no credentials in repo
- ✅ Credentials hardcoded in `auth.setup.ts` (Sauce Demo public test account)
- ✅ No sensitive data stored in session files
- ⚠️ For real apps: Use environment variables or secrets management

## 🪲 Known Issues & Fixme Tests

| Issue | Test | Status |
|-------|------|--------|
| App allows checkout with 0 items in cart | `checkout.spec.ts` (empty cart fixme) | ⚠️ Skipped, awaiting app fix |

These tests are marked with `.fixme()` and automatically skipped in CI.
