import { ShieldCheck, BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const tierConfig = {
    basic: { icon: null, color: "text-[var(--text-tertiary)]", title: "Basic Profile" },
    verified: { icon: ShieldCheck, color: "text-[var(--accent-info)]", title: "Verified Educator" },
    premier: { icon: BadgeCheck, color: "text-[var(--accent-secondary)]", title: "Premier Educator" },
}

export function VerificationBadge({ tier }: { tier: keyof typeof tierConfig }) {
    const config = tierConfig[tier]
    if (!config.icon) return null
    const Icon = config.icon
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="inline-flex">
                    <Icon className={cn("h-4 w-4", config.color)} />
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">{config.title}</TooltipContent>
        </Tooltip>
    )
}
