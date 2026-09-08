vi.mock("../../convex/buildIdentity", () => ({ BUILD_COMMIT: "a".repeat(40) }));
// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { checkStaging } from '../../scripts/staging/guard.mjs';
import stable from '../../scripts/staging/resources.json';
import { assertStagingEnvironment } from '../../convex/lib/staging';
import { api } from '../../convex/_generated/api';
import { seeded } from './release-test-fixture';
const automation = { ...stable, convexDeployment: 'dapper-curlew-192', convexUrl: 'https://dapper-curlew-192.convex.cloud', convexSiteUrl: 'https://dapper-curlew-192.convex.site', appUrl: 'https://k12gig-rc-20260908.vercel.app', vercelProjectId: 'prj_BCDKkXbjjoBhyvBOBZBn7qHpO7Wm' };
function env(r = stable) { return { APP_ENV: 'staging', NEXT_PUBLIC_APP_ENV: 'staging', NEXT_PUBLIC_APP_URL: r.appUrl, NEXT_PUBLIC_CONVEX_URL: r.convexUrl, NEXT_PUBLIC_CONVEX_SITE_URL: r.convexSiteUrl, QA_CONVEX_DEPLOYMENT: r.convexDeployment, CLERK_JWT_ISSUER_DOMAIN: r.clerkIssuer, QA_CLERK_INSTANCE_ID: r.clerkInstanceId, QA_EMAIL_MODE: 'capture', NEXT_PUBLIC_ENABLE_CHECKR: 'false', NEXT_PUBLIC_ENABLE_CARD_CHECKOUT: 'false', NEXT_PUBLIC_ENABLE_LEGACY_CHECKOUT: 'false', CLERK_SECRET_KEY: 'sk_test_fake', NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_' + Buffer.from(r.clerkIssuer.slice(8) + '$').toString('base64'), CONVEX_DEPLOY_KEY: `dev:${r.convexDeployment}|fake`, QA_ALLOWED_CLERK_IDS: 'user_fake', VERCEL_PROJECT_ID: r.vercelProjectId, VERCEL_ORG_ID: r.vercelTeamId }; }
it('accepts exactly both pinned resources and rejects every mixed binding and unknown deployment', () => {
 for (const r of [stable, automation]) {
  expect(checkStaging(env(r)).convexDeployment).toBe(r.convexDeployment);
  for (const key of ['NEXT_PUBLIC_APP_URL','NEXT_PUBLIC_CONVEX_URL','NEXT_PUBLIC_CONVEX_SITE_URL','QA_CONVEX_DEPLOYMENT','CLERK_JWT_ISSUER_DOMAIN','QA_CLERK_INSTANCE_ID','CONVEX_DEPLOY_KEY','VERCEL_PROJECT_ID','VERCEL_ORG_ID']) expect(() => checkStaging({ ...env(r), [key]: 'unknown' })).toThrow();
 }
 expect(() => checkStaging({ ...env(automation), NEXT_PUBLIC_APP_URL: stable.appUrl })).toThrow();
});
it('resolves backend target from actual cloud URL and rejects a label-only or mixed target', () => {
 for (const [k,v] of Object.entries({ CONVEX_CLOUD_URL: automation.convexUrl, NEXT_PUBLIC_APP_URL: automation.appUrl, QA_CONVEX_DEPLOYMENT: automation.convexDeployment })) vi.stubEnv(k,v);
 expect(assertStagingEnvironment()?.convexDeployment).toBe(automation.convexDeployment);
 vi.stubEnv('CONVEX_CLOUD_URL', stable.convexUrl); expect(() => assertStagingEnvironment()).toThrow();
});
it.each([false,true])('keeps unmanaged legacy draft metadata and activity private (content %s)', async content => {
 const { t, rows, as } = await seeded(); const base = rows.contracts.find(c => c.status === 'draft')!;
 await t.run(ctx => ctx.db.patch(base._id, { storageId: content ? base.storageId : undefined, notes: 'PRIVATE LEGACY NOTES' }));
 for (const alias of ['district-a','district-teammate']) {
  expect((await as(alias).query(api.contracts.listForEngagement,{engagementId:base.engagementId})).some(c => c._id === base._id)).toBe(true);
  expect(await as(alias).query(api.contracts.listEvents,{contractId:base._id})).not.toHaveLength(0);
 }
 const caller = as('consultant-a');
 expect((await caller.query(api.contracts.listForEngagement,{engagementId:base.engagementId})).some(c => c._id === base._id)).toBe(false);
 expect((await caller.query(api.contracts.listMine,{})).some(c => c.contract._id === base._id)).toBe(false);
 await expect(caller.query(api.contracts.listEvents,{contractId:base._id})).rejects.toThrow('Forbidden');
 const modern = await caller.query(api.agreementVersions.listForEngagement,{engagementId:base.engagementId});
 expect(modern.some(c => c.contractId === base._id)).toBe(false);
 expect(modern).toHaveLength(3);
});

import { buildIdentitySource, verifyBuildIdentity } from '../../scripts/staging/build-identity.mjs';
it('compiles only an exact reviewed commit and refuses missing/mismatched backend proof', () => {
 const sha = 'a'.repeat(40);
 expect(buildIdentitySource({ QA_BUILD_COMMIT: sha })).toContain(JSON.stringify(sha));
 for (const input of [{}, { QA_BUILD_COMMIT:'main' }, { QA_BUILD_COMMIT:sha, VERCEL_GIT_COMMIT_SHA:'b'.repeat(40) }]) expect(() => buildIdentitySource(input)).toThrow();
 expect(() => verifyBuildIdentity(sha, { buildCommit: sha })).not.toThrow();
 for (const proof of [{}, {buildCommit:'unbuilt'}, {buildCommit:'b'.repeat(40)}]) expect(() => verifyBuildIdentity(sha,proof)).toThrow();
});

import { selectedTarget, expectedCommit } from '../../scripts/staging/target.mjs';
import { assertMutableTarget, signIn, runJourney, journeyCases } from '../../scripts/staging/release-journey.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
it('defaults to stable and explicitly selects isolated automation without changing stable paths', () => {
 expect(selectedTarget([]).envPath).toBe('.env.local');
 expect(selectedTarget(['--automation']).resources.convexDeployment).toBe(automation.convexDeployment);
 expect(selectedTarget(['--automation']).envPath).toBe('.qa-private/automation-infra/app.env');
 expect(()=>expectedCommit([])).toThrow();
 expect(()=>assertMutableTarget(stable)).toThrow();
 expect(()=>assertMutableTarget(automation)).not.toThrow();
 expect(()=>assertMutableTarget({...automation,appUrl:stable.appUrl})).toThrow();
});
it('sanitizes credential-step errors and never presents missing live cases as passes', async () => {
 const secret='PASSWORD_MUST_NEVER_APPEAR';
 await expect(signIn({goto:async()=>{throw Error(secret);}},stable.appUrl,{alias:'district-a'})).rejects.toThrow('Clerk authentication step failed');
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'k12gig-harness-test-'));
 try {
  const output=path.join(directory,'results.json');
  const result=await runJourney({resources:automation,verifiedCommit:'a'.repeat(40),cases:{[journeyCases[0]]:async()=>{throw Error(secret);}},output,browser:undefined,accounts:[]});
  expect(result[0].status).toBe('Fail'); expect(result.slice(1).every(r=>r.status==='Blocked')).toBe(true);
  expect(fs.readFileSync(output,'utf8')).not.toContain(secret);
  expect(JSON.parse(fs.readFileSync(output,'utf8')).commit).toBe('a'.repeat(40));
 } finally {fs.rmSync(directory,{recursive:true});}
});
