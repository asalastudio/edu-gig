/** Roles that use the district hiring workspace and may access the live educator directory (Convex). */
const DISTRICT_ROLES = new Set([
    "district_admin",
    "district_hr",
    "superintendent",
    "superadmin",
]);

export function isDistrictRole(role: string | undefined): boolean {
    if (!role) return false;
    return DISTRICT_ROLES.has(role);
}
