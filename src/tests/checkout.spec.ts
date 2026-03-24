import { test, expect } from '@playwright/test';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('Sauce Demo — Checkout & Pricing', () => {
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

  test('standard_user can verify checkout pricing before completing purchase', async ({ page }) => {
    // Session is already authenticated via storageState
    
    // Step 1: Add random set of items (2-4 items) and track prices
    let itemsWithPrices: Array<{ name: string; price: number }> = [];
    await test.step('add random items and track prices', async () => {
      await expect(products.productsTitle).toHaveText(products.expectedTitle);
      
      const productCount = await products.getProductCount();
      // Add 3 random items
      const indicesToAdd = [0, 1, 3]; // Add first, second, and fourth products
      
      for (const index of indicesToAdd) {
        if (index < productCount) {
          const itemInfo = await products.addProductByIndex(index);
          itemsWithPrices.push(itemInfo);
        }
      }
      
      const cartCount = await products.getCartBadgeCount();
      expect(cartCount).toBe(itemsWithPrices.length.toString());
    });

    // Step 2: Navigate to cart
    await test.step('navigate to cart and verify', async () => {
      await products.goToCart();
      await expect(cart.pageTitle).toContainText('Cart');
    });

    // Step 3: Verify all items in cart
    await test.step('verify items in cart match products', async () => {
      const itemCountInCart = await cart.getCartItemCount();
      expect(itemCountInCart).toBe(itemsWithPrices.length);
      
      // Verify all items are in cart (prices will be verified on checkout page)
      for (let i = 0; i < itemsWithPrices.length; i++) {
        const cartItemName = await cart.getCartItemName(i);
        expect(cartItemName).toBe(itemsWithPrices[i].name);
      }
      
      // Calculate expected subtotal for later verification
      const expectedSubtotal = itemsWithPrices.reduce((sum, item) => sum + item.price, 0);
      console.log(`Expected subtotal: $${expectedSubtotal.toFixed(2)}`);
    });

    // Step 4: Proceed to checkout
    await test.step('proceed to checkout', async () => {
      await expect(cart.checkoutButton).toBeVisible();
      await cart.proceedToCheckout();
    });

    // Step 5: Fill in checkout information
    await test.step('fill checkout info', async () => {
      await expect(checkout.firstNameInput).toBeVisible();
      await checkout.fillCheckoutInfo('John', 'Doe', '12345');
      await checkout.continueCheckout();
    });

    // Step 6: Verify pricing on checkout review page
    await test.step('verify pricing on checkout review', async () => {
      // Verify page title shows Checkout
      await expect(checkout.pageTitle).toContainText('Checkout');
      
      const checkoutSubtotal = await checkout.getSubtotalAmount();
      const checkoutTax = await checkout.getTaxAmount();
      const checkoutTotal = await checkout.getTotalAmount();
      
      // Verify subtotal matches expected
      const expectedSubtotal = itemsWithPrices.reduce((sum, item) => sum + item.price, 0);
      expect(Math.round(checkoutSubtotal * 100) / 100).toBe(Math.round(expectedSubtotal * 100) / 100);
      
      // Verify tax is a positive number (don't assume specific tax rate)
      expect(checkoutTax).toBeGreaterThan(0);
      
      // Verify total = subtotal + tax (this is the important calculation)
      const calculatedTotal = checkoutSubtotal + checkoutTax;
      expect(Math.round(checkoutTotal * 100) / 100).toBeCloseTo(Math.round(calculatedTotal * 100) / 100, 2);
    });

    // Step 7: Navigate back without completing purchase
    await test.step('navigate back without completing purchase', async () => {
      await checkout.navigateBackToCart();
      // Cancel button takes us back to products page
      await expect(products.productsTitle).toHaveText(products.expectedTitle);
    });

    // Step 8: Verify items are still in cart by navigating back to cart
    await test.step('verify items remain in cart', async () => {
      await products.goToCart();
      await expect(cart.pageTitle).toContainText('Cart');
      
      const finalItemCount = await cart.getCartItemCount();
      expect(finalItemCount).toBe(itemsWithPrices.length);
    });
  });

  test.fixme('empty cart should prevent checkout - validation error expected', async ({ page }) => {
    // Session is already authenticated via storageState
    // NOTE: This test is marked as fixme because the current application allows 
    // proceeding to checkout with an empty cart, which violates business logic.
    // A proper implementation should block checkout or show a validation error.
    
    // Step 1: Navigate directly to cart without adding items
    await test.step('navigate to empty cart', async () => {
      await products.goToCart();
      await expect(cart.pageTitle).toHaveText('Cart');
    });

    // Step 2: Verify cart is empty
    await test.step('verify cart is empty', async () => {
      const itemCount = await cart.getCartItemCount();
      expect(itemCount).toBe(0);
    });

    // Step 3: Attempt to proceed to checkout with empty cart
    await test.step('attempt checkout on empty cart - should error', async () => {
      // This should either:
      // 1. Disable the checkout button
      // 2. Show a validation error message
      // 3. Reject the checkout action
      const isCheckoutEnabled = await cart.checkoutButton.isEnabled();
      
      if (isCheckoutEnabled) {
        // If button is enabled, clicking it should fail or show an error
        await cart.proceedToCheckout();
        
        // Expect to either stay on cart page or see an error
        const errorMessage = page.locator('[data-test="error"]');
        const isVisible = await errorMessage.isVisible().catch(() => false);
        if (isVisible) {
          await expect(errorMessage).toBeVisible();
        } else {
          await expect(cart.pageTitle).toHaveText('Cart');
        }
        // Button should be disabled
        expect(isCheckoutEnabled).toBeFalsy();
      }
    });
  });
});
