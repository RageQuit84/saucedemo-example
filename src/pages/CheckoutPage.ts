import { Page, Locator } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly zipCodeInput: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;
  readonly orderConfirmation: Locator;
  readonly itemTotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('.title');
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.zipCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.orderConfirmation = page.locator('.complete-header');
    this.itemTotal = page.locator('[data-test="subtotal-label"]');
    this.tax = page.locator('[data-test="tax-label"]');
    this.total = page.locator('[data-test="total-label"]');
  }

  async fillCheckoutInfo(firstName: string, lastName: string, zipCode: string) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.zipCodeInput.fill(zipCode);
  }

  async continueCheckout() {
    await this.continueButton.click();
  }

  async completeOrder() {
    await this.finishButton.click();
  }

  async cancelCheckout() {
    await this.cancelButton.click();
  }

  async getOrderConfirmationText(): Promise<string> {
    return (await this.orderConfirmation.textContent())?.trim() ?? '';
  }

  async isOrderConfirmationVisible(): Promise<boolean> {
    return await this.orderConfirmation.isVisible();
  }

  async getTotalPrice(): Promise<string> {
    return (await this.total.textContent())?.trim() ?? '';
  }

  async getTotalAmount(): Promise<number> {
    const totalText = await this.total.textContent();
    const priceMatch = totalText?.match(/\$([0-9.]+)/);
    return priceMatch ? parseFloat(priceMatch[1]) : 0;
  }

  async getSubtotalAmount(): Promise<number> {
    const subtotalText = await this.itemTotal.textContent();
    const priceMatch = subtotalText?.match(/\$([0-9.]+)/);
    return priceMatch ? parseFloat(priceMatch[1]) : 0;
  }

  async getTaxAmount(): Promise<number> {
    const taxText = await this.tax.textContent();
    const priceMatch = taxText?.match(/\$([0-9.]+)/);
    return priceMatch ? parseFloat(priceMatch[1]) : 0;
  }

  async navigateBackToCart() {
    await this.cancelButton.click();
  }
}
