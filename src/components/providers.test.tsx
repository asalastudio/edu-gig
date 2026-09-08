import {render,screen,fireEvent} from '@testing-library/react';
import {useState,StrictMode,type ReactNode} from 'react';
import {vi,it,expect} from 'vitest';
const state=vi.hoisted(()=>({auth:{isLoaded:true,userId:'account-a',sessionId:'session-a'},clients:0,closed:0,linker:vi.fn()}));
vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY','pk_test_placeholder');
vi.mock('@clerk/nextjs',()=>({ClerkProvider:({children}:{children:ReactNode})=>children,useAuth:()=>state.auth}));
vi.mock('convex/react',()=>({ConvexReactClient:class{constructor(){state.clients++}close=()=>{state.closed++}},ConvexProvider:({children}:{children:ReactNode})=>children}));
vi.mock('convex/react-clerk',()=>({ConvexProviderWithClerk:({children}:{children:ReactNode})=>children}));
vi.mock('@/components/monitoring-init',()=>({MonitoringInit:()=>null}));
vi.mock('@/components/seed-account-linker',()=>({SeedAccountLinker:()=>{state.linker();return null}}));
import {Providers} from './providers';
function Form(){const [value,setValue]=useState('');return <input aria-label="Private draft" value={value} onChange={e=>setValue(e.target.value)}/>}
it('discards old account component state and query client on identity switch without claiming demo rows',()=>{
 const view=render(<Providers><Form/></Providers>);fireEvent.change(screen.getByLabelText('Private draft'),{target:{value:'Account A'}});
 const clients=state.clients;state.auth={isLoaded:true,userId:'account-b',sessionId:'session-b'};view.rerender(<Providers><Form/></Providers>);
 expect(screen.getByLabelText('Private draft')).toHaveValue('');expect(state.clients).toBeGreaterThan(clients);expect(state.linker).not.toHaveBeenCalled();
});

it("keeps a usable query client through Strict Mode effect replay",()=>{state.closed=0;render(<StrictMode><Providers><Form/></Providers></StrictMode>);expect(state.closed).toBe(0);});
