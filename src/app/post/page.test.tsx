import {render, screen, fireEvent} from '@testing-library/react';
import {vi, test, expect} from 'vitest';
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn()}),useSearchParams:()=>new URLSearchParams()}));
vi.mock('convex/react',()=>({useQuery:()=>null,useMutation:()=>vi.fn()}));
vi.mock('@/components/shared/site-header',()=>({SiteHeader:()=>null}));
vi.mock('@/components/shared/site-footer',()=>({SiteFooter:()=>null}));
import Post from './page';
test('posting date survives the logistics/details round-trip',()=>{
 render(<Post/>);fireEvent.click(screen.getByText('Preview the form'));
 fireEvent.change(screen.getByLabelText('Organization Name *'),{target:{value:'Synthetic QA'}});
 fireEvent.change(screen.getByLabelText('Support Type *'),{target:{value:'school_improvement'}});
 fireEvent.click(screen.getByText('Continue'));
 const date=screen.getByLabelText(/Desired Start Date/);fireEvent.change(date,{target:{value:'2027-10-15'}});
 fireEvent.change(screen.getByLabelText(/Duration/),{target:{value:'8 weeks'}});
 fireEvent.click(screen.getByText('Continue'));fireEvent.click(screen.getByText('Back'));
 expect(screen.getByLabelText(/Desired Start Date/)).toHaveValue('2027-10-15');
 expect(screen.getByLabelText(/Duration/)).toHaveValue('8 weeks');
});
