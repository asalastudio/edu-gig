import { cn } from "@/lib/utils";

type RateFieldProps = {
    amount: string;
    onAmountChange: (value: string) => void;
    hourly: boolean;
    onHourlyChange: (value: boolean) => void;
    daily: boolean;
    onDailyChange: (value: boolean) => void;
    label?: string;
    className?: string;
};

export function RateField({
    amount,
    onAmountChange,
    hourly,
    onHourlyChange,
    daily,
    onDailyChange,
    label = "Starting rate",
    className,
}: RateFieldProps) {
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-tertiary)]">$</span>
                <input
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(e) => onAmountChange(e.target.value)}
                    placeholder="95"
                    className="field-control !pl-8"
                />
            </div>
            <div className="flex flex-wrap gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                    <input
                        type="checkbox"
                        checked={hourly}
                        onChange={(e) => onHourlyChange(e.target.checked)}
                        className="h-4 w-4 rounded border-[var(--border-strong)] text-[var(--accent-primary)]"
                    />
                    Hourly
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                    <input
                        type="checkbox"
                        checked={daily}
                        onChange={(e) => onDailyChange(e.target.checked)}
                        className="h-4 w-4 rounded border-[var(--border-strong)] text-[var(--accent-primary)]"
                    />
                    Daily
                </label>
            </div>
        </div>
    );
}
