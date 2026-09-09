'use client';
import { useSyncExternalStore } from 'react';
import { readSavedConsultants, toggleSavedConsultant } from './discovery-state';
const subscribe=(callback:()=>void)=>{window.addEventListener('storage',callback);window.addEventListener('k12gig:saved-consultants',callback);return ()=>{window.removeEventListener('storage',callback);window.removeEventListener('k12gig:saved-consultants',callback);};};
export function useSavedConsultants(accountId:string|null){
    const serialized=useSyncExternalStore(subscribe,()=>JSON.stringify(readSavedConsultants(accountId)),()=> '[]');
    return {ids:JSON.parse(serialized) as string[],toggle:(id:string)=>toggleSavedConsultant(accountId,id)};
}
