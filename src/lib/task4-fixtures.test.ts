// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { internal, api } from '../../convex/_generated/api';
import { seeded, accounts } from './release-test-fixture';
const expectedCommit = 'a'.repeat(40), namespace = 'release-candidate-v1';
function automation() { vi.stubEnv('CONVEX_CLOUD_URL','https://dapper-curlew-192.convex.cloud'); vi.stubEnv('QA_CONVEX_DEPLOYMENT','dapper-curlew-192'); vi.stubEnv('NEXT_PUBLIC_APP_URL','https://k12gig-rc-20260908.vercel.app'); }
it('requires a matching compiled revision even for idempotent base seed/reset', async () => {
 const { t, files } = await seeded();
 for (const expectedCommit of [undefined, 'unbuilt', 'b'.repeat(40)]) {
  await expect(t.mutation(internal.qa.seedRows,{namespace:'human-review-v1',accounts,files,expectedCommit})).rejects.toThrow('commit proof');
  await expect(t.mutation(internal.qa.reset,{namespace:'human-review-v1',confirmation:'RESET_IDENTIFIED_QA_FIXTURES',expectedCommit})).rejects.toThrow('commit proof');
 }
});
it('creates a distinct modern chain and empty accepted engagement once; reset preserves base and accounts', async () => {
 const { t, files: baseFiles } = await seeded(); automation();
 const files=await t.run(async ctx=>Promise.all(baseFiles.map(async f=>({...f,storageId:await ctx.storage.store(new Blob(["fresh synthetic"]))}))));
 const base = await t.query(internal.qa.status,{namespace:'human-review-v1'});
 const args = {namespace,accounts,files,expectedCommit};
 expect((await t.mutation(internal.qa.seedRows,args)).seeded).toBe(true);
 expect((await t.mutation(internal.qa.seedRows,args)).seeded).toBe(false);
 const run = await t.run(ctx => ctx.db.query('qaRuns').withIndex('by_namespace',q=>q.eq('namespace',namespace)).unique());
 const engagements = await t.run(async ctx=> Promise.all(run!.records.filter(r=>r.table==='engagements').map(r=>ctx.db.get(r.id as never))));
 expect(engagements).toHaveLength(2);
 const versions = await t.run(ctx=>ctx.db.query('agreementVersions').collect());
 expect(versions.map(v=>v.kind)).toEqual(['original','signed_copy','revision','original']);
 expect(versions[1].parentVersionId).toBe(versions[0]._id); expect(versions[2].parentVersionId).toBe(versions[0]._id);
 const draft = versions.at(-1)!; expect(draft.sharedAt).toBeUndefined();
 await t.mutation(internal.qa.reset,{namespace,expectedCommit,confirmation:'RESET_IDENTIFIED_QA_FIXTURES'});
 expect(await t.query(internal.qa.status,{namespace:'human-review-v1'})).toEqual(base);
 expect(await t.run(ctx=>ctx.db.query('users').collect())).toHaveLength(10);
 expect(await t.run(ctx=>ctx.db.query('contracts').collect())).toHaveLength(4);
 expect(await t.mutation(internal.qa.reset,{namespace,expectedCommit,confirmation:'RESET_IDENTIFIED_QA_FIXTURES'})).toEqual({deleted:0,cancelledJobs:0});
});
it('permits stable supplementary seed without overwriting base and preserves unrelated dependents', async () => {
 const { t, files: baseFiles, as } = await seeded(); const files=await t.run(async ctx=>Promise.all(baseFiles.map(async f=>({...f,storageId:await ctx.storage.store(new Blob(["fresh synthetic"]))})))); const args={namespace,accounts,files,expectedCommit};
 expect((await t.mutation(internal.qa.seedRows,args)).seeded).toBe(true); automation();
 await t.mutation(internal.qa.seedRows,args);
 const run=await t.run(ctx=>ctx.db.query('qaRuns').withIndex('by_namespace',q=>q.eq('namespace',namespace)).unique());
 const engagementId=run!.records.find(r=>r.table==='engagements')!.id;
 await as('district-a').mutation(api.contracts.create,{engagementId:engagementId as never,title:'Reviewer dependent'});
 await expect(t.mutation(internal.qa.reset,{namespace,expectedCommit,confirmation:'RESET_IDENTIFIED_QA_FIXTURES'})).rejects.toThrow('unrelated contracts');
 expect(await t.query(internal.qa.status,{namespace})).not.toBeNull();
});
it('guards source-linked faults, retries only as recipient and cancels claimed watchdogs on reset', async () => {
 vi.useFakeTimers();
 try {
  const {t,files:baseFiles,as}=await seeded();
  const args={namespace:'release-candidate-v1' as const,expectedCommit,confirmation:'SIMULATE_CAPTURE_ONLY_DELIVERY' as const};
  await expect(t.mutation(internal.qa.deliveryFixtures,args)).rejects.toThrow(); automation();
  const files=await t.run(async ctx=>Promise.all(baseFiles.map(async f=>({...f,storageId:await ctx.storage.store(new Blob(['fresh']))}))));
  await t.mutation(internal.qa.seedRows,{namespace,expectedCommit,accounts,files});
  const faults=await t.mutation(internal.qa.deliveryFixtures,args);
  expect(await t.mutation(internal.qa.deliveryFixtures,args)).toEqual(faults);
  await expect(as('district-a').mutation(api.delivery.retry,{outboxId:faults.failedId})).rejects.toThrow('Forbidden');
  await as('consultant-a').mutation(api.delivery.retry,{outboxId:faults.failedId});
  await t.finishInProgressScheduledFunctions();
  await t.action(internal.delivery.dispatch,{outboxId:faults.failedId});
  expect((await t.run(ctx=>ctx.db.get(faults.failedId)))?.state).toBe('captured');
  await t.mutation(internal.delivery.claim,{outboxId:faults.queuedId,token:'synthetic-lease'});
  const reset=await t.mutation(internal.qa.reset,{namespace,expectedCommit,confirmation:'RESET_IDENTIFIED_QA_FIXTURES'});
  expect(reset.cancelledJobs).toBeGreaterThan(0);
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  await t.action(internal.delivery.dispatch,{outboxId:faults.queuedId});
  expect(await t.run(ctx=>ctx.db.query('deliveryOutbox').collect())).toHaveLength(0);
  expect((await t.run(ctx=>ctx.db.query('qaEmailCaptures').collect())).filter(r=>r.status==='captured')).toHaveLength(0);
 } finally {vi.useRealTimers();}
});
