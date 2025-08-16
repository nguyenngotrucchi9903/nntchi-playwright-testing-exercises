import { test, expect, chromium } from '@playwright/test';
import { ECDH } from 'crypto';

const signin = "http://localhost:3000/";
const signup = "http://localhost:3000/signup";

test.describe('Bai tap 1', () => {
    //Confirm that the user can log in successfully using valid credentials
    test('login with valid credentials', async ({ page }) => {
        await page.goto(signin);

        //Login
        const username = 'Judah_Dietrich50';
        await page.locator('//input[@id="username"]').fill(username);
        await page.locator('//input[@id="password"]').fill('s3cret');
        await page.locator('//input[@type="checkbox"]').click();
        await page.getByRole('button').click();

        //Verify login with the correct user and full UI visibility
        let displayedUsername = await page.locator('//h6[@data-test="sidenav-username"]').innerText();
        displayedUsername = displayedUsername.substring(1).trim();
        expect(displayedUsername).toEqual(username);
        await expect(page.locator('//h6[@data-test="sidenav-user-balance"]')).toBeVisible();
        await expect(page.locator('//a[@data-test="sidenav-home"]')).toBeVisible();
        await expect(page.locator('//a[@data-test="sidenav-user-settings"]')).toBeVisible();
        await expect(page.locator('//a[@data-test="sidenav-bankaccounts"]')).toBeVisible();
        await expect(page.locator('//a[@data-test="sidenav-notifications"]')).toBeVisible();
        await expect(page.locator('//div[@data-test="sidenav-signout"]')).toBeVisible();
        await expect(page.locator('//button[@data-test="sidenav-toggle"]')).toBeVisible();
        await expect(page.locator('//h1[@data-test="app-name-logo"]')).toBeVisible();
        await expect(page.locator('//a[@data-test="nav-top-new-transaction"]')).toBeVisible();
        await expect(page.locator('//a[@data-test="nav-top-notifications-link"]')).toBeVisible();
        await expect(page.locator('//div[@data-test="transaction-list"]')).toBeVisible();
        await page.close();
    });

    //Verify that the account has been registed should be logged into the system
    test('login with valid and invalid credentials', async ({ browser }) => {
        const context = await browser.newContext();

        //1. Registered new account and login with that account
        const page1 = await context.newPage();

        //Register new account
        await page1.goto(signup);
        await page1.locator('//input[@id="firstName"]').fill('Register');
        await page1.locator('//input[@id="lastName"]').fill('Account');
        await page1.locator('//input[@id="username"]').fill('regacc123');
        await page1.locator('//input[@id="password"]').fill('s3cret');
        await page1.locator('//input[@id="confirmPassword"]').fill('s3cret');
        await page1.getByRole('button').click();

        //Log in with the account just registered
        await page1.locator('//input[@id="username"]').fill('regacc123');
        await page1.locator('//input[@id="password"]').fill('s3cret');
        await page1.locator('//input[@type="checkbox"]').click();
        await page1.getByRole('button').click();

        //Verify username
        let displayedUsername = await page1.locator('//h6[@data-test="sidenav-username"]').innerText();
        displayedUsername = displayedUsername.substring(1).trim();
        expect(displayedUsername).toEqual('regacc123');
        await page1.locator('//div[@data-test="sidenav-signout"]').click();

        //2. Unregistered account
        const page2 = await context.newPage();
        await page2.goto(signin);
        await page2.locator('//input[@id="username"]').fill('unregacc123');
        await page2.locator('//input[@id="password"]').fill('s3cret');
        await page2.locator('//input[@type="checkbox"]').click();
        await page2.getByRole('button').click();
        await expect(page2.getByRole('alert')).toHaveText('Username or password is invalid');
        await browser.close();
    });

    //Verify that the notifications has 8 items in list
    test('verify notification count', async ({ page }) => {
        await page.goto(signin);

        //Login
        await page.locator('//input[@id="username"]').fill('Heath93');
        await page.locator('//input[@id="password"]').fill('s3cret');
        await page.locator('//input[@type="checkbox"]').click();
        await page.getByRole('button').click();

        //Get the number display in notification badge
        const badgeText = await page.locator('//span[@class="MuiBadge-badge NavBar-customBadge MuiBadge-standard MuiBadge-anchorOriginTopRight MuiBadge-anchorOriginTopRightRectangular MuiBadge-overlapRectangular css-1bdz51l-MuiBadge-badge"]').innerText();
        const badgeCount = parseInt(badgeText.trim(), 10);
        await page.locator('//span[@data-test="nav-top-notifications-count"]').click();

        //Count notification and compare
        const notifications = await page.locator('//ul[@data-test="notifications-list"]/li').count();
        await expect(notifications).toEqual(badgeCount);
        page.close();
    });

    //Verify that after dismissing a notification, the notifications displays the remaining notifications
    test('verify dismiss notification decreases count', async ({ page }) => {
        await page.goto(signin);

        //Login
        await page.locator('//input[@id="username"]').fill('Judah_Dietrich50');
        await page.locator('//input[@id="password"]').fill('s3cret');
        await page.locator('//input[@type="checkbox"]').click();
        await page.getByRole('button').click();

        //Take init count
        await page.locator('//span[@data-test="nav-top-notifications-count"]').click();
        const initialCount = await page.locator('//ul[@data-test="notifications-list"]/li').count();

        //Dismiss first notification
        await page.locator('//ul[@data-test="notifications-list"]/li[1]//button', { hasText: "Dismiss" }).click();
        
        //Recheck after dismiss 1 notification
        await expect(page.locator('//ul[@data-test="notifications-list"]/li')).toHaveCount(initialCount - 1);
        await expect(page.locator('//span[@data-test="nav-top-notifications-count"]/span')).toHaveText(String(initialCount - 1));
        page.close();
    });
});