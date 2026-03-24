import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: undefined,
  use: {
    baseURL: 'https://www.saucedemo.com/',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10_000,
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure'
  },
  projects: [
    // Setup project that runs once to authenticate
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: { ...devices['Desktop Chrome'] } },
    
    // Chromium - purchase and shopping tests with stored authentication
    { 
      name: 'chromium', 
      use: { 
        ...devices['Desktop Chrome'],
        storageState: '.auth/standard_user.json'
      },
      testMatch: /purchase\.spec\.ts|shopping\.spec\.ts/,
      dependencies: ['setup']
    },
    
    // Firefox - purchase and shopping tests with stored authentication
    { 
      name: 'firefox', 
      use: { 
        ...devices['Desktop Firefox'],
        storageState: '.auth/standard_user.json'
      },
      testMatch: /purchase\.spec\.ts|shopping\.spec\.ts/,
      dependencies: ['setup']
    },
    
    // WebKit - purchase and shopping tests with stored authentication
    { 
      name: 'webkit', 
      use: { 
        ...devices['Desktop Safari'],
        storageState: '.auth/standard_user.json'
      },
      testMatch: /purchase\.spec\.ts|shopping\.spec\.ts/,
      dependencies: ['setup']
    }
  ]
});