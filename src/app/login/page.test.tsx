import {render,screen} from '@testing-library/react';
import {vi,it,expect} from 'vitest';
vi.mock('next/navigation',()=>({useSearchParams:()=>new URLSearchParams('next=%2Fdashboard%2Fengagements%2Fabc%3Fagreement%3Ddef%26version%3Dghi')}));
vi.mock('@/components/shared/site-header',()=>({SiteHeader:()=>null}));vi.mock('@/components/shared/site-footer',()=>({SiteFooter:()=>null}));
import Login from './page';
it('preserves the complete safe destination when choosing either account role',()=>{
 render(<Login/>);const links=screen.getAllByRole('link').filter(a=>a.getAttribute('href')?.startsWith('/sign-in'));
 expect(links).toHaveLength(2);for(const link of links) expect(new URL(link.getAttribute('href')!,'https://example.com').searchParams.get('next')).toBe('/dashboard/engagements/abc?agreement=def&version=ghi');
});
