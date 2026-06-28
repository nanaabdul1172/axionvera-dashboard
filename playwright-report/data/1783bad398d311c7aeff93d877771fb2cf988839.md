# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline.spec.ts >> PWA Offline Resilience >> should retrieve and render balances and transactions from local cache when offline
- Location: tests\e2e\offline.spec.ts:51:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button[aria-label="Refresh vault balances"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button[aria-label="Refresh vault balances"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - main [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e7]: Axionvera Network · Stellar (Soroban)
          - heading "Axionvera Dashboard" [level=1] [ref=e9]
          - paragraph [ref=e10]: Connect your Stellar wallet, deposit into the Axionvera vault, withdraw tokens, claim rewards, and track your on-chain activity.
          - generic [ref=e11]:
            - generic [ref=e14]: GABC12...678PQR
            - link "Open the dashboard to manage your vault" [ref=e15] [cursor=pointer]:
              - /url: /dashboard
              - text: Open Dashboard
            - button "Disconnect Stellar wallet" [ref=e16] [cursor=pointer]: Disconnect
        - generic [ref=e17]:
          - generic [ref=e18]:
            - generic [ref=e19]: Multi-Wallet
            - generic [ref=e20]: Connect via Freighter or Albedo. Switch wallets at any time without losing your session.
          - generic [ref=e21]:
            - generic [ref=e22]: Vault
            - generic [ref=e23]: Deposit, withdraw, and claim rewards via an SDK adapter.
          - generic [ref=e24]:
            - generic [ref=e25]: History
            - generic [ref=e26]: Track your latest vault transactions and statuses.
    - region "Notifications alt+T"
    - generic [ref=e32]:
      - generic [ref=e33]:
        - img [ref=e34]
        - generic [ref=e41]: Offline Mode
      - paragraph [ref=e42]: Using offline data. Functionality might be limited.
  - alert [ref=e43]
```

# Test source

```ts
  5   |   test.beforeEach(async ({ page }) => {
  6   |     // Inject flag to force-enable service worker in dev/test builds
  7   |     await page.addInitScript(() => {
  8   |       (window as any).NEXT_PUBLIC_ENABLE_PWA_DEV = 'true';
  9   |     });
  10  | 
  11  |     // Connect wallet to access dashboard pages
  12  |     await mockConnectedWallet(page);
  13  |   });
  14  | 
  15  |   test('should register service worker successfully', async ({ page }) => {
  16  |     await page.goto('/');
  17  |     
  18  |     // Service worker registers on load, check for active registrations
  19  |     const hasSW = await page.evaluate(async () => {
  20  |       if (!('serviceWorker' in navigator)) return false;
  21  |       // Wait for registration logic to trigger
  22  |       await new Promise(resolve => setTimeout(resolve, 1000));
  23  |       const regs = await navigator.serviceWorker.getRegistrations();
  24  |       return regs.length > 0;
  25  |     });
  26  | 
  27  |     expect(hasSW).toBeDefined();
  28  |   });
  29  | 
  30  |   test('should render offline banner when network drops', async ({ page, context }) => {
  31  |     await page.goto('/dashboard');
  32  |     
  33  |     // Verify offline indicator is NOT visible when online
  34  |     const offlineBanner = page.locator('text=Offline Mode');
  35  |     await expect(offlineBanner).not.toBeVisible();
  36  | 
  37  |     // Turn browser offline
  38  |     await context.setOffline(true);
  39  |     
  40  |     // Verify offline banner pops up
  41  |     await expect(offlineBanner).toBeVisible();
  42  |     await expect(page.locator('text=Using offline data')).toBeVisible();
  43  | 
  44  |     // Recover network connection
  45  |     await context.setOffline(false);
  46  |     
  47  |     // Verify offline banner goes away
  48  |     await expect(offlineBanner).not.toBeVisible();
  49  |   });
  50  | 
  51  |   test('should retrieve and render balances and transactions from local cache when offline', async ({ page, context }) => {
  52  |     const testAddress = 'GABC123MOCKADDRESS456DEF789GHI012JKL345MNO678PQR';
  53  |     
  54  |     // Navigate to dashboard while online
  55  |     await page.goto('/dashboard');
  56  |     await page.waitForLoadState('domcontentloaded');
  57  | 
  58  |     // Seed localStorage with mock cache data while online
  59  |     await page.evaluate(({ address }) => {
  60  |       const balanceCache = {
  61  |         data: { balance: '1234.5678', rewards: '99.99' },
  62  |         timestamp: Date.now()
  63  |       };
  64  |       
  65  |       const txsCache = {
  66  |         data: [
  67  |           { id: 'tx-offline-1', type: 'deposit', amount: '1000', status: 'success', createdAt: new Date().toISOString() }
  68  |         ],
  69  |         timestamp: Date.now()
  70  |       };
  71  | 
  72  |       const analyticsCache = {
  73  |         data: {
  74  |           historicalBalances: [
  75  |             { timestamp: new Date().toISOString(), balance: '1234.5678', rewards: '99.99' }
  76  |           ],
  77  |           rewardPerformance: {
  78  |             totalRewardsEarned: '99.99',
  79  |             averageRewardRate: '5.2',
  80  |             lastRewardDate: new Date().toISOString()
  81  |           },
  82  |           participationMetrics: {
  83  |             totalDeposits: '1000',
  84  |             totalWithdrawals: '0',
  85  |             netDeposits: '1000',
  86  |             transactionCount: 1,
  87  |             firstInteractionDate: new Date().toISOString(),
  88  |             lastInteractionDate: new Date().toISOString(),
  89  |             activeDays: 1
  90  |           }
  91  |         },
  92  |         timestamp: Date.now()
  93  |       };
  94  | 
  95  |       localStorage.setItem(`axionvera:cache:balances:${address}`, JSON.stringify(balanceCache));
  96  |       localStorage.setItem(`axionvera:cache:transactions:${address}`, JSON.stringify(txsCache));
  97  |       localStorage.setItem(`axionvera:cache:analytics:${address}`, JSON.stringify(analyticsCache));
  98  |     }, { address: testAddress });
  99  | 
  100 |     // Go offline
  101 |     await context.setOffline(true);
  102 |     
  103 |     // Click the "Refresh" button on the dashboard to trigger state update while offline
  104 |     const refreshButton = page.locator('button[aria-label="Refresh vault balances"]');
> 105 |     await expect(refreshButton).toBeVisible();
      |                                 ^ Error: expect(locator).toBeVisible() failed
  106 |     await refreshButton.click();
  107 | 
  108 |     // Dashboard should successfully display cached state instead of blank/error state
  109 |     const cachedBalance = page.locator('text=1,234.5678');
  110 |     await expect(cachedBalance).toBeVisible({ timeout: 5000 });
  111 | 
  112 |     // Verify transaction history loads the cached tx
  113 |     const txRow = page.locator('text=1,000');
  114 |     await expect(txRow).toBeVisible();
  115 | 
  116 |     // Verify indicator tells user they are viewing cached data
  117 |     const toastMsg = page.locator('text=Displaying cached vault details');
  118 |     await expect(toastMsg).toBeVisible();
  119 |     
  120 |     // Restore network
  121 |     await context.setOffline(false);
  122 |   });
  123 | });
  124 | 
```