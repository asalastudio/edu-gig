// Read-only live staging smoke. Authenticated/private content, no credential screenshots/traces.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { ConvexHttpClient } from 'convex/browser';
import { verifyBuildIdentity } from './build-identity.mjs';
import { anyApi } from 'convex/server';
import { loadTarget, expectedCommit } from './target.mjs';
import { openSession, verifyPrivateDownload } from './release-journey.mjs';
const {resources,privateDirectory}=loadTarget();
const commit=expectedCommit();
const proofClient=new ConvexHttpClient(resources.convexUrl); proofClient.setAdminAuth(process.env.CONVEX_DEPLOY_KEY);
verifyBuildIdentity(commit,await proofClient.query(anyApi.qa.environment,{}));
const roster=JSON.parse(fs.readFileSync('.qa-private/accounts.json','utf8'));
if (roster.instanceId!==resources.clerkInstanceId) throw Error('Private roster issuer mismatch');
fs.mkdirSync(privateDirectory,{recursive:true,mode:0o700});
const browser=await chromium.launch(); const report=[]; let contract;
try {
 for (const alias of (process.env.QA_SMOKE_ALIASES?.split(',') ?? ['district-a','consultant-a','district-b','consultant-b','district-teammate','review-admin'])) {
  const account=roster.accounts.find(a=>a.alias===alias); if (!account) throw Error('Missing private roster alias');
  const actor=await openSession(browser,resources,account);
  try {
   const viewer=await actor.query(anyApi.users.viewer,{}); assert.equal(viewer.role,account.role);
   assert.equal(await actor.page.locator('html').getAttribute('data-qa-commit'),commit);
   await actor.page.getByText(/STAGING · Synthetic QA data/).waitFor();
   const result={alias,role:viewer.role,onboarded:viewer.onboarded};
   if (viewer.onboarded) {
    const contracts=await actor.query(anyApi.contracts.listMine,{}); result.visibleAgreements=contracts.length;
    if (['district-a','district-teammate','consultant-a'].includes(alias)) {
     assert(contracts.length>0);
     await actor.page.goto(`${resources.appUrl}/dashboard/${alias.includes('consultant')?'educator':'district'}/contract-hub`);
     await actor.page.getByRole('heading',{name:'Contract Hub',exact:true}).waitFor();
     const agreements=await actor.query(anyApi.agreementVersions.listForEngagement,{engagementId:contracts[0].engagementId});
     const version=agreements.flatMap(a=>a.versions).find(v=>v.sharedAt!==undefined);
     assert(version,'Migrated shared private file required before smoke');
     result.download=await verifyPrivateDownload(actor,resources,version.privateFileId);
     if (alias==='district-a') contract=contracts[0].contract;
     await actor.page.setViewportSize({width:390,height:844});
     assert(await actor.page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
     result.emulated390pxReflow=true;
     await actor.page.screenshot({path:`${privateDirectory}/smoke-${alias}-390.png`,fullPage:true});
    } else if (contract) {
     await assert.rejects(actor.query(anyApi.contracts.getFileUrl,{contractId:contract._id}),/Forbidden/);
     await assert.rejects(actor.query(anyApi.contracts.listForEngagement,{engagementId:contract.engagementId}),/Forbidden/);
     result.foreignAgreementDenied=true;
    }
   }
   await actor.page.evaluate(async()=>await window.Clerk.signOut({redirectUrl:'/sign-in'}));
   await actor.page.waitForURL(url=>url.pathname.startsWith('/sign-in')); assert.equal(new URL(actor.page.url()).origin,resources.appUrl);
   result.signOutStayedInEnvironment=true; report.push(result);
   fs.writeFileSync(`${privateDirectory}/browser-smoke-progress.json`,JSON.stringify({origin:resources.appUrl,commit,report},null,2),{mode:0o600});
   console.log(`${alias}: authenticated smoke passed`);
  } finally {await actor.context.close();}
 }
 fs.writeFileSync(`${privateDirectory}/browser-smoke-results.json`,JSON.stringify({origin:resources.appUrl,commit,testedAt:new Date().toISOString(),report},null,2),{mode:0o600});
} catch { console.error('Staging smoke failed; inspect privately without credentials/auth traces.'); process.exitCode=1; }
finally {await browser.close();}
