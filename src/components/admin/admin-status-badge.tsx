import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AdminBadgeTone } from "@/lib/map-admin";

const toneClasses: Record<AdminBadgeTone, string> = {
    neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
};

export function AdminStatusBadge({ label, tone = "neutral" }: { label: string; tone?: AdminBadgeTone }) {
    return (
        <Badge variant="outline" className={cn("rounded-md font-bold", toneClasses[tone])}>
            {label}
        </Badge>
    );
}
