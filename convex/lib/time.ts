export function startOfMonth(now: number) {
    const d = new Date(now);
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}
