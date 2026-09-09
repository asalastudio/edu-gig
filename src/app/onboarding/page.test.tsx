import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {vi,it,expect,afterEach,beforeEach} from 'vitest';
const s=vi.hoisted(()=>({params:new URLSearchParams('intent=educator'),user:{id:'clerk-a',firstName:'Avery',lastName:'User'},replace:vi.fn()}));
vi.hoisted(()=>{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY='pk_test_placeholder'});
vi.mock('@clerk/nextjs',()=>({useUser:()=>({user:s.user,isLoaded:true}),useAuth:()=>({getToken:vi.fn()})}));
vi.mock('next/navigation',()=>({useRouter:()=>({replace:s.replace,push:vi.fn()}),useSearchParams:()=>s.params}));
vi.mock('convex/react',()=>({useQuery:()=>null,useMutation:()=>vi.fn()}));
vi.mock('@/components/shared/site-header',()=>({SiteHeader:()=>null}));vi.mock('@/components/shared/site-footer',()=>({SiteFooter:()=>null}));
import Onboarding from './page';
afterEach(cleanup);beforeEach(()=>{sessionStorage.clear();s.params=new URLSearchParams("intent=educator");});
it('starts fresh experience without fabricated years and keeps the current provider name',()=>{
 render(<Onboarding/>);expect(screen.getByLabelText('First name')).toHaveValue('Avery');expect(screen.getByLabelText(/Years/)).toHaveValue(null);
});
it('starts district state and region without silently selecting Michigan defaults',()=>{
 s.params=new URLSearchParams('intent=district');render(<Onboarding/>);fireEvent.click(screen.getByRole('button',{name:/Continue/}));
 expect(screen.getByLabelText('State')).toHaveValue('');expect(screen.getByLabelText('Location by region')).toHaveValue('');
});
it('keeps independently entered hourly and daily amounts through Back and review',()=>{
 s.params=new URLSearchParams('intent=educator');render(<Onboarding/>);
 fireEvent.change(screen.getByLabelText('Professional headline'),{target:{value:'Experienced curriculum consultant'}});
 fireEvent.change(screen.getByLabelText('Years in education'),{target:{value:'8'}});
 fireEvent.change(screen.getByLabelText('Short district-facing bio'),{target:{value:'I help school teams plan practical curriculum improvements with clear instructional steps.'}});
 fireEvent.click(screen.getByRole('button',{name:/Continue/}));fireEvent.click(screen.getByRole('button',{name:'AI & Educational Technology'}));fireEvent.click(screen.getByRole('button',{name:'6–8'}));fireEvent.click(screen.getByRole('button',{name:/Continue/}));
 fireEvent.change(screen.getByLabelText('Hourly rate (USD per hour)'),{target:{value:'95'}});fireEvent.change(screen.getByLabelText('Daily rate (USD per day)'),{target:{value:'650'}});
 fireEvent.click(screen.getByRole('button',{name:'Back'}));fireEvent.click(screen.getByRole('button',{name:/Continue/}));expect(screen.getByLabelText('Hourly rate (USD per hour)')).toHaveValue(95);expect(screen.getByLabelText('Daily rate (USD per day)')).toHaveValue(650);
});
it('restores this Clerk account own intentional edits on refresh and clears them for another identity',()=>{
 s.params=new URLSearchParams('intent=educator');sessionStorage.clear();s.user={id:'clerk-a',firstName:'Avery',lastName:'User'};
 const view=render(<Onboarding/>);fireEvent.change(screen.getByLabelText('Professional headline'),{target:{value:'Intentional current account headline'}});view.unmount();
 const again=render(<Onboarding/>);expect(screen.getByLabelText('Professional headline')).toHaveValue('Intentional current account headline');
 s.user={id:'clerk-b',firstName:'Blair',lastName:'User'};again.rerender(<Onboarding/>);expect(screen.getByLabelText('Professional headline')).toHaveValue('');expect(screen.getByLabelText('First name')).toHaveValue('Blair');
});
it('lets a fresh consultant select Keynote speaking with the existing taxonomy id',()=>{
 render(<Onboarding/>);fireEvent.change(screen.getByLabelText('Professional headline'),{target:{value:'Experienced leadership consultant'}});fireEvent.change(screen.getByLabelText('Years in education'),{target:{value:'8'}});fireEvent.change(screen.getByLabelText('Short district-facing bio'),{target:{value:'I help school teams plan practical leadership improvements through keynote presentations.'}});fireEvent.click(screen.getByRole('button',{name:/Continue/}));
 fireEvent.click(screen.getByRole('button',{name:'Leadership & Operations'}));fireEvent.click(screen.getByRole('button',{name:'Keynote speaking'}));expect(screen.getByRole('button',{name:'Keynote speaking'})).toHaveAttribute('aria-pressed','true');
});
