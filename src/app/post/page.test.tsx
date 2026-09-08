import {render, screen, fireEvent, waitFor, cleanup} from '@testing-library/react';
import {vi, test, expect, beforeEach, afterEach} from 'vitest';
import {getFunctionName} from 'convex/server';
import {writePostingSession} from '@/lib/discovery-state';
const state=vi.hoisted(()=>({viewer:null as { _id:string; role:string } | null,params:new URLSearchParams(),push:vi.fn(),replace:vi.fn(),publish:vi.fn(async()=> 'draft-id'),save:vi.fn(async()=> 'draft-id')}));
vi.hoisted(()=>{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY='pk_test_placeholder'});
vi.mock('next/navigation',()=>({useRouter:()=>({push:state.push,replace:state.replace}),useSearchParams:()=>state.params}));
vi.mock('convex/react',()=>({useQuery:(ref:Parameters<typeof getFunctionName>[0])=>getFunctionName(ref)==='users:viewer'?state.viewer:null,useMutation:(ref:Parameters<typeof getFunctionName>[0])=>getFunctionName(ref)==="needs:publishDraft"?state.publish:state.save}));
vi.mock('@/components/shared/site-header',()=>({SiteHeader:()=>null}));
vi.mock('@/components/shared/site-footer',()=>({SiteFooter:()=>null}));
import Post from './page';
afterEach(cleanup);
beforeEach(()=>{sessionStorage.clear();localStorage.clear();window.scrollTo=vi.fn();state.viewer=null;state.params=new URLSearchParams();state.push.mockClear();state.replace.mockClear();state.save.mockClear();});
function begin(){fireEvent.click(screen.getByText('Preview the form'));fireEvent.change(screen.getByLabelText('Organization Name *'),{target:{value:'Synthetic QA'}});fireEvent.change(screen.getByLabelText('Support Type *'),{target:{value:'school_improvement'}});fireEvent.click(screen.getByText('Continue'));}
test('posting date survives the logistics/details round-trip',()=>{
 render(<Post/>);begin();fireEvent.change(screen.getByLabelText(/Desired Start Date/),{target:{value:'2027-10-15'}});fireEvent.change(screen.getByLabelText(/Duration/),{target:{value:'8 weeks'}});
 fireEvent.click(screen.getByText('Continue'));fireEvent.click(screen.getByText('Back'));expect(screen.getByLabelText(/Desired Start Date/)).toHaveValue('2027-10-15');expect(screen.getByLabelText(/Duration/)).toHaveValue('8 weeks');
});
test('restores every partial anonymous field and step on refresh, with a final sign-in review',()=>{
 const view=render(<Post/>);begin();fireEvent.change(screen.getByLabelText(/Desired Start Date/),{target:{value:'2027-10-15'}});view.unmount();render(<Post/>);
 expect(screen.getByLabelText(/Desired Start Date/)).toHaveValue('2027-10-15');fireEvent.click(screen.getByText('Continue'));fireEvent.click(screen.getByText('Review need'));expect(screen.getByRole('button',{name:'Sign in to continue'})).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Publish need'})).not.toBeInTheDocument();
});
test('does not prefill or save an anonymous draft for an account until explicit import',async()=>{
 writePostingSession(null,'new',{input:{orgName:'Anonymous organization',areaOfNeed:'school_improvement'},step:2});state.viewer={_id:'account-a',role:'district_admin'};
 render(<Post/>);expect(screen.getByLabelText('Organization Name *')).toHaveValue('');expect(state.save).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Import preview draft'}));expect(screen.getByLabelText(/Desired Start Date/)).toBeInTheDocument();fireEvent.click(screen.getByText('Back'));expect(screen.getByLabelText('Organization Name *')).toHaveValue('Anonymous organization');
});
test('isolates account form state and ignores an old account save result after switching',async()=>{
 state.viewer={_id:'account-a',role:'district_admin'};let resolve:(value:string)=>void=()=>{};state.save.mockImplementationOnce(()=>new Promise(r=>{resolve=r}));
 const view=render(<Post/>);fireEvent.change(screen.getByLabelText('Organization Name *'),{target:{value:'A private organization'}});fireEvent.change(screen.getByLabelText('Support Type *'),{target:{value:'school_improvement'}});fireEvent.click(screen.getByText('Save draft'));
 state.viewer={_id:'account-b',role:'district_admin'};view.rerender(<Post/>);expect(screen.getByLabelText('Organization Name *')).toHaveValue('');resolve('old-account-draft');await waitFor(()=>expect(state.save).toHaveBeenCalled());expect(state.replace).not.toHaveBeenCalled();
});

test('does not navigate away while publishing a saved draft',async()=>{
 state.viewer={_id:'account-a',role:'district_admin'};writePostingSession('account-a','new',{step:4,input:{orgName:'Synthetic QA',areaOfNeed:'school_improvement',subCategory:'strategic_planning',gradeLevel:'6_8',startDate:'2027-02-15',duration:'8 weeks',compensationRange:'$650',description:'A detailed scope with more than fifty characters for this synthetic need.'}});
 let finish:(value:string)=>void=()=>{};state.publish.mockImplementationOnce(()=>new Promise(r=>{finish=r}));render(<Post/>);fireEvent.click(screen.getByRole('button',{name:'Publish need'}));
 await waitFor(()=>expect(state.publish).toHaveBeenCalled());expect(state.replace).not.toHaveBeenCalled();finish('draft-id');
});
test('preserves a distinct legacy engagement type when resuming and saving a draft',async()=>{
 state.viewer={_id:'account-a',role:'district_admin'};writePostingSession('account-a','new',{step:1,input:{orgName:'Legacy draft',areaOfNeed:'school_improvement',engagementType:'legacy_unique'}});
 render(<Post/>);fireEvent.click(screen.getByText('Save draft'));await waitFor(()=>expect(state.save).toHaveBeenCalledWith(expect.objectContaining({engagementType:'legacy_unique'})));
});
test('associates validation errors with their named fields',()=>{
 render(<Post/>);fireEvent.click(screen.getByText('Preview the form'));fireEvent.click(screen.getByText('Continue'));
 const input=screen.getByLabelText('Organization Name *');expect(input).toHaveAttribute('aria-invalid','true');expect(input).toHaveAccessibleDescription('Organization name is required.');
});
test('lets the district remove an unavailable consultant without losing the draft',()=>{
 state.viewer={_id:'account-a',role:'district_admin'};state.params=new URLSearchParams('educator=unavailable&name=Untrusted');render(<Post/>);
 fireEvent.change(screen.getByLabelText('Organization Name *'),{target:{value:'Keep this organization'}});fireEvent.click(screen.getByRole('button',{name:'Remove selected consultant'}));
 expect(screen.getByLabelText('Organization Name *')).toHaveValue('Keep this organization');expect(state.replace).toHaveBeenCalledWith('/post',{scroll:false});
});
