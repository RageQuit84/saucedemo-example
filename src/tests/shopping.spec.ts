import { test, expect } from '@playwright/test';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('Sauce Demo — Standard User Shopping Scenarios', () => {
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

    // Step 3: Verify cart item prices match product prices
    await test.step('navigate to cart and verify', async () => {
      await products.goToCart();
      await expect(cart.pageTitle).toContainText('Cart');
    });

    // Step 4: Verify all items in cart
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

    // Step 5: Proceed to checkout
    await test.step('proceed to checkout', async () => {
      await expect(cart.checkoutButton).toBeVisible();
      await cart.proceedToCheckout();
    });

    // Step 6: Fill in checkout information
    await test.step('fill checkout info', async () => {
      await expect(checkout.firstNameInput).toBeVisible();
      await checkout.fillCheckoutInfo('John', 'Doe', '12345');
      await checkout.continueCheckout();
    });

    // Step 7: Verify pricing on checkout review page
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

    // Step 8: Navigate back without completing purchase
    await test.step('navigate back without completing purchase', async () => {
      await checkout.navigateBackToCart();
      // Cancel button takes us back to products page
      await expect(products.productsTitle).toHaveText(products.expectedTitle);
    });

    // Step 9: Verify items are still in cart by navigating back to cart
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
      } else {
        // Button should be disabled
        expect(isCheckoutEnabled).toBeFalsy();
      }
    });
  });
});
