import { Page, Locator, expect } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly inventoryList: Locator;
  readonly firstProduct: Locator;
  readonly firstProductImage: Locator;
  readonly firstProductName: Locator;
  readonly firstProductButton: Locator;
  readonly productsTitle: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;
  readonly cartIcon: Locator;
  readonly expectedTitle: string;
  readonly expectedFirstProductImageSrcToken: string;

  constructor(page: Page) {
    this.page = page;
    this.inventoryList = page.locator('.inventory_list');
    this.firstProduct = page.locator('.inventory_item').first();
    this.firstProductImage = this.firstProduct.locator('.inventory_item_img img');
    this.firstProductName = this.firstProduct.locator('.inventory_item_name');
    this.firstProductButton = this.firstProduct.locator('button').first();
    // Header/menu locators
    this.productsTitle = page.locator('.title');
    this.menuButton = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('#logout_sidebar_link');
    this.cartIcon = page.locator('.shopping_cart_link');

    this.expectedTitle = 'Products';
    this.expectedFirstProductImageSrcToken = 'sauce-backpack';
  }

  async firstProductImageSrc() {
    return (await this.firstProductImage.getAttribute('src')) || '';
  }

  // Logout helpers
  async logout() {
    await this.menuButton.click();
    if (await this.logoutLink.count() > 0) {
      await this.logoutLink.click();
    } else {
      throw new Error('Logout link not found');
    }
  }

  async safeLogout(): Promise<boolean> {
    try {
      await this.menuButton.click();
      if (await this.logoutLink.count() > 0) {
        await this.logoutLink.click();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  async assertFirstProductLayoutConstraints() {
    const itemBox = await this.firstProduct.boundingBox();
    const imgBox = await this.firstProductImage.boundingBox();
    const nameBox = await this.firstProductName.boundingBox();
    const btnBox = await this.firstProductButton.boundingBox();

    expect(itemBox).not.toBeNull();
    expect(imgBox).not.toBeNull();
    expect(nameBox).not.toBeNull();
    expect(btnBox).not.toBeNull();

    // Basic integrity: non-zero size
    expect(imgBox!.width).toBeGreaterThan(0);
    expect(imgBox!.height).toBeGreaterThan(0);

    // Spatial rules: image should be left of the product name
    expect(imgBox!.x).toBeLessThan(nameBox!.x + 10);
    // No overlap: image right edge should not pass name left edge (small tolerance)
    expect(imgBox!.x + imgBox!.width).toBeLessThanOrEqual(nameBox!.x + 12);

    // Button should be inside the product card bounds
    expect(btnBox!.x).toBeGreaterThanOrEqual(itemBox!.x - 1);
    expect(btnBox!.x + btnBox!.width).toBeLessThanOrEqual(itemBox!.x + itemBox!.width + 1);
  }

  // Cart operations
  async addProductToCart(productName: string) {
    const product = this.page.locator(`.inventory_item:has(:text("${productName}"))`);
    const addButton = product.locator('button');
    await addButton.click();
  }

  async addFirstProductToCart() {
    await this.firstProductButton.click();
  }

  async addSecondProductToCart() {
    const secondProduct = this.page.locator('.inventory_item').nth(1);
    const addButton = secondProduct.locator('button');
    await addButton.click();
  }

  async goToCart() {
    await this.cartIcon.click();
  }

  async getCartBadgeCount(): Promise<string> {
    const cartCount = await this.cartIcon.locator('.shopping_cart_badge').textContent();
    return cartCount?.trim() ?? '';
  }

  async isAddToCartButtonVisible(): Promise<boolean> {
    return await this.firstProductButton.isVisible();
  }

  // Price methods
  async getProductPrice(index: number): Promise<number> {
    const product = this.page.locator('.inventory_item').nth(index);
    const priceText = await product.locator('.inventory_item_price').textContent();
    const priceStr = priceText?.replace('$', '').trim() ?? '0';
    return parseFloat(priceStr);
  }

  async getProductName(index: number): Promise<string> {
    const product = this.page.locator('.inventory_item').nth(index);
    const nameText = await product.locator('.inventory_item_name').textContent();
    return nameText?.trim() ?? '';
  }

  async addProductByIndex(index: number): Promise<{ name: string; price: number }> {
    const name = await this.getProductName(index);
    const price = await this.getProductPrice(index);
    const product = this.page.locator('.inventory_item').nth(index);
    const addButton = product.locator('button');
    await addButton.click();
    return { name, price };
  }

  async getProductCount(): Promise<number> {
    return await this.page.locator('.inventory_item').count();
  }
}
