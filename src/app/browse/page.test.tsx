import {render,screen,cleanup} from '@testing-library/react';
import {vi,it,expect,beforeEach,afterEach} from 'vitest';
const state=vi.hoisted(()=>({params:new URLSearchParams(),viewer:null as { _id:string; role:string } | null,replace:vi.fn(),push:vi.fn()}));
vi.hoisted(()=>{process.env.NEXT_PUBLIC_USE_CONVEX_BROWSE='true'});
vi.mock('next/navigation',()=>({useRouter:()=>({replace:state.replace,push:state.push}),useSearchParams:()=>state.params}));
vi.mock('convex/react',()=>({useQuery:()=>state.viewer}));
vi.mock('@/components/shared/site-header',()=>({SiteHeader:()=>null}));vi.mock('@/components/shared/site-footer',()=>({SiteFooter:()=>null}));vi.mock('@/components/shared/sidebar',()=>({Sidebar:()=>null}));
import Browse from './page';
afterEach(cleanup);
beforeEach(()=>{state.viewer=null;state.params=new URLSearchParams('area=leadership_operations&specialization=keynote&sort=rate');});
it('renders one sign-in panel and retains complete directory context in its auth link',()=>{
 render(<Browse/>);expect(screen.getAllByRole('link',{name:/Create district account/i})).toHaveLength(1);
 expect(screen.getByRole('link',{name:'Sign in to browse'})).toHaveAttribute('href',expect.stringContaining(encodeURIComponent('/browse?area=leadership_operations&specialization=keynote&sort=rate')));
 expect(screen.getByRole('combobox',{name:'Sort consultants'})).toHaveValue('rate');
});

it('renders safe legacy filter fallback chips and keeps their auth round-trip',()=>{
 state.params=new URLSearchParams('area=legacy_unique&specialization=legacy_special');const {container}=render(<Browse/>);
 expect(screen.getByRole('button',{name:'legacy unique ×'})).toBeInTheDocument();expect(screen.getByRole('button',{name:'legacy special ×'})).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Sign in to browse'})).toHaveAttribute('href',expect.stringContaining(encodeURIComponent('/browse?area=legacy_unique&specialization=legacy_special')));
 expect(container.querySelector('a button')).toBeNull();expect(screen.getByRole('link',{name:'Sign in to browse'})).toHaveClass('focus-visible:ring-2');
});
