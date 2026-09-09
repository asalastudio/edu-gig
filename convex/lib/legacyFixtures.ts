import { LEGACY_FIXTURE_SHA256_HEX, LEGACY_FIXTURE_SHA256_BASE64, LEGACY_FIXTURE_SIZE } from "./legacyFixturePdf";
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id, TableNames } from '../_generated/dataModel';
import { assertBuildCommit, assertStagingEnvironment } from './staging';
export const LEGACY_NAMESPACE = 'legacy-migration-rehearsal-v1';
export const LEGACY_CONFIRMATION = 'CREATE_SYNTHETIC_LEGACY_REHEARSAL';
export function assertLegacyRehearsal(args: { namespace: string; expectedCommit: string; confirmation: string }) {
 if (assertStagingEnvironment().convexDeployment !== 'dapper-curlew-192') throw new Error('Legacy rehearsal requires exact automation deployment');
 assertBuildCommit(args.expectedCommit);
 if (args.namespace !== LEGACY_NAMESPACE || args.confirmation !== LEGACY_CONFIRMATION) throw new Error('Explicit legacy rehearsal confirmation required');
}
/** Resolve only real identities/memberships already owned by the guarded base manifest. */
export async function legacyActors(ctx: Pick<QueryCtx,'db'>) {
 const base=await ctx.db.query('qaRuns').withIndex('by_namespace',q=>q.eq('namespace','human-review-v1')).unique();
 const source=base?.records.find(r=>r.table==='engagements');
 const e=source?await ctx.db.get('engagements',source.id as Id<'engagements'>):null;
 if (!e?.districtId) throw new Error('Verified base fixture required');
 const buyer=await ctx.db.get('users',e.buyerUserId), consultant=await ctx.db.get('users',e.educatorUserId);
 const district=await ctx.db.get('districts',e.districtId), educator=await ctx.db.get('educators',e.educatorId);
 const allowed=(process.env.QA_ALLOWED_CLERK_IDS??'').split(',');
 if (!buyer?.clerkId || !consultant?.clerkId || !allowed.includes(buyer.clerkId) || !allowed.includes(consultant.clerkId) || buyer.email!=='k12gig-staging-district-a+clerk_test@example.com' || consultant.email!=='k12gig-staging-consultant-a+clerk_test@example.com' || buyer.role!=='district_admin' || consultant.role!=='educator' || !district?.adminIds.includes(buyer._id) || educator?.userId!==consultant._id) throw new Error('Verified base identity/membership mismatch');
 return {buyer,consultant,district,educator};
}
export async function insertLegacyRows(ctx: MutationCtx, storageId: Id<'_storage'>) {
 const {buyer,consultant,district,educator}=await legacyActors(ctx);
 const stored=await ctx.db.system.get(storageId);
 if(!stored || stored.size!==LEGACY_FIXTURE_SIZE || (stored.contentType!==undefined && stored.contentType!=='application/pdf') || ![LEGACY_FIXTURE_SHA256_HEX,LEGACY_FIXTURE_SHA256_BASE64].includes(stored.sha256)) throw new Error('Only the fixed synthetic PDF may be attached');
 const runs=await ctx.db.query('qaRuns').take(100);if(runs.length===100)throw new Error('Fixture manifest safety bound exceeded');
 if(runs.some(run=>run.records.some(r=>r.id===storageId)))throw new Error('Fixture storage already owned');
 const records:{table:string;id:string}[]=[{table:'_storage',id:storageId}];
 const track=<T extends TableNames>(table:T,id:Id<T>)=>{records.push({table,id});return id;};
 const now=Date.now(), fileName='synthetic-legacy-shared-source.pdf';
 const needId=track('needs',await ctx.db.insert('needs',{districtId:district._id,postedByUserId:buyer._id,orgName:district.name,areaOfNeed:'school_improvement',engagementType:'consulting',description:'SYNTHETIC QA - legacy migration rehearsal. No real services.',status:'placed',createdAt:now,updatedAt:now}));
 const proposalId=track('proposals',await ctx.db.insert('proposals',{needId,educatorId:educator._id,educatorUserId:consultant._id,message:'SYNTHETIC QA - historical attachment rehearsal',status:'accepted',attachmentStorageId:storageId,attachmentName:fileName,createdAt:now}));
 const engagementId=track('engagements',await ctx.db.insert('engagements',{needId,proposalId,educatorId:educator._id,educatorUserId:consultant._id,districtId:district._id,buyerUserId:buyer._id,status:'active',title:'SYNTHETIC QA - legacy migration rehearsal',orgName:district.name,areaOfNeed:'school_improvement',engagementType:'consulting',createdAt:now,updatedAt:now}));
 for(const [index,title] of ['Historical shared document','Independent private draft','Text-only private draft'].entries()){
  const contractId=track('contracts',await ctx.db.insert('contracts',{engagementId,uploadedByUserId:buyer._id,title:`SYNTHETIC QA - ${title}`,notes:'Rehearsal only; shared source bytes do not imply a shared agreement identity.',status:index===0?'sent':'draft',...(index<2?{storageId,fileName}:{}),createdAt:now+index,updatedAt:now+index}));
  track('contractEvents',await ctx.db.insert('contractEvents',{contractId,actorUserId:buyer._id,action:'qa_legacy_rehearsal_created',note:'SYNTHETIC QA - not live sharing/signing evidence',createdAt:now+index}));
 }
 await ctx.db.insert('qaRuns',{namespace:LEGACY_NAMESPACE,records,createdAt:now});
 return {seeded:true,count:records.length};
}
