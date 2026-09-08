import { TAXONOMY } from './taxonomy';
import type { NeedInput } from './need-publish-policy';
export type DirectoryState = {
    selectedAreas: string[]; selectedSpecializations: string[]; selectedGrades: string[];
    selectedRegions: string[]; selectedEngagements: string[];
    verifiedOnly: boolean; availableNow: boolean; showSavedOnly: boolean;
    sortOption: 'relevance' | 'availability' | 'rate';
};
export function readDirectoryState(params: URLSearchParams): DirectoryState {
    const list = (key: string, ids: string[]) => [...new Set(params.getAll(key).flatMap(v => v.split(',')).filter(v => ids.includes(v)))];
    return {
        selectedAreas: list('area', TAXONOMY.areasOfNeed.flatMap(v=>[v.id,...('aliases' in v?v.aliases:[])])),
        selectedSpecializations: list(params.has('specialization') ? 'specialization' : 'spec', TAXONOMY.areasOfNeed.flatMap(v=>v.subCategories.map(s=>s.id))),
        selectedGrades: list('grade', TAXONOMY.gradeLevelBands.map(v=>v.id)),
        selectedRegions: list(params.has('region') ? 'region' : 'location', TAXONOMY.coverageRegions.map(v=>v.id)),
        // Preserve distinct legacy engagement identifiers without coercing to consulting.
        selectedEngagements: [...new Set(params.getAll('engagement').filter(v=>/^[a-z0-9_-]{1,80}$/.test(v)))],
        verifiedOnly: params.get('reviewed') === '1', availableNow: params.get('availability') === 'accepting',
        showSavedOnly: params.get('saved') === '1',
        sortOption: params.get('sort') === 'rate' ? 'rate' : params.get('sort') === 'availability' ? 'availability' : 'relevance',
    };
}
export function writeDirectoryState(state: DirectoryState): string {
    const p = new URLSearchParams();
    for (const [key, values] of Object.entries({area:state.selectedAreas,specialization:state.selectedSpecializations,grade:state.selectedGrades,region:state.selectedRegions,engagement:state.selectedEngagements})) for(const value of values) p.append(key,value);
    if(state.verifiedOnly) p.set('reviewed','1'); if(state.availableNow) p.set('availability','accepting'); if(state.showSavedOnly) p.set('saved','1');
    if(state.sortOption!=='relevance') p.set('sort',state.sortOption);
    return p.toString();
}
export function localCalendarDay(date = new Date()): string { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
const savedKey = (id: string) => `k12gig:saved-consultants:${id}`;
export function readSavedConsultants(accountId: string | null): string[] {
    if(!accountId || typeof window==='undefined') return [];
    try { const parsed: unknown = JSON.parse(localStorage.getItem(savedKey(accountId)) ?? '[]');return Array.isArray(parsed) ? parsed.filter((v): v is string=>typeof v==='string') : []; } catch {return [];}
}
export function toggleSavedConsultant(accountId: string | null, educatorId: string): void {
    if(!accountId) return;
    const current=readSavedConsultants(accountId);const next=current.includes(educatorId)?current.filter(id=>id!==educatorId):[...current,educatorId];
    localStorage.setItem(savedKey(accountId),JSON.stringify(next));window.dispatchEvent(new Event('k12gig:saved-consultants'));
}
export type PostingSession = {input: NeedInput; step: number; educatorId?: string; draftId?: string};
const postKey=(accountId:string|null,context:string)=>`k12gig:post:${accountId ?? 'anonymous'}:${context}`;
export function readPostingSession(accountId:string|null,context:string): PostingSession|null {
    if(typeof window==='undefined') return null;
    try {const value=JSON.parse(sessionStorage.getItem(postKey(accountId,context))??'null');
        if(!value || !value.input || typeof value.input!=='object' || Array.isArray(value.input)) return null;
        const input=Object.fromEntries(Object.entries(value.input).filter(([key,v])=>['orgName','areaOfNeed','subCategory','gradeLevel','engagementType','startDate','duration','compensationRange','description','compensationBasis','location','deliveryMode','selectedEducatorId'].includes(key)&&typeof v==='string'));
        return {input,step:Math.max(1,Math.min(4,Number(value.step)||1)),...(typeof value.educatorId==='string'?{educatorId:value.educatorId}:{}),...(typeof value.draftId==='string'?{draftId:value.draftId}:{})};
    }catch{return null;}
}
export function writePostingSession(accountId:string|null,context:string,value:PostingSession):void {
    try {sessionStorage.setItem(postKey(accountId,context),JSON.stringify(value));}catch{/* Form remains usable if browser storage is unavailable. */}
}
export function clearPostingSession(accountId:string|null,context:string):void {try{sessionStorage.removeItem(postKey(accountId,context));}catch{}}
