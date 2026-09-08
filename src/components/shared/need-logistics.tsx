const deliveryLabels:Record<string,string>={onsite:'On site',remote:'Remote',hybrid:'Hybrid',discuss:'Discuss with consultant'};
const basisLabels:Record<string,string>={hour:'Per hour',day:'Per day',project:'Project total',discuss:'To be discussed'};
export function NeedLogistics({need}:{need:{location?:string;deliveryMode?:string;compensationBasis?:string}}){
    const items=[['Location / remote expectations',need.location],['Delivery',need.deliveryMode ? deliveryLabels[need.deliveryMode] ?? need.deliveryMode:undefined],['Compensation basis',need.compensationBasis ? basisLabels[need.compensationBasis] ?? need.compensationBasis:undefined]];
    return <dl className="flex flex-wrap gap-4 text-sm">{items.filter(([,v])=>v).map(([label,value])=><div key={label}><dt className="font-semibold text-[var(--text-secondary)]">{label}</dt><dd>{value}</dd></div>)}</dl>;
}
