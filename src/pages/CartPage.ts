import { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly cartItems: Locator;
  readonly cartItem: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;
  readonly cartBadge: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('.title');
    this.cartItems = page.locator('.cart_list');
    this.cartItem = page.locator('.cart_item');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.subtotalLabel = page.locator('[data-test="subtotal-label"]');
    this.taxLabel = page.locator('[data-test="tax-label"]');
    this.totalLabel = page.locator('[data-test="total-label"]');
  }

  async getCartItemCount(): Promise<number> {
    return await this.cartItem.count();
  }

  async getCartBadgeText(): Promise<string> {
    return (await this.cartBadge.textContent())?.trim() ?? '';
  }

  async getCartItemNames(): Promise<string[]> {
    const items = await this.page.locator('.inventory_item_name').allTextContents();
    return items;
  }

  async removeItemByIndex(index: number) {
    const removeButton = this.cartItem.nth(index).locator('button');
    await removeButton.click();
  }

  async removeItemByName(itemName: string) {
    const itemElement = this.page.locator(`.inventory_item_name:has-text("${itemName}")`);
    const cartItemContainer = itemElement.locator('xpath=ancestor::div[@class="cart_item"]');
    const removeButton = cartItemContainer.locator('button');
    await removeButton.click();
  }

  async isItemInCart(itemName: string): Promise<boolean> {
    const count = await this.page.locator(`.inventory_item_name:has-text("${itemName}")`).count();
    return count > 0;
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
  }

  async isCheckoutButtonVisible(): Promise<boolean> {
    return await this.checkoutButton.isVisible();
  }

  // Price verification methods
  async getCartItemPrice(index: number): Promise<number> {
    const item = this.cartItem.nth(index);
    const priceText = await item.locator('.inventory_item_price').textContent();
    const priceStr = priceText?.replace('$', '').trim() ?? '0';
    return parseFloat(priceStr);
  }

  async getCartItemName(index: number): Promise<string> {
    const item = this.cartItem.nth(index);
    const nameText = await item.locator('.inventory_item_name').textContent();
    return nameText?.trim() ?? '';
  }

  async getSubtotal(): Promise<number> {
    const subtotalText = await this.subtotalLabel.textContent();
    const priceMatch = subtotalText?.match(/\$([0-9.]+)/);
    return priceMatch ? parseFloat(priceMatch[1]) : 0;
  }

  async getTax(): Promise<number> {
    const taxText = await this.taxLabel.textContent();
    const priceMatch = taxText?.match(/\$([0-9.]+)/);
    return priceMatch ? parseFloat(priceMatch[1]) : 0;
  }

  async getTotal(): Promise<number> {
    const totalText = await this.totalLabel.textContent();
    const priceMatch = totalText?.match(/\$([0-9.]+)/);
    return priceMatch ? parseFloat(priceMatch[1]) : 0;
  }

  async getTotalText(): Promise<string> {
    return (await this.totalLabel.textContent())?.trim() ?? '';
  }
}
