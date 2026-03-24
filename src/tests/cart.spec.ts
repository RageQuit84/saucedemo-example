import { test, expect } from '@playwright/test';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { LoginPage } from '../pages/LoginPage';

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

  test('items persist in cart after logout and login', async ({ page }) => {    
    // Step 1: Add items to cart
    await test.step('add multiple items to cart', async () => {
      await products.addFirstProductToCart();
      let cartCount = await products.getCartBadgeCount();
      expect(cartCount).toBe('1');
      
      await products.addSecondProductToCart();
      cartCount = await products.getCartBadgeCount();
      expect(cartCount).toBe('2');
    });

    // Step 2: Record item names for verification later
    let itemNames: string[] = [];
    await test.step('record cart items', async () => {
      await products.goToCart();
      itemNames = await cart.getCartItemNames();
      expect(itemNames.length).toBe(2);
    });

    // Step 3: Logout
    await test.step('logout from application', async () => {
      await products.logout();
      // Wait for redirect to login page
      await page.waitForURL('**/');
      await expect(page.locator('#user-name')).toBeVisible();
    });

    // Step 4: Login again
    const login = new LoginPage(page);
    await test.step('login again with same credentials', async () => {
      await login.login('standard_user', 'secret_sauce');
      // Wait for navigation to products page to confirm login success
      await page.waitForURL('**/inventory.html');
      await expect(products.productsTitle).toHaveText(products.expectedTitle);
    });

    // Step 5: Verify cart items persisted
    await test.step('verify cart items persisted after login', async () => {
      const cartCount = await products.getCartBadgeCount();
      expect(cartCount).toBe('2');
    });

    // Step 6: Navigate to cart and verify items are still there
    await test.step('verify items visible in cart', async () => {
      await products.goToCart();
      await expect(cart.pageTitle).toContainText('Cart');
      
      const itemCount = await cart.getCartItemCount();
      expect(itemCount).toBe(2);
      
      const currentItemNames = await cart.getCartItemNames();
      expect(currentItemNames).toEqual(itemNames);
    });
  });
});
