import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const authFile = '.auth/standard_user.json';

setup('authenticate standard user', async ({ page, context }) => {
  const login = new LoginPage(page);
  
  // Navigate to login page
  await login.goto();
  
  // Perform login
  await login.login('standard_user', 'secret_sauce');
  
  // Wait for navigation to products page to confirm login success
  await page.waitForURL('**/inventory.html');
  
  // Save the authenticated state
  await context.storageState({ path: authFile });
});
