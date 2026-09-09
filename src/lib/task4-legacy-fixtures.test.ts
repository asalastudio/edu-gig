// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { seeded, accounts } from './release-test-fixture';
import { decryptFile } from '../../convex/lib/privateCrypto';
const expectedCommit='a'.repeat(40), namespace='legacy-migration-rehearsal-v1' as const;
const args={namespace,expectedCommit,confirmation:'CREATE_SYNTHETIC_LEGACY_REHEARSAL' as const};
function automation() {vi.stubEnv('CONVEX_CLOUD_URL','https://dapper-curlew-192.convex.cloud');vi.stubEnv('QA_CONVEX_DEPLOYMENT','dapper-curlew-192');vi.stubEnv('NEXT_PUBLIC_APP_URL','https://k12gig-rc-20260908.vercel.app');}
async function modernBase() {
 const fixture=await seeded();
 await fixture.t.mutation(internal.qa.reset,{namespace:'human-review-v1',expectedCommit,confirmation:'RESET_IDENTIFIED_QA_FIXTURES'});
 vi.stubEnv('PRIVATE_FILE_KEY','11'.repeat(32));vi.stubEnv('PRIVATE_FILE_KEY_ID','legacy-rehearsal-test');
 const files=Array.from({length:6},(_,i)=>({name:`synthetic-${i}.pdf`,base64:Buffer.from(`%PDF-1.7\nSYNTHETIC QA ${i}\n%%EOF`).toString('base64')}));
 await fixture.t.action(internal.qa.seed,{namespace:'human-review-v1',expectedCommit,accounts,files});
 return {...fixture,files};
}
it('rejects stable, wrong compiled revision and missing explicit confirmation before legacy writes', async()=>{
 const {t}=await modernBase();
 await expect(t.action(internal.qa.seedLegacyRehearsal,args)).rejects.toThrow('automation');automation();
 await expect(t.action(internal.qa.seedLegacyRehearsal,{...args,expectedCommit:'b'.repeat(40)})).rejects.toThrow('commit proof');
 await expect(t.action(internal.qa.seedLegacyRehearsal,{namespace,expectedCommit} as never)).rejects.toThrow();
 const foreign=await t.run(ctx=>ctx.storage.store(new Blob(['unrelated bytes'])));
 await expect(t.mutation(internal.qa.seedLegacyRehearsalRows,{...args,storageId:foreign})).rejects.toThrow('fixed synthetic PDF');
 expect((await t.action(internal.privateMigration.migrateLegacy,{dryRun:true})).rows).toHaveLength(0);
 expect(await t.run(ctx=>ctx.db.query('qaRuns').collect())).toHaveLength(1);
});
it('rehearses three real legacy sources sharing bytes without merging identities, then safely resets derived records',async()=>{
 const {t,as,files}=await modernBase();automation();
 await t.action(internal.qa.seed,{namespace:'release-candidate-v1',expectedCommit,accounts,files});
 const before=await t.run(async ctx=>({runs:await ctx.db.query('qaRuns').collect(),contracts:await ctx.db.query('contracts').collect(),files:await ctx.db.query('privateFiles').collect()}));
 expect((await t.action(internal.qa.seedLegacyRehearsal,args)).seeded).toBe(true);
 expect((await t.action(internal.qa.seedLegacyRehearsal,args)).seeded).toBe(false);
 const run=await t.run(ctx=>ctx.db.query('qaRuns').withIndex('by_namespace',q=>q.eq('namespace',namespace)).unique());
 const legacy=await t.run(async ctx=>Promise.all(run!.records.filter(r=>r.table==='contracts').map(r=>ctx.db.get('contracts',r.id as never))));
 expect(legacy).toHaveLength(3); expect(legacy.filter(c=>c?.storageId)).toHaveLength(2);
 const sourceId=legacy[0]!.storageId!;
 expect(legacy[1]!.storageId).toBe(sourceId); expect(legacy[0]!.fileName).toBe(legacy[1]!.fileName);
 const original=new Uint8Array(await t.run(async ctx=>(await ctx.storage.get(sourceId))!.arrayBuffer()));
 const dry=await t.action(internal.privateMigration.migrateLegacy,{dryRun:true});
 expect(dry.rows).toHaveLength(3);expect(dry.rows.every(r=>r.state==='ready')).toBe(true);expect(new Set(dry.rows.map(r=>r.legacyStorageId)).size).toBe(1);
 const applied=await t.action(internal.privateMigration.migrateLegacy,{dryRun:false,confirmation:'ENCRYPT_VERIFIED_STAGING_ORIGINALS',retireOriginals:true});
 expect(applied.migrated).toBe(3);expect(applied.retired).toBe(1);
 const migrated=await t.run(ctx=>ctx.db.query('privateMigration').collect());expect(migrated).toHaveLength(3);
 for(const row of migrated){const f=await t.run(ctx=>ctx.db.get('privateFiles',row.privateFileId));const bytes=new Uint8Array(await t.run(async ctx=>(await ctx.storage.get(f!.storageId))!.arrayBuffer()));expect(await decryptFile(bytes,f!)).toEqual(original);}
 const sameIds=await t.run(async ctx=>Promise.all(legacy.map(c=>ctx.db.get('contracts',c!._id))));expect(sameIds.map(c=>c?._id)).toEqual(legacy.map(c=>c?._id));
 const visible=await as('consultant-a').query(api.agreementVersions.listForEngagement,{engagementId:legacy[0]!.engagementId});expect(visible).toHaveLength(1);
 const again=await t.action(internal.privateMigration.migrateLegacy,{dryRun:false,confirmation:'ENCRYPT_VERIFIED_STAGING_ORIGINALS',retireOriginals:true});expect(again.migrated).toBe(0);expect(again.retired).toBe(0);
 expect((await t.action(internal.qa.seedLegacyRehearsal,args)).seeded).toBe(false);
 const dependent=await as('district-a').mutation(api.contracts.create,{engagementId:legacy[0]!.engagementId,title:'Reviewer work'});
 await expect(t.mutation(internal.qa.reset,{namespace,expectedCommit,confirmation:'RESET_IDENTIFIED_QA_FIXTURES'})).rejects.toThrow('unrelated contracts');
 await t.run(async ctx=>{for(const e of await ctx.db.query('contractEvents').withIndex('by_contract',q=>q.eq('contractId',dependent)).collect())await ctx.db.delete('contractEvents',e._id);await ctx.db.delete('contracts',dependent);});
 await t.mutation(internal.qa.reset,{namespace,expectedCommit,confirmation:'RESET_IDENTIFIED_QA_FIXTURES'});
 expect(await t.run(ctx=>ctx.db.query('qaRuns').collect())).toEqual(before.runs);expect(await t.run(ctx=>ctx.db.query('contracts').collect())).toEqual(before.contracts);expect(await t.run(ctx=>ctx.db.query('privateFiles').collect())).toEqual(before.files);
 expect(await t.run(ctx=>ctx.db.query('privateMigration').collect())).toHaveLength(0);expect(await t.run(ctx=>ctx.storage.get(sourceId))).toBeNull();
 expect((await t.mutation(internal.qa.reset,{namespace,expectedCommit,confirmation:'RESET_IDENTIFIED_QA_FIXTURES'})).deleted).toBe(0);
});
