import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';

test.describe('Sauce Demo — Login scenarios', () => {
  let login: LoginPage;
  let products: ProductsPage;

  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    products = new ProductsPage(page);
    await login.goto();
  });

  test('standard_user can login and logout', async ({ page }) => {
    await test.step('login as standard_user', async () => {
      await login.login('standard_user', 'secret_sauce');
    });
    await expect(products.productsTitle).toHaveText(products.expectedTitle);

    // Check page layout elements (soft asserts for non-critical visuals)
    await expect(products.inventoryList).toBeVisible();
    await expect.soft(products.firstProductImage).toBeVisible();
    await expect.soft(products.firstProductName).toBeVisible();

    // Verify layout constraints for the first product (guard against false negatives on the method)
    try {
      await products.assertFirstProductLayoutConstraints();
    } catch (err) {
      const screenshot = await page.screenshot({ fullPage: true });
      const info = test.info();
      await info.attach('layout-assertion-screenshot', {
        body: screenshot,
        contentType: 'image/png'
      });
      throw err;
    }

    // Attempt logout — failures here should surface issues with the menu/logout
    const loggedOut = await products.safeLogout();
    expect(loggedOut).toBeTruthy();
  });

  test('locked_out_user shows an error', async ({ page }) => {
    await test.step('attempt login as locked_out_user', async () => {
      await login.login('locked_out_user', 'secret_sauce');
    });
    await expect(login.error).toBeVisible();
    const text = await login.getErrorText();
    expect(text.toLowerCase()).toContain('locked out');
  });

  test('invalid credentials show an error', async ({ page }) => {
    await test.step('attempt login with invalid credentials', async () => {
      await login.login('invalid_user', 'bad_password');
    });
    await expect(login.error).toBeVisible();
    const text = await login.getErrorText();
    expect(text.toLowerCase()).toContain('do not match');
  });

  test('empty username or password shows validation error', async ({ page }) => {
    await test.step('attempt login with empty credentials', async () => {
      await login.login('', '');
    });
    await expect(login.error).toBeVisible();
    const text = await login.getErrorText();
    expect(text.length).toBeGreaterThan(0);
  });

  test('problem_user can reach products page (UI differences may exist)', async ({ page }) => {
    await test.step('login as problem_user', async () => {
      await login.login('problem_user', 'secret_sauce');
    });
    await expect(products.productsTitle).toHaveText(products.expectedTitle);
    await expect(products.inventoryList).toBeVisible();
    // Expect the top-left product image to be the canonical backpack image.
    // This is a strict check — `problem_user` is expected to fail here when images are incorrect.
    await expect(products.firstProductImage).toHaveAttribute('src', new RegExp(products.expectedFirstProductImageSrcToken));
    await expect.soft(products.firstProductName).toBeVisible();

    // Attempt logout to reveal menu/logout issues
    const loggedOutProblem = await products.safeLogout();
    expect(loggedOutProblem).toBeTruthy();
  });

  test('performance_glitch_user logs in under extended time', async ({ page }) => {
    await test.step('login as performance_glitch_user', async () => {
      await login.login('performance_glitch_user', 'secret_sauce');
    });
    // Intentionally do not extend timeouts here — leave test in a state where it can fail
    await expect(products.productsTitle).toHaveText(products.expectedTitle);
    await expect(products.inventoryList).toBeVisible();
    await expect.soft(products.firstProductImage).toBeVisible();

    const loggedOutPerf = await products.safeLogout();
    expect(loggedOutPerf).toBeTruthy();
  });

  test('visual_user shows UI bugs and may not be able to logout (capture screenshot)', async ({ page }) => {
    await test.step('login as visual_user', async () => {
      await login.login('visual_user', 'secret_sauce');
    });
    await expect(products.productsTitle).toHaveText(products.expectedTitle);
    await expect(products.inventoryList).toBeVisible();
    // Verify layout constraints for the first product (logical layout checks)
    try {
      await products.assertFirstProductLayoutConstraints();
    } catch (err) {
      const screenshot = await page.screenshot({ fullPage: true });
      const info = test.info();
      await info.attach('layout-failure-screenshot', {
        body: screenshot,
        contentType: 'image/png'
      });
      throw err;
    }

    // Strict image check for visual_user — expected to fail if top-left image is incorrect.
    await expect(products.firstProductImage).toHaveAttribute('src', new RegExp(products.expectedFirstProductImageSrcToken));

    // visual_user is known to have menu/logout problems; try safeLogout and attach a screenshot on failure
    const loggedOutVisual = await products.safeLogout();
    if (!loggedOutVisual) {
      const screenshot = await page.screenshot({ fullPage: true });
      const info = test.info();
      await info.attach('visual-triage-screenshot', {
        body: screenshot,
        contentType: 'image/png'
      });
      throw new Error('visual_user failed to logout (menu/logout likely broken)');
    }
  });
});
