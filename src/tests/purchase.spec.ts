import { test, expect } from '@playwright/test';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('Sauce Demo — Standard User Purchase Flow', () => {
  let products: ProductsPage;
  let cart: CartPage;
  let checkout: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    products = new ProductsPage(page);
    cart = new CartPage(page);
    checkout = new CheckoutPage(page);
    // Navigate to products page (already authenticated via session storage)
    await page.goto('/inventory.html');
  });

  test('standard_user can add two items to cart and complete purchase', async ({ page }) => {
    // Session is already authenticated via storageState

    // Step 1: Verify products page is loaded
    await test.step('verify products page loaded', async () => {
      await expect(products.productsTitle).toHaveText(products.expectedTitle);
      await expect(products.inventoryList).toBeVisible();
    });

    // Step 2: Add first product to cart
    await test.step('add first product to cart', async () => {
      await products.addFirstProductToCart();
      // Verify cart badge shows 1
      const cartCount = await products.getCartBadgeCount();
      expect(cartCount).toBe('1');
    });

    // Step 3: Add second product to cart
    await test.step('add second product to cart', async () => {
      await products.addSecondProductToCart();
      // Verify cart badge shows 2
      const cartCount = await products.getCartBadgeCount();
      expect(cartCount).toBe('2');
    });

    // Step 4: Navigate to cart
    await test.step('navigate to cart', async () => {
      await products.goToCart();
      // Verify we are on the cart page
      await expect(cart.pageTitle).toContainText('Cart');
    });

    // Step 5: Verify cart contents (2 items)
    await test.step('verify cart has two items', async () => {
      const itemCount = await cart.getCartItemCount();
      expect(itemCount).toBe(2);
    });

    // Step 6: Proceed to checkout
    await test.step('proceed to checkout', async () => {
      await expect(cart.checkoutButton).toBeVisible();
      await cart.proceedToCheckout();
      // Verify we are on checkout page
      await expect(checkout.pageTitle).toContainText('Checkout');
    });

    // Step 7: Fill in checkout information
    await test.step('fill in checkout information', async () => {
      await expect(checkout.firstNameInput).toBeVisible();
      await checkout.fillCheckoutInfo('John', 'Doe', '12345');
    });

    // Step 8: Continue to checkout review
    await test.step('continue to checkout review', async () => {
      await checkout.continueCheckout();
      // Verify we are on checkout overview page
      await expect(checkout.pageTitle).toContainText('Checkout');
    });

    // Step 9: Verify order total is displayed
    await test.step('verify order summary', async () => {
      // Verify total is visible
      const totalText = await checkout.getTotalPrice();
      expect(totalText).toBeTruthy();
      expect(totalText.length).toBeGreaterThan(0);
    });

    // Step 10: Complete the order
    await test.step('complete order', async () => {
      await expect(checkout.finishButton).toBeVisible();
      await checkout.completeOrder();
    });

    // Step 11: Verify order confirmation
    await test.step('verify order confirmation', async () => {
      await expect(checkout.orderConfirmation).toBeVisible();
      const confirmationText = await checkout.getOrderConfirmationText();
      expect(confirmationText.toLowerCase()).toContain('thank you');
    });
  });
});
