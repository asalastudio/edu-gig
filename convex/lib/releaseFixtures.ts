import type { MutationCtx } from '../_generated/server';
import type { Id, TableNames } from '../_generated/dataModel';
export const RELEASE_NAMESPACE = 'release-candidate-v1';
type FixtureFile = { name: string; storageId: Id<'_storage'>; encryption: { sha256: string; nonce: string; keyId: string; size: number } };
/** Synthetic states only; no claimed live signing, delivery or credential review evidence. */
export async function seedReleaseRows(ctx: MutationCtx, args: { accounts: { alias: string; email: string; clerkId: string }[]; files: FixtureFile[] }) {
 const users: Record<string, Id<'users'>> = {};
 for (const alias of ['district-a','consultant-a']) {
  const account = args.accounts.find(a=>a.alias===alias);
  if (!account || account.email !== `k12gig-staging-${alias}+clerk_test@example.com` || !(process.env.QA_ALLOWED_CLERK_IDS ?? '').split(',').includes(account.clerkId)) throw new Error('Unapproved QA identity');
  const user = await ctx.db.query('users').withIndex('by_clerk_id',q=>q.eq('clerkId',account.clerkId)).unique();
  if (!user || user.email !== account.email || user.role !== (alias==='district-a'?'district_admin':'educator')) throw new Error('Seed verified base identities first');
  users[alias]=user._id;
 }
 if (args.files.length !== 6 || new Set(args.files.map(f=>f.storageId)).size !== 6) throw new Error('Six distinct encrypted synthetic files required');
 // Storage belonging to another manifest cannot be adopted or deleted by this one.
 const runs=await ctx.db.query('qaRuns').take(100); if (runs.length===100) throw new Error('Fixture manifest safety bound exceeded');
 for (const run of runs) if (run.records.some(r=>args.files.some(f=>f.storageId===r.id))) throw new Error('Fixture storage already owned');
 const districts=await ctx.db.query('districts').take(100); if (districts.length===100) throw new Error('District safety bound exceeded');
 const district = districts.find(d=>d.adminIds.includes(users['district-a']));
 const educator = await ctx.db.query('educators').withIndex('by_user_id',q=>q.eq('userId',users['consultant-a'])).unique();
 if (!district || !educator) throw new Error('Base membership required');
 const records: {table:string;id:string}[]=[];
 const track=<T extends TableNames>(table:T,id:Id<T>)=>{ records.push({table,id}); return id; };
 for (const f of args.files) records.push({table:'_storage',id:f.storageId});
 const now=Date.now();
 let chain: Id<'engagements'> | undefined;
 for (const title of ['accepted without agreement','modern agreement history']) {
  const needId=track('needs',await ctx.db.insert('needs',{districtId:district._id,postedByUserId:users['district-a'],orgName:district.name,areaOfNeed:'school_improvement',engagementType:'consulting',description:`SYNTHETIC QA - ${title}. No real services.`,status:'placed',createdAt:now,updatedAt:now}));
  const proposalId=track('proposals',await ctx.db.insert('proposals',{needId,educatorId:educator._id,educatorUserId:educator.userId,message:'SYNTHETIC QA - accepted fixture only',status:'accepted',createdAt:now}));
  const engagementId=track('engagements',await ctx.db.insert('engagements',{needId,proposalId,educatorId:educator._id,educatorUserId:educator.userId,districtId:district._id,buyerUserId:users['district-a'],status:'active',title:`SYNTHETIC QA - ${title}`,orgName:district.name,areaOfNeed:'school_improvement',engagementType:'consulting',createdAt:now,updatedAt:now}));
  chain=engagementId;
 }
 const contractId=track('contracts',await ctx.db.insert('contracts',{engagementId:chain!,uploadedByUserId:users['district-a'],title:'SYNTHETIC QA - original agreement with explicit versions',notes:'Fixture states; no real external signature or agreement.',managed:true,revision:4,status:'draft',createdAt:now,updatedAt:now}));
 let parent: Id<'agreementVersions'> | undefined;
 for (const [i,kind] of (['original','signed_copy','revision'] as const).entries()) {
  const owner=users[i===1?'consultant-a':'district-a']; const f=args.files[i];
  const privateFileId=track('privateFiles',await ctx.db.insert('privateFiles',{ownerUserId:owner,purpose:'agreement',engagementId:chain!,storageId:f.storageId,fileName:f.name,mimeType:'application/pdf',...f.encryption,createdAt:now+i}));
  const versionId=track('agreementVersions',await ctx.db.insert('agreementVersions',{contractId,privateFileId,number:i+1,kind,parentVersionId:parent,uploadedByUserId:owner,fileName:f.name,createdAt:now+i,sharedAt:now+i,sharedByUserId:owner}));
  if (i===0) parent=versionId;
  track('contractEvents',await ctx.db.insert('contractEvents',{contractId,versionId,actorUserId:owner,action:'version_shared',note:'SYNTHETIC QA fixture; not live share evidence',createdAt:now+i}));
  await ctx.db.patch("contracts", contractId,{currentSharedVersionId:versionId});
 }
 const amendment=track('contracts',await ctx.db.insert('contracts',{engagementId:chain!,uploadedByUserId:users['district-a'],title:'SYNTHETIC QA - separate amendment draft',managed:true,revision:1,status:'draft',createdAt:now,updatedAt:now}));
 const f=args.files[3]; const privateFileId=track('privateFiles',await ctx.db.insert('privateFiles',{ownerUserId:users['district-a'],purpose:'agreement',engagementId:chain!,storageId:f.storageId,fileName:f.name,mimeType:'application/pdf',...f.encryption,createdAt:now}));
 const versionId=track('agreementVersions',await ctx.db.insert('agreementVersions',{contractId:amendment,privateFileId,number:1,kind:'original',uploadedByUserId:users['district-a'],fileName:f.name,createdAt:now}));
 track('contractEvents',await ctx.db.insert('contractEvents',{contractId:amendment,versionId,actorUserId:users['district-a'],privateOwnerId:users['district-a'],action:'draft_saved',createdAt:now}));
 await ctx.db.insert('qaRuns',{namespace:RELEASE_NAMESPACE,records,createdAt:now});
 return {seeded:true,count:records.length};
}
