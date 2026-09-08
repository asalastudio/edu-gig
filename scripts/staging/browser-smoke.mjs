// Read-only live staging smoke. Uses normal Clerk sign-in + provider-supported test OTP.
// No storageState, auth screenshots, passwords or bearer URLs are written to reports.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';
import { checkStaging } from './guard.mjs';
process.loadEnvFile('.env.local');
const resources = checkStaging(process.env);
const origin = process.env.QA_BROWSER_ORIGIN ?? resources.appUrl;
if (![resources.appUrl, 'http://localhost:3011'].includes(origin)) throw Error('Unexpected smoke target');
const roster = JSON.parse(fs.readFileSync('.qa-private/accounts.json')).accounts;
const browser = await chromium.launch(); const report = []; let contract; let conversation;
try {
 for (const alias of (process.env.QA_SMOKE_ALIASES?.split(',') ?? ['district-a', 'consultant-a', 'district-b', 'consultant-b', 'fresh-district', 'fresh-consultant', 'district-teammate', 'review-admin'])) {
    const account = roster.find(a => a.alias === alias);
    const context = await browser.newContext(); const page = await context.newPage(); page.setDefaultTimeout(20000);
    const intent = alias.includes('consultant') ? 'educator' : 'district';
    await page.goto(`${origin}/sign-in?intent=${intent}`);
    await page.getByLabel('Email address', { exact: true }).fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    const otp = page.locator('input[autocomplete="one-time-code"]');
    await Promise.race([otp.waitFor(), page.waitForURL(/dashboard|onboarding/)]);
    if (await otp.isVisible()) {
        // Clerk documents this non-delivery code for +clerk_test development identities.
        // It is not an application password or authorization bypass.
        await otp.fill('424242');
    }
    await page.waitForURL(/dashboard|onboarding/);
    await page.getByText(/STAGING · Synthetic QA data/).waitFor();
    const signedInPath = new URL(page.url()).pathname;
    assert.equal(new URL(page.url()).origin, origin);
    const token = await page.evaluate(async () => await window.Clerk.session.getToken({ template: 'convex' }));
    assert(token); const client = new ConvexHttpClient(resources.convexUrl); client.setAuth(token);
    const viewer = await client.query(anyApi.users.viewer, {}); assert.equal(viewer.role, account.role);
    assert.equal(viewer.onboarded, !alias.startsWith('fresh-'));
    const result = { alias, role: viewer.role, signedInPath, onboarded: viewer.onboarded };
    if (!alias.startsWith('fresh-')) {
        const contracts = await client.query(anyApi.contracts.listMine, {});
        result.contracts = contracts.length;
        if (alias === 'district-a') {
            assert.equal(contracts.length, 4); contract = contracts[0].contract;
            await page.goto(`${origin}/dashboard/district/contract-hub`);
            await page.getByRole('heading', { name: 'Add a document' }).waitFor();
            await page.getByRole('heading', { name: contract.title, exact: true }).waitFor();
            const url = await client.query(anyApi.contracts.getFileUrl, { contractId: contract._id });
            const response = await fetch(url); assert.equal(response.status, 200);
            result.download = { status: response.status, contentType: response.headers.get('content-type') };
            result.bearerFileUrlWithoutSession = true; // Existing storage design, not reauthorized per download.
            await page.setViewportSize({ width: 390, height: 844 });
            await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
            await page.getByRole('button', { name: 'Close navigation menu', exact: true }).click();
            result.mobileNavigation = 'opened and closed at 390px';
            await page.screenshot({ path: '.qa-private/staging-mobile-contract-hub.png', fullPage: true });
            await page.setViewportSize({ width: 1280, height: 720 });
        }
        if (alias === 'consultant-a') { assert.equal(contracts.length, 4); await page.goto(`${origin}/dashboard/educator/contract-hub`); await page.getByRole('heading', { name: 'Add a document' }).waitFor(); }
        if (['district-b','consultant-b'].includes(alias)) {
            assert.equal(contracts.length, 0);
            await assert.rejects(client.query(anyApi.contracts.getFileUrl, { contractId: contract._id }), /Forbidden/);
            await assert.rejects(client.query(anyApi.contracts.listForEngagement, { engagementId: contract.engagementId }), /Forbidden/);
            await assert.rejects(client.mutation(anyApi.contracts.updateStatus, { contractId: contract._id, status: 'draft' }), /Forbidden/);
            await assert.rejects(client.mutation(anyApi.contracts.generateUploadUrl, { engagementId: contract.engagementId }), /Forbidden/);
            result.foreignContractDenied = true;
            const conversations = await client.query(anyApi.messages.listMyConversations, {});
            assert.equal(conversations.length, 1); conversation = conversations[0];
        }
        if (alias === 'district-teammate') { assert.equal(contracts.length, 4); await assert.rejects(client.query(anyApi.messages.listConversation, { conversationId: conversation.conversationId }), /Forbidden/); }
    } else {
        assert.equal(signedInPath, '/onboarding');
        result.fields = await page.locator('input').evaluateAll(es => es.filter(e => !['hidden','checkbox','radio'].includes(e.type)).map(e => ({ name: e.name || e.id, value: e.value, placeholder: e.placeholder })));
    }
    await page.waitForFunction(() => window.Clerk?.loaded && window.Clerk.session, { timeout: 15000 });
    await page.evaluate(async () => await window.Clerk.signOut({ redirectUrl: '/sign-in' }));
    await page.waitForURL(url => url.pathname.startsWith('/sign-in'), {timeout: 10000});
    assert.equal(new URL(page.url()).origin, origin);
    result.signOutStayedInEnvironment = true; report.push(result); fs.writeFileSync(".qa-private/browser-smoke-progress.json", JSON.stringify({origin,report},null,2), {mode:0o600}); console.log(alias + ": authenticated smoke passed"); await context.close();
 }
 fs.writeFileSync('.qa-private/browser-smoke-results.json', JSON.stringify({ origin, testedAt: new Date().toISOString(), report }, null, 2), { mode: 0o600 });
 console.log(JSON.stringify(report.map(({ alias, role, onboarded, contracts, foreignContractDenied, signOutStayedInEnvironment }) => ({ alias, role, onboarded, contracts, foreignContractDenied, signOutStayedInEnvironment })), null, 2));
} finally { await browser.close(); }
