import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {vi,it,expect,afterEach,beforeEach} from 'vitest';
import {getFunctionName} from 'convex/server';
import {readSavedConsultants} from '@/lib/discovery-state';
const s=vi.hoisted(()=>({viewer:{_id:'district-a',role:'district_admin'} as { _id:string; role:string } | null,push:vi.fn(),back:vi.fn(),params:new URLSearchParams('returnTo=%2Fbrowse%3Farea%3Dleadership_operations%26sort%3Drate')}));
vi.hoisted(()=>{process.env.NEXT_PUBLIC_USE_CONVEX_BROWSE='true'});
vi.mock('next/navigation',()=>({useParams:()=>({educatorId:'consultant-id'}),useSearchParams:()=>s.params,useRouter:()=>({push:s.push,back:s.back,replace:vi.fn()})}));
vi.mock('convex/react',()=>({useQuery:(ref:Parameters<typeof getFunctionName>[0])=>{
 switch(getFunctionName(ref)){case 'users:viewer':return s.viewer;case 'educators:getProfileForDistrict':return {educator:{_id:'consultant-id',userId:'consultant-user',headline:'Consultant headline',bio:'A real professional biography',gradeLevelBands:['6_8'],areasOfNeed:['leadership_operations'],coverageRegions:['region_2'],engagementTypes:['consulting'],verificationStatus:'premier',profileCompletePct:100,hourlyRate:95,dailyRate:650,availabilityStatus:'limited'},user:{_id:'consultant-user',firstName:'Avery',lastName:'Consultant'}};case 'credentials:listForEducatorProfile':return [{_id:'credential-id',type:'Certificate',name:'Teaching certificate',issuer:'State registry',reviewed:true,verified:false}];case 'gigs:listActiveByEducatorForDistrict':return [];default:return null;}
}}));
vi.mock('@/components/shared/site-header',()=>({SiteHeader:()=>null}));vi.mock('@/components/shared/site-footer',()=>({SiteFooter:()=>null}));vi.mock('@/components/shared/sidebar',()=>({Sidebar:()=>null}));
import Profile from './page';
import {TooltipProvider} from '@/components/ui/tooltip';
afterEach(cleanup);beforeEach(()=>{localStorage.clear();s.viewer={_id:'district-a',role:'district_admin'};s.push.mockClear();});
it('preserves profile opening, About/Credentials/Resume, exact messaging target and both rate units',()=>{
 render(<TooltipProvider><Profile/></TooltipProvider>);expect(screen.getByText('A real professional biography')).toBeInTheDocument();expect(screen.getByRole('tab',{name:/Credentials/})).toBeInTheDocument();expect(screen.getByRole('tab',{name:/Resume/})).toBeInTheDocument();expect(screen.getAllByText('$95/hr · $650/day').length).toBeGreaterThan(0);
 fireEvent.click(screen.getAllByRole('button',{name:'Message Consultant'})[0]);expect(s.push).toHaveBeenCalledWith('/dashboard/messages?to=consultant-user&name=Avery%20Consultant');
});
it('saves only to the current district and returns to the exact filtered directory',()=>{
 const view=render(<TooltipProvider><Profile/></TooltipProvider>);fireEvent.click(screen.getAllByRole('button',{name:/Save to List/})[0]);expect(readSavedConsultants('district-a')).toEqual(['consultant-id']);
 s.viewer={_id:'district-b',role:'district_admin'};view.rerender(<TooltipProvider><Profile/></TooltipProvider>);expect(screen.getAllByRole('button',{name:/Save to List/}).length).toBeGreaterThan(0);
 expect(screen.getByRole('link',{name:/Back to Browse/})).toHaveAttribute('href','/browse?area=leadership_operations&sort=rate');
});

it('labels reviewed credential evidence without a broader verified claim',()=>{
 render(<TooltipProvider><Profile/></TooltipProvider>);fireEvent.mouseDown(screen.getByRole('tab',{name:/Credentials/}),{button:0,ctrlKey:false});
 expect(screen.getByRole('cell',{name:'Credentials reviewed'})).toBeInTheDocument();expect(screen.queryByText('Verified',{exact:true})).not.toBeInTheDocument();
});
