import {render,screen,cleanup} from '@testing-library/react';
import {vi,it,expect,afterEach} from 'vitest';
vi.mock('@/components/shared/site-header',()=>({SiteHeader:()=>null}));vi.mock('@/components/shared/site-footer',()=>({SiteFooter:()=>null}));vi.mock('@/components/shared/hero-search',()=>({HeroSearch:()=>null}));vi.mock('@/components/shared/category-tiles',()=>({CategoryTiles:()=>null}));
import Home from '@/app/page';import Help from '@/app/help/page';import Privacy from '@/app/privacy/page';
afterEach(cleanup);
it('does not promise instant hiring or unsupported nationwide adoption',()=>{const {container}=render(<Home/>);expect(container.textContent).not.toMatch(/zero days|Trusted by school districts nationwide|Vetted/i);});
it('explains real draft, credential review and agreement coordination tasks',()=>{const {container}=render(<Help/>);expect(container.querySelector('a button')).toBeNull();expect(screen.getByText(/preview draft.*import/i)).toBeInTheDocument();expect(screen.getByText(/credentials reviewed.*background/i)).toBeInTheDocument();});
it('describes supported privacy processing without platform booking or payment processing claims',()=>{const {container}=render(<Privacy/>);expect(container.textContent).not.toMatch(/support messaging and bookings|process\s+payments|payment processing|background-check workflows?/i);});
