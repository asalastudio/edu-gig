// Live harness: normal Clerk sessions only. Never records authentication state/traces.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';
import { loadTarget, expectedCommit } from './target.mjs';
import { verifyBuildIdentity } from './build-identity.mjs';

export const journeyCases = ['signup-district','signup-consultant','onboarding','discovery-filters','profile-save-message','post-draft-review','publish-need','submit-proposal','accept-proposal','private-agreement','share-and-notify','signed-copy-history','work-complete-archive','cancel-reopen'];
export function assertMutableTarget(resources) {
 if (resources.convexDeployment !== 'dapper-curlew-192' || resources.convexUrl !== 'https://dapper-curlew-192.convex.cloud' || resources.appUrl !== 'https://k12gig-rc-20260908.vercel.app' || resources.vercelProjectId !== 'prj_BCDKkXbjjoBhyvBOBZBn7qHpO7Wm') throw Error('Mutable journey requires exact automation target');
}
export async function signIn(page, origin, account) {
 try {
  await page.goto(`${origin}/sign-in?intent=${account.alias.includes('consultant')?'educator':'district'}`);
  await page.getByLabel('Email address',{exact:true}).fill(account.email);
  await page.getByLabel('Password',{exact:true}).fill(account.password);
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  const otp=page.locator('input[autocomplete="one-time-code"]');
  await Promise.race([otp.waitFor({timeout:20000}),page.waitForURL(/dashboard|onboarding/,{timeout:20000})]);
  if (await otp.isVisible()) await otp.fill('424242');
  await page.waitForURL(/dashboard|onboarding/,{timeout:20000});
  await page.waitForFunction(()=>window.Clerk?.loaded && window.Clerk.session);
 } catch { throw Error('Clerk authentication step failed; inspect privately without credentials or traces'); }
}
export async function openSession(browser, resources, account) {
 const context=await browser.newContext(); const page=await context.newPage(); page.setDefaultTimeout(20000);
 try { await signIn(page,resources.appUrl,account); }
 catch (error) { await context.close(); throw error; }
 const client=new ConvexHttpClient(resources.convexUrl);
 const token=async()=>{
  try { const jwt=await page.evaluate(async()=>await window.Clerk.session.getToken({template:'convex',skipCache:true})); if (!jwt) throw Error(); return jwt; }
  catch { throw Error('Authenticated session unavailable'); }
 };
 const invoke=async(kind,reference,args)=>{client.setAuth(await token());return client[kind](reference,args);};
 return {context,page,token,query:(ref,args)=>invoke('query',ref,args),mutation:(ref,args)=>invoke('mutation',ref,args),action:(ref,args)=>invoke('action',ref,args)};
}
export async function verifyPrivateDownload(actor,resources,privateFileId) {
 const metadata=await actor.query(anyApi.privateFiles.metadata,{privateFileId});
 assert.equal(metadata.downloadUrl,`/api/private-files/${privateFileId}`);
 const app=await actor.context.request.get(resources.appUrl+metadata.downloadUrl);
 assert.equal(app.status(),200); assert.match(app.headers()['cache-control'],/private|no-store/);
 const direct=await fetch(`${resources.convexSiteUrl}/private-files/download?fileId=${privateFileId}`,{headers:{Authorization:`Bearer ${await actor.token()}`}});
 assert.equal(direct.status,200);
 const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
 assert.equal(hash(await app.body()),metadata.sha256); assert.equal(hash(Buffer.from(await direct.arrayBuffer())),metadata.sha256);
 const anonymous=await fetch(`${resources.convexSiteUrl}/private-files/download?fileId=${privateFileId}`);
 assert([401,403].includes(anonymous.status));
 const appAnonymous=await fetch(resources.appUrl+metadata.downloadUrl,{redirect:'manual'});
 assert([302,303,307,308,401,403,404].includes(appAnonymous.status));
 return {authenticatedStatus:200,sha256Matched:true,anonymousDenied:true};
}
/** Adapters assert actual behavior. Missing cases remain Blocked. Never persist raw errors. */
export async function runJourney({resources,verifiedCommit,cases,output,browser,accounts}) {
 assertMutableTarget(resources);
 verifyBuildIdentity(verifiedCommit,{buildCommit:verifiedCommit});
 const results=[];
 for (const id of journeyCases) {
  if (!cases[id]) {results.push({id,status:'Blocked',reason:'Live case adapter not supplied'});continue;}
  const start=performance.now();
  try {await cases[id]({browser,resources,accounts,openSession,verifyPrivateDownload});results.push({id,status:'Pass',durationMs:Math.round(performance.now()-start)});}
  catch {results.push({id,status:'Fail',reason:'Live assertion failed; inspect privately without auth traces',durationMs:Math.round(performance.now()-start)});}
 }
 fs.writeFileSync(output,JSON.stringify({target:resources.convexDeployment,commit:verifiedCommit,measuredAt:new Date().toISOString(),conditions:'Desktop Chromium; no throttling unless case adapter explicitly configures it. Not physical-device or screen-reader proof.',results},null,2),{mode:0o600});
 return results;
}
async function main() {
 const {resources,privateDirectory}=loadTarget(); assertMutableTarget(resources);
 const commit=expectedCommit(); const client=new ConvexHttpClient(resources.convexUrl); client.setAdminAuth(process.env.CONVEX_DEPLOY_KEY);
 verifyBuildIdentity(commit,await client.query(anyApi.qa.environment,{}));
 const adapterArg=process.argv.find(a=>a.startsWith('--cases='))?.slice(8);
 if (!adapterArg) throw Error('Provide --cases=.qa-private/<reviewed adapter>.mjs; missing live cases are Blocked');
 const adapterPath=fs.realpathSync(adapterArg); const privateRoot=fs.realpathSync('.qa-private');
 if (!adapterPath.startsWith(privateRoot+path.sep)) throw Error('Live adapter must be inside private QA directory');
 const {cases}=await import(pathToFileURL(adapterPath));
 const roster=JSON.parse(fs.readFileSync('.qa-private/accounts.json','utf8'));
 if (roster.instanceId!==resources.clerkInstanceId) throw Error('Private roster issuer mismatch');
 fs.mkdirSync(privateDirectory,{recursive:true,mode:0o700}); const browser=await chromium.launch();
 try {
  const results=await runJourney({resources,verifiedCommit:commit,cases,output:`${privateDirectory}/journey-results.json`,browser,accounts:roster.accounts});
  console.log(JSON.stringify(results)); if (results.some(r=>r.status!=='Pass')) process.exitCode=1;
 } finally {await browser.close();}
}
if (process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) main().catch(()=>{console.error('Live journey stopped; inspect private setup without exposing credentials.');process.exitCode=1;});
