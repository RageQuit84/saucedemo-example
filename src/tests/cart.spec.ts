import { test, expect } from '@playwright/test';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';

test.describe('Sauce Demo — Cart Operations', () => {
  let products: ProductsPage;
  let cart: CartPage;

  test.beforeEach(async ({ page }) => {
    products = new ProductsPage(page);
    cart = new CartPage(page);
    // Navigate to products page (already authenticated via session storage)
    await page.goto('/inventory.html');
  });

  test('standard_user can add single item and continue shopping', async ({ page }) => {
    // Session is already authenticated via storageState
    
    // Step 1: Verify products page is loaded
    await test.step('verify products page loaded', async () => {
      await expect(products.productsTitle).toHaveText(products.expectedTitle);
      await expect(products.inventoryList).toBeVisible();
    });

    // Step 2: Add single product to cart
    await test.step('add first product to cart', async () => {
      await products.addFirstProductToCart();
      const cartCount = await products.getCartBadgeCount();
      expect(cartCount).toBe('1');
    });

    // Step 3: Navigate to cart
    await test.step('navigate to cart', async () => {
      await products.goToCart();
      await expect(cart.pageTitle).toContainText('Cart');
    });

    // Step 4: Verify single item in cart
    await test.step('verify single item in cart', async () => {
      const itemCount = await cart.getCartItemCount();
      expect(itemCount).toBe(1);
    });

    // Step 5: Continue shopping
    await test.step('continue shopping', async () => {
      await expect(cart.continueShoppingButton).toBeVisible();
      await cart.continueShopping();
      // Verify we're back on products page
      await expect(products.productsTitle).toHaveText(products.expectedTitle);
    });
  });

  test('standard_user can remove item from cart and verify persistence', async ({ page }) => {
    // Session is already authenticated via storageState
    
    // Step 1: Add two products to cart
    await test.step('add two products to cart', async () => {
      await products.addFirstProductToCart();
      const count1 = await products.getCartBadgeCount();
      expect(count1).toBe('1');
      
      await products.addSecondProductToCart();
      const count2 = await products.getCartBadgeCount();
      expect(count2).toBe('2');
    });

    // Step 2: Navigate to cart
    await test.step('navigate to cart', async () => {
      await products.goToCart();
      await expect(cart.pageTitle).toContainText('Cart');
    });

    // Step 3: Verify both items in cart
    await test.step('verify two items in cart', async () => {
      const itemCount = await cart.getCartItemCount();
      expect(itemCount).toBe(2);
    });

    // Step 4: Remove the second item from cart
    await test.step('remove second item from cart', async () => {
      const itemsBefore = await cart.getCartItemCount();
      expect(itemsBefore).toBe(2);
      
      // Remove the first displayed item (which is the second added item)
      await cart.removeItemByIndex(0);
      
      const itemsAfter = await cart.getCartItemCount();
      expect(itemsAfter).toBe(1);
    });

    // Step 5: Continue shopping
    await test.step('continue shopping', async () => {
      await expect(cart.continueShoppingButton).toBeVisible();
      await cart.continueShopping();
      await expect(products.productsTitle).toHaveText(products.expectedTitle);
    });

    // Step 6: Verify cart badge decreased
    await test.step('verify cart badge shows one item', async () => {
      const cartCount = await products.getCartBadgeCount();
      expect(cartCount).toBe('1');
    });

    // Step 7: Navigate back to cart to verify removal persists
    await test.step('verify removed item stays removed', async () => {
      await products.goToCart();
      await expect(cart.pageTitle).toContainText('Cart');
      
      const finalItemCount = await cart.getCartItemCount();
      expect(finalItemCount).toBe(1);
    });
  });
});
