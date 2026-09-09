'use client';
import {useState,useEffect,type Dispatch,type SetStateAction} from 'react';
/** Session drafts are private to the exact Clerk identity, never an email or role. */
export function useOwnedFormState<T extends string|number|boolean|string[]>(owner:string|null,field:string,initial:T):[T,Dispatch<SetStateAction<T>>] {
    const key=owner ? `k12gig:onboarding:${owner}:${field}` : null;
    const [value,setValue]=useState<T>(()=>{
        if(!key || typeof window==='undefined') return initial;
        try {const parsed:unknown=JSON.parse(sessionStorage.getItem(key)??'null');
            if(Array.isArray(initial)) return (Array.isArray(parsed)&&parsed.every(v=>typeof v==='string')?parsed:initial) as T;
            return (typeof parsed===typeof initial?parsed:initial) as T;
        }catch{return initial;}
    });
    useEffect(()=>{if(key) try{sessionStorage.setItem(key,JSON.stringify(value));}catch{}},[key,value]);
    return [value,setValue];
}
export function clearOwnedOnboarding(owner:string):void {
    try {const prefix=`k12gig:onboarding:${owner}:`;Object.keys(sessionStorage).filter(key=>key.startsWith(prefix)).forEach(key=>sessionStorage.removeItem(key));}catch{}
}
