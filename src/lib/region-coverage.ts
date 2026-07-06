// src/lib/region-coverage.ts
//
// County coverage for each Michigan service region (TAXONOMY.coverageRegions).
// Region ids match the official Michigan ISD map (see Regions Google Doc);
// Region 6 splits Wayne, Oakland, and Macomb out of Region 5.
//
// ⚠️ DRAFT DATA — the county-to-region assignments below were drafted from
// standard Michigan regional groupings and MUST be verified against Chris
// Brown's official region map before launch (PRD v3.0, Issue #2 / LIN-2).
// Edit this file only — the UI reads everything from REGION_COVERAGE.

export type RegionCoverage = {
    id: string;
    label: string;
    description: string;
    counties: string[];
};

export const REGION_COVERAGE: RegionCoverage[] = [
    {
        id: "region_1",
        label: "Region 1 — Upper Peninsula",
        description: "All fifteen Upper Peninsula counties.",
        counties: [
            "Alger", "Baraga", "Chippewa", "Delta", "Dickinson", "Gogebic",
            "Houghton", "Iron", "Keweenaw", "Luce", "Mackinac", "Marquette",
            "Menominee", "Ontonagon", "Schoolcraft",
        ],
    },
    {
        id: "region_2",
        label: "Region 2 — Northwest Lower Michigan",
        description: "Traverse City and the northwest Lower Peninsula.",
        counties: [
            "Antrim", "Benzie", "Charlevoix", "Emmet", "Grand Traverse",
            "Kalkaska", "Leelanau", "Manistee", "Missaukee", "Wexford",
        ],
    },
    {
        id: "region_3",
        label: "Region 3 — Northeast Lower Michigan",
        description: "Alpena, Gaylord, and the northeast Lower Peninsula.",
        counties: [
            "Alcona", "Alpena", "Cheboygan", "Crawford", "Iosco",
            "Montmorency", "Ogemaw", "Oscoda", "Otsego", "Presque Isle",
            "Roscommon",
        ],
    },
    {
        id: "region_4",
        label: "Region 4 — West & Central Michigan",
        description: "Grand Rapids, Kalamazoo, Mount Pleasant, and the west and central Lower Peninsula.",
        counties: [
            "Allegan", "Barry", "Berrien", "Branch", "Calhoun", "Cass",
            "Clare", "Gladwin", "Gratiot", "Ionia", "Isabella", "Kalamazoo",
            "Kent", "Lake", "Mason", "Mecosta", "Midland", "Montcalm",
            "Muskegon", "Newaygo", "Oceana", "Osceola", "Ottawa",
            "St. Joseph", "Van Buren",
        ],
    },
    {
        id: "region_5",
        label: "Region 5 — Southeast Michigan",
        description: "Lansing, Flint, Ann Arbor, Saginaw, and the Thumb — outside Metro Detroit.",
        counties: [
            "Arenac", "Bay", "Clinton", "Eaton", "Genesee", "Hillsdale",
            "Huron", "Ingham", "Jackson", "Lapeer", "Lenawee", "Livingston",
            "Monroe", "Saginaw", "Sanilac", "Shiawassee", "St. Clair",
            "Tuscola", "Washtenaw",
        ],
    },
    {
        id: "region_6",
        label: "Metro Detroit (Wayne, Oakland, Macomb)",
        description: "The tri-county Metro Detroit area.",
        counties: ["Wayne", "Oakland", "Macomb"],
    },
    {
        id: "all",
        label: "Statewide / Remote",
        description: "Every Michigan county, on-site or remote.",
        counties: [],
    },
];

export function coverageForRegion(id: string): RegionCoverage | undefined {
    return REGION_COVERAGE.find((region) => region.id === id);
}
