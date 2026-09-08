import {beforeEach, describe, it, expect} from 'vitest';
import {readDirectoryState, writeDirectoryState, localCalendarDay, readSavedConsultants, toggleSavedConsultant, readPostingSession, writePostingSession} from './discovery-state';
beforeEach(()=>{localStorage.clear();sessionStorage.clear();});
describe('directory URL and account continuity',()=>{
 it('round-trips all filters, repeated areas, specialization and sort',()=>{
  const state=readDirectoryState(new URLSearchParams('area=school_improvement&area=leadership_operations&specialization=keynote&grade=6_8&location=region_2&availability=accepting&sort=rate&saved=1'));
  expect(state.selectedAreas).toEqual(['school_improvement','leadership_operations']);expect(state.selectedSpecializations).toEqual(['keynote']);expect(state.availableNow).toBe(true);expect(state.sortOption).toBe('rate');
  expect(readDirectoryState(new URLSearchParams(writeDirectoryState(state)))).toEqual(state);
 });
 it('rejects malformed sort/filter values and resets all selection on an empty URL',()=>{
  expect(readDirectoryState(new URLSearchParams('sort=garbage&grade=garbage&availability=garbage')).sortOption).toBe('relevance');
  expect(readDirectoryState(new URLSearchParams()).selectedAreas).toEqual([]);
 });
 it('saves independently by actual account and leaves legacy data unattributed',()=>{
  localStorage.setItem('k12gig_saved_educators',JSON.stringify(['legacy']));
  toggleSavedConsultant('account-a','consultant-a');expect(readSavedConsultants('account-a')).toEqual(['consultant-a']);expect(readSavedConsultants('account-b')).toEqual([]);expect(readSavedConsultants(null)).toEqual([]);
  toggleSavedConsultant('account-a','consultant-a');expect(readSavedConsultants('account-a')).toEqual([]);expect(localStorage.getItem('k12gig_saved_educators')).toBe('["legacy"]');
 });
 it('retains partial anonymous and account drafts without importing either',()=>{
  writePostingSession(null,'new',{input:{orgName:'Anonymous'},step:2,educatorId:'real-id'});
  writePostingSession('a','new',{input:{orgName:'Account A',startDate:'2027-02-15'},step:3});
  expect(readPostingSession('b','new')).toBe(null);expect(readPostingSession('a','new')?.input.startDate).toBe('2027-02-15');expect(readPostingSession(null,'new')?.input.orgName).toBe('Anonymous');
 });
 it('uses calendar components rather than UTC day for a native date minimum',()=>{
  const local={getFullYear:()=>2026,getMonth:()=>8,getDate:()=>9,toISOString:()=> '2026-09-08T19:00:00Z'};
  expect(localCalendarDay(local as Date)).toBe('2026-09-09');
 });
});
it('accepts established homepage spec and legacy support aliases without dropping their meaning',()=>{
 const value=readDirectoryState(new URLSearchParams('area=data&spec=data_coaching'));
 expect(value.selectedAreas).toEqual(['data']);expect(value.selectedSpecializations).toEqual(['data_coaching']);
});
it('formats the same local calendar date under the active timezone and locale',()=>{
 expect(localCalendarDay(new Date(2026,8,9,0,5))).toBe('2026-09-09');
});
