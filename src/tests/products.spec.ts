import { test, expect } from '@playwright/test';
import { ProductsPage } from '../pages/ProductsPage';

test.describe('Sauce Demo — Product Display', () => {
  let products: ProductsPage;

  test.beforeEach(async ({ page }) => {
    products = new ProductsPage(page);
    // Navigate to products page (already authenticated via session storage)
    await page.goto('/inventory.html');
  });

  test('standard_user can verify products are displayed correctly', async ({ page }) => {
    // Session is already authenticated via storageState
    
    // Step 1: Verify products page is loaded
    await test.step('verify products page has items', async () => {
      await expect(products.productsTitle).toHaveText(products.expectedTitle);
      await expect(products.inventoryList).toBeVisible();
    });

    // Step 2: Verify first product details
    await test.step('verify first product is visible', async () => {
      await expect(products.firstProductImage).toBeVisible();
      await expect(products.firstProductName).toBeVisible();
      const imageSrc = await products.firstProductImageSrc();
      expect(imageSrc).toContain(products.expectedFirstProductImageSrcToken);
    });

    // Step 3: Test layout constraints
    await test.step('verify product layout', async () => {
      await products.assertFirstProductLayoutConstraints();
    });
  });
});
