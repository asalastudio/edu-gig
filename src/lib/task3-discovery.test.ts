import { describe, it, expect } from 'vitest';
import { educatorMatchesDirectoryFilters, type DirectoryFilterState } from './filter-educators';
import { mapConvexEducatorToProfileView } from './map-convex-educator-profile';
import { getAreaOfNeedLabel } from './taxonomy';
import { seeded } from './release-test-fixture';
import { api } from '../../convex/_generated/api';
const filters: DirectoryFilterState = {selectedAreas:[],selectedGrades:[],selectedRegions:[],selectedEngagements:[],verifiedOnly:false,availableNow:true,showSavedOnly:false,savedEducatorIds:[],activeQuickFilter:null};
describe('Task 3 discovery integrity',()=>{
 it('includes consultants with limited availability in accepting new clients',()=>{
  expect(educatorMatchesDirectoryFilters({availabilityStatus:'limited'} as never,filters)).toBe(true);
  expect(educatorMatchesDirectoryFilters({availabilityStatus:'closed'} as never,filters)).toBe(false);
 });
 it('retains the existing keynote identifier with clear speaking label',()=>{expect(getAreaOfNeedLabel('keynote')).toBe('Keynote speaking');});
 it('does not turn legacy verification flags into review or background evidence',()=>{
  const view=mapConvexEducatorToProfileView({verificationStatus:'premier',backgroundCheckId:'legacy',gradeLevelBands:[],areasOfNeed:[],coverageRegions:['region_2'],engagementTypes:['legacy_unique'],availabilityStatus:'limited',profileCompletePct:100} as never,{firstName:'Real',lastName:'Name'} as never,[{id:'legacy',type:'license',title:'License',issuingBody:'Example',issueDate:'2026-01-01',verified:true,hasFile:false}]);
  expect(view.badges).not.toContain('Credentials reviewed');expect(view.badges).not.toContain('Background check complete');expect(view.verificationTier).toBe('basic');
  expect(view.engagementTypes).toContain('legacy unique');
 });
 it('never automatically attaches an email-matching demo row to a new identity',async()=>{
  const {t}=await seeded();
  const seededId=await t.run(ctx=>ctx.db.insert('users',{clerkId:'seed:matching@example.com',email:'matching@example.com',firstName:'Demo',lastName:'Person',role:'educator',onboarded:true,createdAt:Date.now()}));
  await t.run(async ctx=>{ const u=await ctx.db.query('users').withIndex('by_clerk_id',q=>q.eq('clerkId','user_test4')).first(); if(u) await ctx.db.delete(u._id); });
  const result=await t.withIdentity({subject:'user_test4',email:'matching@example.com'}).mutation(api.users.claimSeededDemoAccount,{});
  expect(result.claimed).toBe(false);
  expect((await t.run(ctx=>ctx.db.get(seededId)))?.clerkId).toBe('seed:matching@example.com');
 });
 it('requires an admin and explicit supporting evidence for credential review',async()=>{
  const {t,as}=await seeded(); const c=await t.run(ctx=>ctx.db.query('credentials').first());
  const input={credentialId:c!._id,reviewed:true,note:'Compared credential to issuing registry',evidenceReference:'Registry record QA-123'};
  await expect(as('district-a').mutation(api.admin.recordCredentialReview,input)).rejects.toThrow();
  await as('review-admin').mutation(api.admin.recordCredentialReview,input);
  const rows=await as('district-a').query(api.credentials.listForEducatorProfile,{educatorId:c!.educatorId});
  expect(rows?.find(r=>r.id===c!._id)?.reviewed).toBe(true);
  expect((await as('consultant-reviewed').query(api.credentials.listMine,{})).find(r=>r._id===c!._id)?.reviewed).toBe(true);
  await as('review-admin').mutation(api.admin.recordCredentialReview,{...input,reviewed:false,note:'Review withdrawn'});
  expect((await as('district-a').query(api.credentials.listForEducatorProfile,{educatorId:c!.educatorId}))?.find(r=>r.id===c!._id)?.reviewed).toBe(false);
 });
 it('does not expose seeded legacy credential flags as directory review evidence',async()=>{
  const {as}=await seeded();const roster=await as('district-a').query(api.educators.listForBrowse,{});
  expect(roster.every(row=>!row.badges.includes('Credentials reviewed') && row.verificationTier==='basic')).toBe(true);
 });
});
it('persists independently stated delivery, compensation basis and actual consultant on draft resume',async()=>{
 const {t,as}=await seeded();const e=await t.run(ctx=>ctx.db.query('educators').first());
 const input={orgName:'Synthetic district',areaOfNeed:'school_improvement',location:'Lansing, MI',deliveryMode:'hybrid',compensationBasis:'day',selectedEducatorId:e!._id};
 const id=await as('district-a').mutation(api.needs.saveDraft,input);
 expect(await t.run(ctx=>ctx.db.get(id))).toMatchObject(input);
 await expect(as('district-a').mutation(api.needs.saveDraft,{...input,selectedEducatorId:'not-a-consultant'})).rejects.toThrow();
});
it('refuses QA reset when a fixture credential has reviewer-created evidence',async()=>{
 const {t,as}=await seeded();const c=await t.run(ctx=>ctx.db.query('credentials').first());
 await t.run(async ctx=>{await ctx.db.patch(c!.educatorId,{stateLicenses:[]});const run=await ctx.db.query('qaRuns').first();await ctx.db.patch(run!._id,{records:[...run!.records,{table:'credentials',id:c!._id}]});});
 await as('review-admin').mutation(api.admin.recordCredentialReview,{credentialId:c!._id,reviewed:true,note:'Review recorded',evidenceReference:'Issuer reference'});
 const {internal}=await import('../../convex/_generated/api');
 await expect(t.mutation(internal.qa.reset,{namespace:'human-review-v1',confirmation:'RESET_IDENTIFIED_QA_FIXTURES'})).rejects.toThrow(/credentialReviewRecords/);
});
it('stores a fresh consultant keynote specialization through normal onboarding',async()=>{
 const {t}=await seeded();const {TERMS_VERSION,PRIVACY_VERSION}=await import('./legal');
 const consultant=t.withIdentity({subject:'user_test5',email:'fresh-consultant@example.com'});
 await consultant.mutation(api.users.completeOnboarding,{role:'educator',firstName:'New',lastName:'Consultant',headline:'Leadership keynote speaker',bio:'A practical school leadership consultant with experience in keynote presentations.',yearsExperience:8,areasOfNeed:['leadership_operations'],subCategories:['keynote'],gradeLevelBands:['all'],coverageRegions:['region_2'],hourlyRate:95,dailyRate:650,termsVersion:TERMS_VERSION,privacyVersion:PRIVACY_VERSION});
 expect(await consultant.query(api.educators.getMine,{})).toMatchObject({subCategories:['keynote'],hourlyRate:95,dailyRate:650});
});
